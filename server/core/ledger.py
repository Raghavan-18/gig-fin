"""
Double-entry ledger.  IMPLEMENTATION_PLAN.md §C1 / ARCHITECTURE.md §4.2.

Design rules that survive from the production design:
  * append-only postings; corrections are reversals, never updates
  * every transaction's postings sum to zero
  * user-facing accounts can never go negative -- an overdraw is a FAILED
    TRANSACTION, not a negative balance (this is what stops the demo from
    ever showing an impossible state)
  * every write is idempotent on a caller-supplied key

Amounts are integer minor units (paise). No float ever touches an amount.
"""
from __future__ import annotations

import functools
import json
import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass

DR = "DR"
CR = "CR"

# Accounts whose balance must never go negative.
USER_ACCOUNT_TYPES = ("USER_SETTLEMENT", "USER_BUCKET", "SINKING_FUND")

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
    account_id   TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    type         TEXT NOT NULL,
    name         TEXT NOT NULL,
    currency     TEXT NOT NULL DEFAULT 'INR',
    status       TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS transactions (
    txn_id          TEXT PRIMARY KEY,
    type            TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    status          TEXT NOT NULL,
    created_at      REAL NOT NULL,
    occurred_on     TEXT,
    metadata        TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS postings (
    posting_id   TEXT PRIMARY KEY,
    txn_id       TEXT NOT NULL REFERENCES transactions(txn_id),
    account_id   TEXT NOT NULL REFERENCES accounts(account_id),
    direction    TEXT NOT NULL CHECK (direction IN ('DR','CR')),
    amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
    created_at   REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_postings_txn ON postings(txn_id);
CREATE INDEX IF NOT EXISTS ix_postings_acct ON postings(account_id);

-- Materialised projection. Rebuildable from postings at any time (rebuild()).
-- The CHECK is the invariant that makes an overdraw impossible rather than
-- merely unlikely.
CREATE TABLE IF NOT EXISTS balances (
    account_id     TEXT PRIMARY KEY REFERENCES accounts(account_id),
    available_minor INTEGER NOT NULL DEFAULT 0,
    reserved_minor  INTEGER NOT NULL DEFAULT 0,
    version         INTEGER NOT NULL DEFAULT 0,
    updated_at      REAL NOT NULL,
    constrained     INTEGER NOT NULL DEFAULT 1,
    CHECK (reserved_minor >= 0),
    CHECK (constrained = 0 OR available_minor >= 0)
);

CREATE TABLE IF NOT EXISTS reservations (
    reservation_id TEXT PRIMARY KEY,
    account_id     TEXT NOT NULL REFERENCES accounts(account_id),
    amount_minor   INTEGER NOT NULL CHECK (amount_minor > 0),
    status         TEXT NOT NULL,
    created_at     REAL NOT NULL
);
"""


class LedgerError(Exception):
    """A transaction was refused. The ledger is still consistent."""


class InsufficientFunds(LedgerError):
    pass


@dataclass(frozen=True)
class Leg:
    account_id: str
    direction: str
    amount_minor: int


def _locked(fn):
    """Serialise a Ledger method on the instance lock.

    Reentrant, so a method that opens a transaction via _tx() re-acquires
    the same lock harmlessly.
    """
    @functools.wraps(fn)
    def wrapper(self, *a, **kw):
        with self._lock:
            return fn(self, *a, **kw)
    return wrapper


class Ledger:
    def __init__(self, db_path: str = "data/dhara.db"):
        self.db_path = db_path
        # FastAPI runs sync endpoints on an anyio threadpool, so requests do
        # not land on the thread that opened this connection. sqlite3 forbids
        # that by default and raises ProgrammingError mid-request. We allow
        # cross-thread use and serialise every operation on a reentrant lock
        # instead -- the lock spans whole transactions, not single statements,
        # so two threads can never interleave a BEGIN IMMEDIATE.
        self._lock = threading.RLock()
        self.conn = sqlite3.connect(db_path, isolation_level=None,
                                    check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)

    # ---------------------------------------------------------- accounts
    @_locked
    def open_account(self, account_id: str, user_id: str, acct_type: str,
                     name: str) -> str:
        constrained = 1 if acct_type in USER_ACCOUNT_TYPES else 0
        with self._tx():
            self.conn.execute(
                "INSERT OR IGNORE INTO accounts(account_id,user_id,type,name) "
                "VALUES (?,?,?,?)", (account_id, user_id, acct_type, name))
            self.conn.execute(
                "INSERT OR IGNORE INTO balances(account_id,updated_at,constrained) "
                "VALUES (?,?,?)", (account_id, time.time(), constrained))
        return account_id

    @_locked
    def accounts(self, user_id: str | None = None) -> list[sqlite3.Row]:
        q = "SELECT a.*, b.available_minor, b.reserved_minor FROM accounts a " \
            "JOIN balances b USING(account_id)"
        if user_id:
            return self.conn.execute(q + " WHERE a.user_id=?", (user_id,)).fetchall()
        return self.conn.execute(q).fetchall()

    @_locked
    def balance(self, account_id: str) -> int:
        r = self.conn.execute(
            "SELECT available_minor FROM balances WHERE account_id=?",
            (account_id,)).fetchone()
        return r["available_minor"] if r else 0

    @_locked
    def reserved(self, account_id: str) -> int:
        r = self.conn.execute(
            "SELECT reserved_minor FROM balances WHERE account_id=?",
            (account_id,)).fetchone()
        return r["reserved_minor"] if r else 0

    # ------------------------------------------------------------ posting
    @_locked
    def post(self, txn_type: str, idempotency_key: str, legs: list[Leg],
             occurred_on: str | None = None, metadata: dict | None = None) -> str:
        """Post a balanced transaction. Idempotent on idempotency_key.

        Returns the txn_id. Replaying the same key is a no-op that returns the
        original txn_id -- this is what makes a retried sweep move money once.
        """
        existing = self.conn.execute(
            "SELECT txn_id FROM transactions WHERE idempotency_key=?",
            (idempotency_key,)).fetchone()
        if existing:
            return existing["txn_id"]

        if not legs:
            raise LedgerError("a transaction needs at least two postings")
        net = sum(l.amount_minor if l.direction == CR else -l.amount_minor
                  for l in legs)
        if net != 0:
            raise LedgerError(
                f"unbalanced transaction: DR/CR differ by {net} minor units")

        txn_id = "txn_" + uuid.uuid4().hex[:16]
        now = time.time()
        try:
            with self._tx():
                self.conn.execute(
                    "INSERT INTO transactions(txn_id,type,idempotency_key,status,"
                    "created_at,occurred_on,metadata) VALUES (?,?,?,?,?,?,?)",
                    (txn_id, txn_type, idempotency_key, "SETTLED", now,
                     occurred_on, json.dumps(metadata or {})))
                for l in legs:
                    self.conn.execute(
                        "INSERT INTO postings(posting_id,txn_id,account_id,"
                        "direction,amount_minor,created_at) VALUES (?,?,?,?,?,?)",
                        ("pst_" + uuid.uuid4().hex[:16], txn_id, l.account_id,
                         l.direction, l.amount_minor, now))
                    delta = l.amount_minor if l.direction == CR else -l.amount_minor
                    self.conn.execute(
                        "UPDATE balances SET available_minor=available_minor+?,"
                        "version=version+1,updated_at=? WHERE account_id=?",
                        (delta, now, l.account_id))
        except sqlite3.IntegrityError as e:
            # The CHECK(available_minor >= 0) fired: the whole transaction is
            # rolled back and no money moved.
            if "available_minor" in str(e) or "CHECK" in str(e).upper():
                raise InsufficientFunds(
                    "transaction would overdraw a user account; refused") from e
            raise LedgerError(str(e)) from e
        return txn_id

    # ------------------------------------------------------- reservations
    @_locked
    def reserve(self, account_id: str, amount_minor: int) -> str:
        """Move value available -> reserved. Never overdraws."""
        if amount_minor <= 0:
            raise LedgerError("reservation must be positive")
        rid = "rsv_" + uuid.uuid4().hex[:16]
        now = time.time()
        try:
            with self._tx():
                self.conn.execute(
                    "UPDATE balances SET available_minor=available_minor-?,"
                    "reserved_minor=reserved_minor+?,version=version+1,updated_at=? "
                    "WHERE account_id=?", (amount_minor, amount_minor, now, account_id))
                self.conn.execute(
                    "INSERT INTO reservations(reservation_id,account_id,amount_minor,"
                    "status,created_at) VALUES (?,?,?,?,?)",
                    (rid, account_id, amount_minor, "HELD", now))
        except sqlite3.IntegrityError as e:
            raise InsufficientFunds(
                f"cannot reserve {amount_minor}: insufficient available balance") from e
        return rid

    @_locked
    def _close_reservation(self, reservation_id: str, status: str,
                           give_back: bool) -> sqlite3.Row:
        r = self.conn.execute("SELECT * FROM reservations WHERE reservation_id=?",
                              (reservation_id,)).fetchone()
        if r is None or r["status"] != "HELD":
            raise LedgerError(f"reservation {reservation_id} is not held")
        now = time.time()
        with self._tx():
            self.conn.execute(
                "UPDATE balances SET reserved_minor=reserved_minor-?,"
                + ("available_minor=available_minor+?," if give_back else "")
                + "version=version+1,updated_at=? WHERE account_id=?",
                ((r["amount_minor"], r["amount_minor"], now, r["account_id"])
                 if give_back else (r["amount_minor"], now, r["account_id"])))
            self.conn.execute("UPDATE reservations SET status=? WHERE reservation_id=?",
                              (status, reservation_id))
        return r

    @_locked
    def release(self, reservation_id: str) -> None:
        """Compensating path: hand the money back, untouched."""
        self._close_reservation(reservation_id, "RELEASED", give_back=True)

    @_locked
    def commit_reservation(self, reservation_id: str, txn_type: str,
                           idempotency_key: str, credit_account: str,
                           occurred_on: str | None = None,
                           metadata: dict | None = None) -> str:
        """Consume a reservation and land the value in credit_account."""
        r = self._close_reservation(reservation_id, "COMMITTED", give_back=False)
        amt = r["amount_minor"]
        now = time.time()
        txn_id = "txn_" + uuid.uuid4().hex[:16]
        existing = self.conn.execute(
            "SELECT txn_id FROM transactions WHERE idempotency_key=?",
            (idempotency_key,)).fetchone()
        if existing:
            return existing["txn_id"]
        with self._tx():
            self.conn.execute(
                "INSERT INTO transactions(txn_id,type,idempotency_key,status,"
                "created_at,occurred_on,metadata) VALUES (?,?,?,?,?,?,?)",
                (txn_id, txn_type, idempotency_key, "SETTLED", now, occurred_on,
                 json.dumps(metadata or {})))
            # the DR leg was already taken out of `available` by reserve()
            self.conn.execute(
                "INSERT INTO postings(posting_id,txn_id,account_id,direction,"
                "amount_minor,created_at) VALUES (?,?,?,?,?,?)",
                ("pst_" + uuid.uuid4().hex[:16], txn_id, r["account_id"], DR, amt, now))
            self.conn.execute(
                "INSERT INTO postings(posting_id,txn_id,account_id,direction,"
                "amount_minor,created_at) VALUES (?,?,?,?,?,?)",
                ("pst_" + uuid.uuid4().hex[:16], txn_id, credit_account, CR, amt, now))
            self.conn.execute(
                "UPDATE balances SET available_minor=available_minor+?,version=version+1,"
                "updated_at=? WHERE account_id=?", (amt, now, credit_account))
        return txn_id

    # ---------------------------------------------------------- integrity
    @_locked
    def verify(self) -> dict:
        """Audit every invariant. Returns a report; empty violations == healthy."""
        violations: list[str] = []

        unbalanced = self.conn.execute("""
            SELECT txn_id, SUM(CASE direction WHEN 'CR' THEN amount_minor
                                              ELSE -amount_minor END) AS net
            FROM postings GROUP BY txn_id HAVING net != 0""").fetchall()
        for row in unbalanced:
            violations.append(f"transaction {row['txn_id']} nets {row['net']}, not 0")

        negative = self.conn.execute(
            "SELECT account_id, available_minor FROM balances "
            "WHERE constrained=1 AND available_minor < 0").fetchall()
        for row in negative:
            violations.append(
                f"account {row['account_id']} is negative ({row['available_minor']})")

        drift = self.conn.execute("""
            SELECT b.account_id, b.available_minor, b.reserved_minor,
                   COALESCE(SUM(CASE p.direction WHEN 'CR' THEN p.amount_minor
                                                 ELSE -p.amount_minor END),0) AS posted
            FROM balances b LEFT JOIN postings p USING(account_id)
            GROUP BY b.account_id""").fetchall()
        for row in drift:
            expected = row["posted"] - row["reserved_minor"]
            if row["available_minor"] != expected:
                violations.append(
                    f"account {row['account_id']}: balance {row['available_minor']} "
                    f"!= postings {row['posted']} - reserved {row['reserved_minor']}")

        return {
            "healthy": not violations,
            "violations": violations,
            "accounts": len(drift),
            "transactions": self.conn.execute(
                "SELECT COUNT(*) c FROM transactions").fetchone()["c"],
            "postings": self.conn.execute(
                "SELECT COUNT(*) c FROM postings").fetchone()["c"],
        }

    @_locked
    def rebuild(self) -> None:
        """Recompute every balance from the append-only postings."""
        now = time.time()
        with self._tx():
            self.conn.execute(
                "UPDATE balances SET available_minor = COALESCE(("
                "  SELECT SUM(CASE p.direction WHEN 'CR' THEN p.amount_minor "
                "              ELSE -p.amount_minor END)"
                "  FROM postings p WHERE p.account_id = balances.account_id),0)"
                " - reserved_minor, updated_at=?", (now,))

    # -------------------------------------------------------------- misc
    def _tx(self):
        return _Tx(self.conn, self._lock)

    def close(self) -> None:
        self.conn.close()


class _Tx:
    def __init__(self, conn, lock):
        self.conn = conn
        self.lock = lock

    def __enter__(self):
        self.lock.acquire()
        try:
            self.conn.execute("BEGIN IMMEDIATE")
        except BaseException:
            self.lock.release()
            raise
        return self.conn

    def __exit__(self, exc_type, exc, tb):
        try:
            if exc_type is None:
                self.conn.execute("COMMIT")
            else:
                self.conn.execute("ROLLBACK")
        finally:
            self.lock.release()
        return False


def rupees(minor: int) -> str:
    """Format paise as an Indian-grouped rupee string."""
    neg = minor < 0
    s = f"{abs(minor) // 100:,}"
    # Indian grouping: last 3, then pairs
    if len(s.replace(",", "")) > 3:
        digits = s.replace(",", "")
        head, tail = digits[:-3], digits[-3:]
        parts = []
        while len(head) > 2:
            parts.insert(0, head[-2:]); head = head[:-2]
        if head:
            parts.insert(0, head)
        s = ",".join(parts + [tail])
    return ("-" if neg else "") + "Rs " + s
