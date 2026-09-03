import { useState } from 'react';
import {
  X,
  ExternalLink,
  FileCheck,
  Eye,
} from 'lucide-react';

import VerificationBadge from './VerificationBadge';
import { dharaApi } from '../services/dharaApi';
import { getBadgeConfig } from '../utils/verificationUtils';
import Button from './Button';

export default function TransactionDetailModal({ transaction, isOpen, onClose }) {
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  if (!isOpen || !transaction) return null;

  const isCredit = transaction.type === 'credit';
  const badgeConfig = getBadgeConfig(transaction.verification_status);
  const hasReceipt = Boolean(transaction.receipt_present || transaction.receipt_id);
  const receiptUrl = hasReceipt
    ? dharaApi.getReceiptUrl(transaction.id || transaction.receipt_id)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8 text-left animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                isCredit
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isCredit ? '+' : '-'}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight truncate max-w-[280px]">
                {transaction.description}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {transaction.date} · {transaction.category}
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

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Main Amount & Badge */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Transaction Value
              </span>
              <div
                className={`text-2xl font-extrabold font-mono ${
                  isCredit ? 'text-emerald-400' : 'text-slate-200'
                }`}
              >
                {isCredit ? `+₹${transaction.amount.toLocaleString('en-IN')}` : `-₹${transaction.amount.toLocaleString('en-IN')}`}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Provenance Status
              </span>
              <VerificationBadge status={transaction.verification_status} size="md" />
            </div>
          </div>

          {/* Verification & Evidence Section */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Verification Evidence</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Source: {transaction.source === 'cash_manual' ? 'Manual Cash' : 'Account Aggregator'}
              </span>
            </div>

            {/* Explanation notice */}
            <p className="text-xs text-slate-300 leading-relaxed">
              {transaction.verification_reason || badgeConfig.description}
            </p>

            {/* If Receipt Verified */}
            {transaction.verification_status === 'receipt_verified' && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {transaction.ocr_merchant && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Extracted Merchant
                      </span>
                      <span className="font-semibold text-white">
                        {transaction.ocr_merchant}
                      </span>
                    </div>
                  )}

                  {transaction.ocr_amount && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Extracted Amount
                      </span>
                      <span className="font-semibold font-mono text-emerald-400">
                        ₹{transaction.ocr_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {transaction.ocr_date && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Extracted Date
                      </span>
                      <span className="font-semibold text-slate-300">
                        {transaction.ocr_date}
                      </span>
                    </div>
                  )}

                  {transaction.receipt_uploaded_at && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Processed At
                      </span>
                      <span className="font-semibold text-slate-300 font-mono text-[11px]">
                        {transaction.receipt_uploaded_at.split('T')[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* View Receipt Button (Requirement 16) */}
                {hasReceipt && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReceiptPreview(!showReceiptPreview)}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{showReceiptPreview ? 'Hide Receipt' : 'View Receipt'}</span>
                    </button>

                    {showReceiptPreview && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Proof Document</span>
                          <a
                            href={receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                          >
                            <span>Open in new tab</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-slate-800 max-h-64 flex items-center justify-center bg-slate-900">
                          <img
                            src={receiptUrl}
                            alt="Receipt proof document"
                            className="max-h-64 object-contain w-auto mx-auto"
                            onError={(e) => {
                              // If image fails, fallback to download/link
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* If Self Reported */}
            {transaction.verification_status === 'self_reported' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 space-y-1">
                <p className="font-semibold text-amber-200">
                  ⚠ Self Reported Cash Entry
                </p>
                <p className="text-slate-400 text-[11px]">
                  {hasReceipt
                    ? 'Receipt was attached but could not be verified automatically. Saved with self-reported trust rating.'
                    : 'Entered manually by the user without supporting receipt evidence.'}
                </p>
                {hasReceipt && (
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={() => setShowReceiptPreview(!showReceiptPreview)}
                      className="text-[11px] font-bold text-amber-300 hover:underline flex items-center gap-1"
                    >
                      <span>{showReceiptPreview ? 'Hide Attached Receipt' : 'View Attached Receipt'}</span>
                    </button>
                    {showReceiptPreview && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-slate-800 max-h-48 bg-slate-900">
                        <img
                          src={receiptUrl}
                          alt="Receipt proof"
                          className="max-h-48 object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* If AA Verified */}
            {transaction.verification_status === 'aa_verified' && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300/90 space-y-1">
                <p className="font-semibold text-blue-200">
                  ✓ Account Aggregator Stream
                </p>
                <p className="text-slate-400 text-[11px]">
                  Imported through simulated Account Aggregator flow. Tamper-evident financial data directly from banking institution.
                </p>
              </div>
            )}

            {/* If Synthetic Demo */}
            {transaction.verification_status === 'synthetic_demo' && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/90 space-y-1">
                <p className="font-semibold text-purple-200">
                  DEMO · Synthetic Data Point
                </p>
                <p className="text-slate-400 text-[11px]">
                  Generated synthetic transaction used for simulating drought conditions and cash-flow stress testing in the hackathon demonstration.
                </p>
              </div>
            )}
          </div>

          {/* Transaction Metadata Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Channel / Platform
              </span>
              <span className="font-semibold text-white">
                {transaction.platform || 'Cash In Hand'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Date Occurred
              </span>
              <span className="font-semibold text-white font-mono">
                {transaction.date}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
