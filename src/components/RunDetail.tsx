import { useEffect, useState, useRef } from 'react';
import type { Run } from '../types';
import { streamRun, getRun } from '../api';
import { StepCard, getStepsForMode } from './StepCard';
import { HumanReviewGate } from './HumanReviewGate';
import { StoriesPanel } from './StoriesPanel';

interface Props {
  runId: string;
  onBack: () => void;
}

function RunStatusBadge({ status }: { status: Run['status'] }) {
  if (status === 'running') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
      Running
    </span>
  );
  if (status === 'awaiting_review') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
      Awaiting Review
    </span>
  );
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Completed
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Failed
    </span>
  );
  return null;
}

function Artifacts({ run }: { run: Run }) {
  const s = run.state;
  const items: { label: string; value: string; href?: string; mono?: boolean }[] = [];

  if (s?.pull_request_url) items.push({ label: 'Pull Request', value: s.pull_request_url, href: s.pull_request_url });
  if (s?.branch_name) items.push({ label: 'Branch', value: s.branch_name, mono: true });
  if (s?.jira_epic_key) items.push({ label: 'Jira Epic', value: s.jira_epic_key, mono: true });
  if (s?.linear_story_ids?.length) items.push({ label: 'Jira Stories', value: s.linear_story_ids.join(', '), mono: true });
  if (s?.story_title) items.push({ label: 'Story Title', value: s.story_title });
  if (run.completed_at) items.push({ label: 'Completed', value: new Date(run.completed_at).toLocaleString() });

  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 animate-flow-in shadow-sm">
      <div className="px-4 py-3 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Artifacts</span>
      </div>
      {items.map(({ label, value, href, mono }) => (
        <div key={label} className="px-4 py-3 flex items-start gap-4">
          <span className="text-xs text-slate-400 w-28 flex-shrink-0 mt-0.5">{label}</span>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors break-all">
              {value}
            </a>
          ) : (
            <span className={`text-xs ${mono ? 'font-mono text-slate-500' : 'text-slate-800'} break-all`}>
              {value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function RunDetail({ runId, onBack }: Props) {
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const stopStreamRef = useRef<(() => void) | null>(null);

  const startStream = (id: string) => {
    if (stopStreamRef.current) stopStreamRef.current();
    stopStreamRef.current = streamRun(
      id,
      (updated) => setRun(updated),
      () => { getRun(id).then(setRun).catch(console.error); }
    );
  };

  useEffect(() => {
    getRun(runId).then((r) => {
      setRun(r);
      if (r.status === 'running' || r.status === 'awaiting_review') startStream(runId);
    }).catch((e) => setError(e.message));
    return () => { if (stopStreamRef.current) stopStreamRef.current(); };
  }, [runId]);

  const handleReviewed = () => {
    startStream(runId);
    getRun(runId).then(setRun).catch(console.error);
  };

  const handleStoryUpdated = () => {
    getRun(runId).then(setRun).catch(console.error);
    startStream(runId);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={onBack} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back</button>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading run...</span>
        </div>
      </div>
    );
  }

  const steps = getStepsForMode(run.input_mode);
  const completedSteps = steps.filter((s) => run.steps[s.key]?.status === 'completed').length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="animate-flow-in space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Runs
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-lg font-bold text-slate-800">Pipeline Run</h2>
              <RunStatusBadge status={run.status} />
            </div>
            <p className="text-xs font-mono text-slate-400">{run.run_id}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-400">Started {new Date(run.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-slate-500">Pipeline Progress</span>
          <span className="text-xs font-mono text-slate-400">{completedSteps} / {steps.length} steps</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error banner */}
      {run.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-medium text-red-700 mb-0.5">Pipeline Error</p>
          <p className="text-xs text-red-500 font-mono">{run.error}</p>
        </div>
      )}

      {/* Human review gate */}
      <HumanReviewGate run={run} onReviewed={handleReviewed} />

      {/* Steps timeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline Steps</span>
        </div>
        <div>
          {steps.map((meta, i) => {
            const info = run.steps[meta.key] ?? { status: 'pending' };
            return (
              <StepCard
                key={meta.key}
                meta={meta}
                info={info}
                isLast={i === steps.length - 1}
                isActive={run.current_step === meta.key || info.status === 'running' || info.status === 'awaiting'}
              />
            );
          })}
        </div>
      </div>

      {/* Stories panel */}
      {run.state?.stories && run.state.stories.length > 0 && (
        <StoriesPanel run={run} onUpdated={handleStoryUpdated} />
      )}

      {/* Artifacts */}
      <Artifacts run={run} />

      {/* Source input */}
      {run.transcript && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            onClick={() => setShowTranscript((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {run.input_mode === 'jira_ticket' ? 'Ticket Key' : run.input_mode === 'requirements' ? 'Requirements' : 'Source Transcript'}
              </span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showTranscript ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTranscript && (
            <div className="px-4 pb-4 animate-flow-in">
              <div className="rounded-lg bg-slate-900 border border-slate-700 p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{run.transcript}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
