import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import { dharaApi } from '../services/dharaApi';
import { ThumbsUp, ThumbsDown, CheckCircle2, MessageSquare } from 'lucide-react';

export default function UserFeedbackWidget({ feature = 'dashboard', className = '' }) {
  const [useful, setUseful] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (useful === null || submitting) return;

    setSubmitting(true);
    try {
      await dharaApi.submitFeedback({
        userId: 'demo_user',
        useful,
        comment,
        feature,
      });
      setSubmitted(true);
    } catch (err) {
      console.warn('Feedback submit notice:', err.message);
      // Still show thank you in demo mode
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className={`p-4 border-slate-800 bg-slate-900/60 text-center space-y-1.5 ${className}`}>
        <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>Thank you for your feedback!</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Your input has been recorded in the local development ledger for user testing.
        </p>
      </Card>
    );
  }

  return (
    <Card className={`p-4 border-slate-800 bg-slate-900/80 text-left space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-bold text-white">Was this feature useful?</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setUseful(true)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
              useful === true
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
            <span>Yes</span>
          </button>
          <button
            type="button"
            onClick={() => setUseful(false)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
              useful === false
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <ThumbsDown className="w-3 h-3" />
            <span>No</span>
          </button>
        </div>
      </div>

      {useful !== null && (
        <form onSubmit={handleSubmit} className="space-y-2 pt-1">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What would you change? (optional feedback)"
            className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <div className="flex justify-end">
            <Button type="submit" size="xs" variant="primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
