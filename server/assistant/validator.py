"""
The numeric validator.  IMPLEMENTATION_PLAN.md §C7 / ARCHITECTURE.md §4.4.

The assistant is an EXPLAINER, not a calculator. Every figure it states must
have come out of a deterministic tool call in the same turn. This module is the
enforcement: it extracts every digit-string from a draft answer and refuses the
draft unless each one traces to a tool result.

Why digits specifically: the model is instructed to spell structural counts as
words ("three options", "the fifth"), so any DIGIT in the output is a factual
claim about the user's money and must be sourced. That rule is what makes strict
validation practical rather than constantly firing on "3 options".

On a violation: block, log, regenerate once, then fall back to a deterministic
template. A wrong number about someone's money is a financial harm, so the
failure mode is "say less", never "guess".
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

NUMBER_RE = re.compile(r"\d[\d,]*(?:\.\d+)?")
TOLERANCE = 0.51            # absorbs rounding to the nearest rupee


@dataclass
class ValidationResult:
    ok: bool
    unmatched: list[str] = field(default_factory=list)
    found: list[str] = field(default_factory=list)
    allowed_count: int = 0

    def to_dict(self) -> dict:
        return {"ok": self.ok, "unmatched": self.unmatched,
                "found": self.found, "allowed_count": self.allowed_count}


def _walk(obj, out: list[float]):
    if isinstance(obj, bool):
        return
    if isinstance(obj, (int, float)):
        out.append(float(obj))
    elif isinstance(obj, str):
        for m in NUMBER_RE.finditer(obj):
            try:
                out.append(float(m.group().replace(",", "")))
            except ValueError:
                pass
    elif isinstance(obj, dict):
        for v in obj.values():
            _walk(v, out)
    elif isinstance(obj, (list, tuple)):
        for v in obj:
            _walk(v, out)


def numeric_closure(tool_results) -> set[float]:
    """Every value a faithful answer could legitimately state.

    Includes the raw values plus the format-preserving transforms a natural
    answer applies: rounding, minor<->major units, and fraction<->percent.
    """
    raw: list[float] = []
    _walk(tool_results, raw)

    allowed: set[float] = set()
    for v in raw:
        allowed.add(v)
        allowed.add(round(v))
        allowed.add(round(v, 1))
        allowed.add(round(v, 2))
        allowed.add(float(int(v)))          # truncation
        allowed.add(v / 100)                # paise -> rupees
        allowed.add(round(v / 100))
        allowed.add(v * 100)                # rupees -> paise, fraction -> percent
        allowed.add(round(v * 100))
        if v > 0:
            allowed.add(round(v / 1000, 1))  # "Rs 10.4k"
    return allowed


def extract_numbers(text: str) -> list[tuple[str, float]]:
    out = []
    for m in NUMBER_RE.finditer(text):
        token = m.group()
        try:
            out.append((token, float(token.replace(",", ""))))
        except ValueError:
            continue
    return out


def validate(draft: str, tool_results, extra_allowed=()) -> ValidationResult:
    allowed = numeric_closure(tool_results)
    allowed |= {float(x) for x in extra_allowed}

    found = extract_numbers(draft)
    unmatched = []
    for token, value in found:
        if any(abs(value - a) <= TOLERANCE for a in allowed):
            continue
        unmatched.append(token)

    return ValidationResult(ok=not unmatched, unmatched=unmatched,
                            found=[t for t, _ in found], allowed_count=len(allowed))
