import { useEffect, useState, useCallback } from 'react';
import type { Run } from '../types';
import { listProjectRuns, listRuns } from '../api';

interface Props {
  onSelect: (runId: string) => void;
  onNewRun: () => void;
  refreshTick: number;
  /** When set, lists only runs for that project. */
  projectId?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ALL_STEP_KEYS = ['analyst','writer','human_review','planner','ticket_fetcher','repo_context','coder','reviewer'];

function RunRow({ run, onSelect }: { run: Run; onSelect: (id: string) => void }) {
  const activeSteps = ALL_STEP_KEYS.filter(k => run.steps[k] && run.steps[k].status !== 'skipped');
  const completedCount = activeSteps.filter(k => run.steps[k]?.status === 'completed').length;

  const statusColors: Record<string, string> = {
    running:         'text-blue-600',
    awaiting_review: 'text-amber-600',
    completed:       'text-emerald-600',
    failed:          'text-red-600',
  };

  const statusDot: Record<string, string> = {
    running:         'bg-blue-500 animate-ping',
    awaiting_review: 'bg-amber-500 animate-ping',
    completed:       'bg-emerald-500',
    failed:          'bg-red-500',
  };

  const statusLabel: Record<string, string> = {
    running:         'Running',
    awaiting_review: 'Needs Review',
    completed:       'Completed',
    failed:          'Failed',
  };

  return (
    <button
      onClick={() => onSelect(run.run_id)}
      className="w-full text-left rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 p-4 group shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`relative flex-shrink-0 w-1.5 h-1.5 rounded-full ${statusDot[run.status]}`} />
            <span className={`text-xs font-medium ${statusColors[run.status]}`}>{statusLabel[run.status]}</span>
            <span className="text-slate-300 text-xs">·</span>
            <span className="text-xs text-slate-400">{timeAgo(run.created_at)}</span>
          </div>
          <p className="text-sm text-slate-500 truncate font-mono">
            {run.run_id.slice(0, 8)}...{run.run_id.slice(-4)}
          </p>
          <div className="flex gap-1 mt-2">
            {activeSteps.map((key) => {
              const s = run.steps[key]?.status ?? 'pending';
              return (
                <div key={key} className={`h-1 flex-1 rounded-full transition-all duration-500
                  ${s === 'completed' ? 'bg-emerald-400' : ''}
                  ${s === 'running'   ? 'bg-blue-400'    : ''}
                  ${s === 'awaiting'  ? 'bg-amber-400'   : ''}
                  ${s === 'failed'    ? 'bg-red-400'     : ''}
                  ${s === 'pending'   ? 'bg-slate-200'   : ''}
                `} />
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{completedCount} / {activeSteps.length} steps done</p>
        </div>
        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

export function RunList({ onSelect, onNewRun, refreshTick, projectId }: Props) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = projectId ? await listProjectRuns(projectId) : await listRuns();
      setRuns(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load, refreshTick]);

  useEffect(() => {
    const hasActive = runs.some((r) => r.status === 'running' || r.status === 'awaiting_review');
    if (!hasActive) return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [runs, load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {projectId ? 'Project runs' : 'Recent runs'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-slate-400 hover:text-slate-600 transition-colors" title="Refresh">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={onNewRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-xs font-medium transition-all"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {projectId ? 'Add feature' : 'New run'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl shimmer" />)}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-600">{error}</p>
          <button onClick={load} className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors">Retry</button>
        </div>
      )}

      {!loading && !error && runs.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 py-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 font-medium">No runs yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {projectId ? 'Add a feature from transcript, requirements, or a Jira ticket' : 'Start your first pipeline run'}
            </p>
          </div>
          <button
            onClick={onNewRun}
            className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-xs font-medium transition-all"
          >
            {projectId ? 'Add feature' : 'New run'}
          </button>
        </div>
      )}

      {!loading && runs.length > 0 && (
        <div className="space-y-2">
          {runs.map((run) => <RunRow key={run.run_id} run={run} onSelect={onSelect} />)}
        </div>
      )}
    </div>
  );
}
