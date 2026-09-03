import { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  HelpCircle,
  IndianRupee,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';

import Button from './Button';
import { dharaApi } from '../services/dharaApi';

const EXPENSE_CATEGORIES = [
  'Fuel',
  'Food',
  'Maintenance',
  'Rent',
  'Household',
  'Medical',
  'Other',
];

const INCOME_CATEGORIES = ['Gig Income', 'Other Income'];

export default function AddCashTransactionModal({ isOpen, onClose, onSuccess }) {
  const [type, setType] = useState('expense'); // 'income' | 'expense'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Fuel');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // File proof state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);

  // Submission & Validation state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [mismatchData, setMismatchData] = useState(null); // { message, ocr_amount, ocr_date, ocr_merchant }

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setError(null);
    setMismatchData(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError(`Unsupported file type .${ext}. Allowed formats: JPG, JPEG, PNG, WEBP, PDF.`);
      return;
    }

    setError(null);
    setMismatchData(null);
    setReceiptFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setReceiptPreviewUrl(url);
    } else {
      setReceiptPreviewUrl(null); // PDF preview placeholder
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
      setReceiptPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setMismatchData(null);
    setError(null);
  };

  const handleSubmit = async (e, forceSelfReported = false) => {
    if (e) e.preventDefault();

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for the transaction.');
      return;
    }

    if (!date) {
      setError('Please specify a transaction date.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('type', type);
    formData.append('amount', numAmount.toString());
    formData.append('category', category);
    formData.append('description', description.trim());
    formData.append('date', date);

    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }

    if (forceSelfReported) {
      formData.append('force_self_reported', 'true');
    }

    try {
      const savedTxn = await dharaApi.addCashTransaction(formData);
      handleRemoveReceipt();
      onSuccess?.(savedTxn);
      onClose();
    } catch (err) {
      if (err.status === 422 && err.payload?.detail) {
        // Amount or date mismatch from OCR validation
        setMismatchData(err.payload.detail);
      } else {
        setError(err.message || 'Failed to save cash transaction. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8 text-left animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Add Cash Transaction
              </h3>
              <p className="text-xs text-slate-400">
                Record manual income or expenditure with optional receipt proof
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-5">
          {/* Mismatch Warning Alert (Requirement 5) */}
          {mismatchData && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-amber-300">
                    Receipt verification mismatch
                  </p>
                  <p className="text-slate-300">
                    {mismatchData.message || 'The receipt content does not match the entered transaction details.'}
                  </p>
                  {mismatchData.ocr_amount && (
                    <p className="text-[11px] text-amber-200/80 font-mono">
                      Extracted Amount: ₹{mismatchData.ocr_amount.toLocaleString('en-IN')} vs Entered: ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMismatchData(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  Edit Transaction
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save as Self Reported'}
                </button>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {error && !mismatchData && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Transaction Type Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>○ Cash Expense</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>○ Cash Income</span>
              </button>
            </div>
          </div>

          {/* 2. Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Amount</span>
                <span className="text-[10px] text-slate-500">₹ INR</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setMismatchData(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setMismatchData(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 shadow-inner"
              />
            </div>
          </div>

          {/* 3. Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-inner"
            >
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Description
            </label>
            <input
              type="text"
              required
              placeholder={type === 'expense' ? 'e.g. Fuel for delivery' : 'e.g. Cash tip / Gig payout'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
            />
          </div>

          {/* 5. TRANSACTION PROOF SECTION (Requirement 2 & 26) */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Transaction Proof</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                Optional
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload Bill / Receipt (Optional). Add a bill or receipt to provide supporting evidence for this transaction.
            </p>

            {/* Receipt upload / preview container */}
            {!receiptFile ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="receipt-file-input"
                />
                <label
                  htmlFor="receipt-file-input"
                  className="w-full flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/40 hover:bg-blue-950/10 cursor-pointer transition-all text-center space-y-1.5 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-600/10 group-hover:bg-blue-600/20 text-blue-400 flex items-center justify-center transition-colors">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-slate-300 group-hover:text-white">
                    Upload Receipt
                  </div>
                  <p className="text-[10px] text-slate-500">
                    JPG, JPEG, PNG, WEBP, or PDF up to 10MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  {receiptPreviewUrl ? (
                    <img
                      src={receiptPreviewUrl}
                      alt="Receipt preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs font-bold text-white truncate">
                        Receipt attached
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} KB)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="receipt-replace-input"
                  />
                  <label
                    htmlFor="receipt-replace-input"
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors"
                  >
                    Replace
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove receipt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Explanation notice (Requirement 26) */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                Adding a receipt provides supporting evidence for your transaction. If you don't have a receipt, you can still record the transaction as <strong className="text-amber-400">Self Reported</strong>.
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              icon={submitting ? RefreshCw : CheckCircle2}
              iconPosition="left"
              className={submitting ? 'animate-pulse' : ''}
            >
              {submitting
                ? receiptFile
                  ? 'Verifying & Saving...'
                  : 'Saving...'
                : receiptFile
                ? 'Verify & Save Cash Transaction'
                : 'Save as Self Reported'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
