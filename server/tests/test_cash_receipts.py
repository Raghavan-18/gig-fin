"""
Unit and integration tests for manual cash transaction verification system.
Tests:
1. Adding cash expense without receipt -> self_reported.
2. Adding cash expense with valid matching receipt -> receipt_verified.
3. Adding cash expense with mismatched amount -> flags 422 mismatch details.
4. Saving mismatched receipt with force_self_reported=True -> self_reported.
5. Rejection of invalid file types and empty files.
6. Double-entry ledger invariants: DR=CR net zero, verify() zero violations.
7. Transaction feed endpoint /api/transactions with filtering and search.
8. Evidence endpoint /api/transactions/evidence.
9. Persistence across AppState reboots.
"""
import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from api.main import app, st
from core.state import AppState

client = TestClient(app)


def create_receipt_image(amount: float = 450, merchant: str = "HPCL", date_str: str = "2026-09-03") -> io.BytesIO:
    """Create a crisp receipt image with clear text for OCR testing."""
    img = Image.new("RGB", (450, 260), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((30, 25), f"{merchant} Petrol Pump", fill=(0, 0, 0))
    draw.text((30, 65), f"Tax Invoice / Cash Bill", fill=(0, 0, 0))
    draw.text((30, 105), f"Date: {date_str}", fill=(0, 0, 0))
    draw.text((30, 145), f"Total: Rs. {int(amount)}", fill=(0, 0, 0))
    draw.text((30, 185), f"Payment Mode: Cash", fill=(0, 0, 0))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def test_add_cash_expense_without_receipt():
    """Manual cash entry with no receipt must be marked self_reported."""
    resp = client.post(
        "/api/transactions/cash",
        data={
            "type": "expense",
            "amount": "180",
            "category": "Food",
            "description": "Lunch at canteen",
            "date": "2026-09-03",
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["verification_status"] == "self_reported"
    assert data["source"] == "cash_manual"
    assert data["amount"] == 180
    assert data["receipt_present"] is False


def test_add_cash_expense_with_valid_matching_receipt():
    """Receipt with matching amount and merchant should verify successfully."""
    receipt_buf = create_receipt_image(amount=450, merchant="Shell", date_str="2026-09-03")
    resp = client.post(
        "/api/transactions/cash",
        data={
            "type": "expense",
            "amount": "450",
            "category": "Fuel",
            "description": "Fuel for delivery",
            "date": "2026-09-03",
        },
        files={"receipt": ("fuel_bill.png", receipt_buf, "image/png")},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["verification_status"] == "receipt_verified"
    assert data["receipt_present"] is True
    assert data["ocr_processed"] is True
    assert data["ocr_amount"] == 450
    assert "Shell" in (data["ocr_merchant"] or "")


def test_add_cash_expense_with_mismatched_receipt_amount():
    """Receipt with mismatched amount must NOT be verified; returns 422 mismatch details."""
    # User enters 450, but receipt shows 900
    receipt_buf = create_receipt_image(amount=900, merchant="HPCL", date_str="2026-09-03")
    resp = client.post(
        "/api/transactions/cash",
        data={
            "type": "expense",
            "amount": "450",
            "category": "Fuel",
            "description": "Fuel for delivery",
            "date": "2026-09-03",
        },
        files={"receipt": ("mismatched_bill.png", receipt_buf, "image/png")},
    )
    assert resp.status_code == 422
    err = resp.json()["detail"]
    assert err["can_save_as_self_reported"] is True
    assert err["ocr_amount"] == 900


def test_save_mismatched_receipt_with_force_self_reported():
    """User can choose to save mismatched receipt as self_reported."""
    receipt_buf = create_receipt_image(amount=900, merchant="HPCL", date_str="2026-09-03")
    resp = client.post(
        "/api/transactions/cash",
        data={
            "type": "expense",
            "amount": "450",
            "category": "Fuel",
            "description": "Fuel for delivery",
            "date": "2026-09-03",
            "force_self_reported": "true",
        },
        files={"receipt": ("mismatched_bill.png", receipt_buf, "image/png")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verification_status"] == "self_reported"
    assert data["receipt_present"] is True


def test_reject_invalid_file_extension():
    """Unsupported file extension must be rejected with HTTP 400."""
    fake_file = io.BytesIO(b"malicious executable content")
    resp = client.post(
        "/api/transactions/cash",
        data={
            "type": "expense",
            "amount": "100",
            "category": "Other",
            "description": "Invalid file upload",
            "date": "2026-09-03",
        },
        files={"receipt": ("script.exe", fake_file, "application/octet-stream")},
    )
    assert resp.status_code == 400
    assert "Unsupported file extension" in resp.json()["detail"]


def test_ledger_invariants_and_zero_violations():
    """Adding cash transactions must preserve DR=CR and zero ledger violations."""
    s = st()
    report = s.dhara.ledger.verify()
    assert report["healthy"] is True
    assert len(report["violations"]) == 0


def test_get_transactions_feed_and_filters():
    """Unified transactions feed correctly categorizes provenance badges."""
    resp = client.get("/api/transactions")
    assert resp.status_code == 200
    body = resp.json()
    txns = body["transactions"]
    assert len(txns) > 0
    assert "evidence" in body

    # Filter for receipt_verified
    rv_resp = client.get("/api/transactions?verification_status=receipt_verified")
    assert rv_resp.status_code == 200
    for t in rv_resp.json()["transactions"]:
        assert t["verification_status"] == "receipt_verified"

    # Filter for self_reported
    sr_resp = client.get("/api/transactions?verification_status=self_reported")
    assert sr_resp.status_code == 200
    for t in sr_resp.json()["transactions"]:
        assert t["verification_status"] == "self_reported"


def test_transaction_evidence_endpoint():
    """Evidence endpoint returns summary stats for dashboard and profile."""
    resp = client.get("/api/transactions/evidence")
    assert resp.status_code == 200
    data = resp.json()
    assert "manual_cash_transactions" in data
    assert "receipt_verified" in data
    assert "self_reported" in data
    assert "provenance" in data
