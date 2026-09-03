"""
Receipt processing and proof validation engine.

Implements genuine OCR and document parsing for cash transaction proofs:
- Security validation (MIME, extension, size, magic bytes, structure integrity)
- OCR text extraction via RapidOCR (ONNX) for images
- Native text extraction via pypdf for PDFs
- Information extraction (amount, date, merchant)
- Honest comparison against user-entered transaction details
"""
from __future__ import annotations

import io
import os
import re
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any

from PIL import Image
import pypdf

# Directory for storing receipts securely inside the server
RECEIPTS_DIR = Path("data/receipts")
RECEIPTS_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
}

KNOWN_MERCHANTS = [
    ("HPCL", re.compile(r"\b(hpcl|hindustan\s+petroleum)\b", re.I)),
    ("Indian Oil", re.compile(r"\b(indian\s*oil|iocl)\b", re.I)),
    ("Bharat Petroleum", re.compile(r"\b(bharat\s+petroleum|bpcl)\b", re.I)),
    ("Shell", re.compile(r"\b(shell)\b", re.I)),
    ("Swiggy", re.compile(r"\b(swiggy)\b", re.I)),
    ("Zomato", re.compile(r"\b(zomato)\b", re.I)),
    ("Apollo Pharmacy", re.compile(r"\b(apollo\s+pharmacy|apollo)\b", re.I)),
    ("MedPlus", re.compile(r"\b(medplus)\b", re.I)),
    ("DMart", re.compile(r"\b(dmart|d-mart)\b", re.I)),
    ("Reliance Fresh", re.compile(r"\b(reliance\s+fresh|reliance\s+retail)\b", re.I)),
    ("Cafe Coffee Day", re.compile(r"\b(cafe\s+coffee\s+day|ccd)\b", re.I)),
    ("Udupi Grand", re.compile(r"\b(udupi\s+grand|udupi)\b", re.I)),
    ("Sharma Dhaba", re.compile(r"\b(sharma\s+dhaba|dhaba)\b", re.I)),
]

_ocr_instance: Any = None


def get_ocr_engine():
    global _ocr_instance
    if _ocr_instance is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _ocr_instance = RapidOCR()
        except Exception as e:
            _ocr_instance = None
    return _ocr_instance


class ReceiptValidationError(Exception):
    """Raised when file upload fails security checks or structure validation."""
    pass


def validate_file_security(file_bytes: bytes, filename: str, mime_type: str | None) -> str:
    """Validate uploaded receipt security, extension, MIME, and structural integrity."""
    if len(file_bytes) == 0:
        raise ReceiptValidationError("Uploaded file is empty.")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ReceiptValidationError(
            f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ReceiptValidationError(
            f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Validate MIME type if provided
    if mime_type:
        clean_mime = mime_type.lower().split(";")[0].strip()
        if clean_mime not in ALLOWED_MIME_TYPES:
            raise ReceiptValidationError(
                f"Unsupported MIME type '{mime_type}'. Must be an image (JPEG, PNG, WEBP) or PDF."
            )

    # Validate structural integrity
    if ext == ".pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            if len(reader.pages) == 0:
                raise ReceiptValidationError("PDF has no readable pages.")
        except Exception as e:
            raise ReceiptValidationError(f"Malformed or corrupted PDF file: {e}")
    else:
        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                img.verify()
        except Exception as e:
            raise ReceiptValidationError(f"Malformed or corrupted image file: {e}")

    return ext


def save_receipt_file(file_bytes: bytes, ext: str) -> tuple[str, str]:
    """Saves receipt file to data/receipts/ with a secure UUID filename.
    Returns (receipt_id, relative_filepath).
    """
    receipt_id = f"rcpt_{uuid.uuid4().hex}"
    filename = f"{receipt_id}{ext}"
    dest_path = RECEIPTS_DIR / filename
    dest_path.write_bytes(file_bytes)
    return receipt_id, str(dest_path)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from PDF pages."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for p in reader.pages:
            t = p.extract_text()
            if t:
                pages_text.append(t)
        return "\n".join(pages_text)
    except Exception:
        return ""


def extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from image using RapidOCR."""
    ocr = get_ocr_engine()
    if ocr is None:
        return ""
    try:
        results, _ = ocr(file_bytes)
        if not results:
            return ""
        # results format: [[box, text, score], ...]
        lines = [r[1] for r in results if len(r) >= 2 and r[1]]
        return "\n".join(lines)
    except Exception:
        return ""


def parse_receipt_amounts(text: str) -> list[float]:
    """Extract candidate currency amounts from text, prioritized by context."""
    candidates = []

    # 1. Look for explicit Total / Grand Total / Amount / Net Amount
    total_patterns = [
        r"(?:total|grand\s*total|net\s*amount|amount\s*paid|paid\s*amount|final\s*total|bill\s*amount)\s*[:=\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:[.,][0-9]{2})?)",
        r"(?:rs\.?|inr|₹)\s*([0-9]+(?:[.,][0-9]{2})?)\s*(?:total|paid)?",
        r"([0-9]+(?:[.,][0-9]{2})?)\s*(?:rs\.?|inr|₹)",
    ]

    for pat in total_patterns:
        matches = re.finditer(pat, text, re.I)
        for m in matches:
            val_str = m.group(1).replace(",", "")
            try:
                val = float(val_str)
                if 1.0 <= val <= 1_000_000:
                    candidates.append(val)
            except ValueError:
                pass

    # 2. General numbers with decimals or rupee signs if no explicit total
    if not candidates:
        general_matches = re.findall(r"\b([0-9]{2,6}(?:\.[0-9]{2})?)\b", text)
        for g in general_matches:
            try:
                v = float(g)
                if 10.0 <= v <= 500_000:
                    candidates.append(v)
            except ValueError:
                pass

    return candidates


def parse_receipt_date(text: str) -> str | None:
    """Extract transaction date from receipt text in ISO YYYY-MM-DD format if found."""
    # Pattern 1: YYYY-MM-DD or YYYY/MM/DD
    m1 = re.search(r"\b(202[0-9])[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12][0-9]|3[01])\b", text)
    if m1:
        return f"{m1.group(1)}-{m1.group(2)}-{m1.group(3)}"

    # Pattern 2: DD-MM-YYYY or DD/MM/YYYY
    m2 = re.search(r"\b(0[1-9]|[12][0-9]|3[01])[-/.](0[1-9]|1[0-2])[-/.](202[0-9])\b", text)
    if m2:
        return f"{m2.group(3)}-{m2.group(2)}-{m2.group(1)}"

    # Pattern 3: DD Month YYYY (e.g. 03 Sep 2026 or 3 September 2026)
    m3 = re.search(
        r"\b(0?[1-9]|[12][0-9]|3[01])\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(202[0-9])\b",
        text,
        re.I,
    )
    if m3:
        day_str = m3.group(1).zfill(2)
        month_str = m3.group(2)[:3].title()
        year_str = m3.group(3)
        try:
            dt = datetime.strptime(f"{day_str} {month_str} {year_str}", "%d %b %Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass

    return None


def parse_receipt_merchant(text: str) -> str | None:
    """Identify merchant from known regexes or first significant receipt line."""
    for merchant_name, pat in KNOWN_MERCHANTS:
        if pat.search(text):
            return merchant_name

    # Fallback: scan lines for first reasonable business name (>= 3 chars, letters)
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for line in lines[:5]:
        if len(line) >= 3 and any(c.isalpha() for c in line) and not any(
            w in line.lower() for w in ["tax invoice", "receipt", "bill", "cash", "date", "welcome"]
        ):
            return line[:32]
    return None


def process_receipt(file_bytes: bytes, filename: str, mime_type: str | None) -> dict[str, Any]:
    """Perform security checks, run OCR/text extraction, and parse structured receipt fields."""
    ext = validate_file_security(file_bytes, filename, mime_type)
    receipt_id, file_path = save_receipt_file(file_bytes, ext)

    if ext == ".pdf":
        raw_text = extract_text_from_pdf(file_bytes)
    else:
        raw_text = extract_text_from_image(file_bytes)

    amounts = parse_receipt_amounts(raw_text)
    extracted_date = parse_receipt_date(raw_text)
    merchant = parse_receipt_merchant(raw_text)

    return {
        "receipt_id": receipt_id,
        "filename": filename,
        "storage_path": file_path,
        "extension": ext,
        "raw_text": raw_text,
        "ocr_success": bool(raw_text.strip()),
        "extracted_amounts": amounts,
        "primary_amount": amounts[0] if amounts else None,
        "extracted_date": extracted_date,
        "merchant": merchant,
    }


def verify_receipt_against_transaction(
    extracted_receipt: dict[str, Any] | None,
    entered_amount: float,
    entered_date_str: str,
) -> dict[str, Any]:
    """Validates receipt evidence against user-entered amount and date.
    
    Returns:
      {
        "verification_status": "receipt_verified" | "self_reported",
        "is_verified": bool,
        "reason": str,
        "ocr_amount": float | None,
        "ocr_date": str | None,
        "ocr_merchant": str | None,
      }
    """
    if not extracted_receipt:
        return {
            "verification_status": "self_reported",
            "is_verified": False,
            "reason": "No receipt attached. Manually entered by user.",
            "ocr_amount": None,
            "ocr_date": None,
            "ocr_merchant": None,
        }

    raw_text = extracted_receipt.get("raw_text", "")
    if not raw_text.strip():
        return {
            "verification_status": "self_reported",
            "is_verified": False,
            "reason": "Receipt uploaded, but no readable text or numbers could be extracted.",
            "ocr_amount": None,
            "ocr_date": None,
            "ocr_merchant": None,
        }

    amounts = extracted_receipt.get("extracted_amounts", [])
    extracted_date = extracted_receipt.get("extracted_date")
    merchant = extracted_receipt.get("merchant")

    # 1. Amount match check:
    # Does any extracted candidate amount match user-entered amount?
    amount_matched = False
    matched_amount = None
    for amt in amounts:
        if abs(amt - entered_amount) <= 0.5:
            amount_matched = True
            matched_amount = amt
            break

    if not amount_matched:
        first_amt = amounts[0] if amounts else None
        amt_str = f"₹{first_amt:,.0f}" if first_amt is not None else "None found"
        return {
            "verification_status": "self_reported",
            "is_verified": False,
            "reason": f"Receipt amount does not match transaction amount (Extracted: {amt_str} vs Entered: ₹{entered_amount:,.0f}).",
            "ocr_amount": first_amt,
            "ocr_date": extracted_date,
            "ocr_merchant": merchant,
        }

    # 2. Date match check (if extracted from receipt):
    if extracted_date:
        try:
            d_rcpt = date.fromisoformat(extracted_date)
            d_entered = date.fromisoformat(entered_date_str)
            days_diff = abs((d_rcpt - d_entered).days)
            if days_diff > 3:
                return {
                    "verification_status": "self_reported",
                    "is_verified": False,
                    "reason": f"Receipt date does not match transaction date (Extracted: {extracted_date} vs Entered: {entered_date_str}).",
                    "ocr_amount": matched_amount,
                    "ocr_date": extracted_date,
                    "ocr_merchant": merchant,
                }
        except ValueError:
            pass

    # Success: Genuine proof verified!
    m_info = f" from {merchant}" if merchant else ""
    return {
        "verification_status": "receipt_verified",
        "is_verified": True,
        "reason": f"Transaction supported by uploaded receipt{m_info} processed by Dhara (Amount matched: ₹{matched_amount:,.0f}).",
        "ocr_amount": matched_amount,
        "ocr_date": extracted_date,
        "ocr_merchant": merchant,
    }
