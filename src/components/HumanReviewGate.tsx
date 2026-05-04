import { useState } from 'react';
import type { Run } from '../types';
import { submitReview } from '../api';

interface Props {
  run: Run;
  onReviewed: () => void;
}

type Mode = 'review' | 'feedback' | 'submitting';

export function HumanReviewGate({ run, onReviewed }: Props) {
  const [mode, setMode] = useState<Mode>('review');
  const [notes, setNotes] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [iterationCount, setIterationCount] = useState(1);

  if (run.status !== 'awaiting_review') return null;

  const prd = run.state?.prd;
  const stepOutput = run.steps?.human_review?.output ?? '';
  const roundMatch = stepOutput.match(/Iteration (\d+)/);
  const currentRound = roundMatch ? parseInt(roundMatch[1]) : iterationCount;

  const handleAction = async (action: 'approve' | 'reject' | 'feedback') => {
    setError(null);
    setMode('submitting');
    try {
      await submitReview(run.run_id, {
        action,
        notes: action !== 'feedback' ? notes : undefined,
        feedback: action === 'feedback' ? feedbackText : undefined,
      });
      if (action === 'feedback') {
        setFeedbackText('');
        setNotes('');
        setIterationCount((n) => n + 1);
        setMode('review');
      } else {
        onReviewed();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
      setMode(action === 'feedback' ? 'feedback' : 'review');
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4 animate-flow-in shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
          <span className="text-base">👤</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-800">Human Review Required</h3>
          <p className="text-xs text-amber-600">
            {currentRound > 1
              ? `Round ${currentRound} — PRD revised based on your feedback`
              : 'Review the PRD before the pipeline continues to implementation'}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {currentRound > 1 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-200 font-medium">
              Rev {currentRound}
            </span>
          )}
          {mode === 'submitting' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Waiting
            </span>
          )}
        </div>
      </div>

      {/* PRD Preview */}
      {prd && (
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium text-slate-500">Product Requirements Document</span>
            </div>
            {currentRound > 1 && <span className="text-xs text-purple-500">✏️ Revised</span>}
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">{prd}</pre>
          </div>
        </div>
      )}

      {/* Feedback mode */}
      {mode === 'feedback' && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-3 animate-flow-in">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="text-xs font-medium text-purple-700">What should be changed in the PRD?</p>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="e.g. Add more detail to the security section, include API rate limiting requirements..."
            rows={4}
            autoFocus
            className="w-full rounded-lg bg-white border border-purple-200 text-sm text-slate-700 placeholder-slate-400 px-3 py-2 resize-none focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('feedback')}
              disabled={!feedbackText.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Revise PRD
            </button>
            <button
              onClick={() => { setMode('review'); setFeedbackText(''); }}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes */}
      {mode !== 'feedback' && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Notes <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes for the team..."
            rows={2}
            className="w-full rounded-lg bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-3 py-2 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
            disabled={mode === 'submitting'}
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Action buttons */}
      {mode !== 'feedback' && (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('approve')}
            disabled={mode === 'submitting'}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Approve & Continue
          </button>

          <button
            onClick={() => setMode('feedback')}
            disabled={mode === 'submitting'}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Request Changes
          </button>

          <button
            onClick={() => handleAction('reject')}
            disabled={mode === 'submitting'}
            className="px-4 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reject and stop pipeline"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
