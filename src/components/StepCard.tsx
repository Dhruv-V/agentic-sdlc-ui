import { useState } from 'react';
import type { StepInfo, StepStatus, InputMode } from '../types';

interface StepMeta {
  key: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const ALL_STEPS: StepMeta[] = [
  { key: 'analyst',       label: 'Analyst',       icon: '🔍', description: 'Extracts structured requirements from the meeting transcript', color: 'cyan' },
  { key: 'writer',        label: 'Writer',         icon: '✍️', description: 'Generates a full Product Requirements Document (PRD)',         color: 'blue' },
  { key: 'human_review',  label: 'Human Review',   icon: '👤', description: 'Waits for your approval before proceeding to implementation',  color: 'amber' },
  { key: 'planner',       label: 'Planner',        icon: '📋', description: 'Creates a Jira Epic, Stories and Tasks from the PRD',          color: 'purple' },
  { key: 'ticket_fetcher',label: 'Ticket Fetcher', icon: '🎫', description: 'Fetches the Jira ticket details for direct implementation',    color: 'cyan' },
  { key: 'repo_context',  label: 'Repo Context',   icon: '📦', description: 'Analyzes the target repo — file tree, tech stack, and relevant files', color: 'blue' },
  { key: 'coder',         label: 'Coder',          icon: '💻', description: 'Generates repo-aware code changes and opens a GitHub PR',      color: 'green' },
  { key: 'reviewer',      label: 'Reviewer',       icon: '🔎', description: 'Performs AI code review against the existing codebase',        color: 'rose' },
];

export function getStepsForMode(inputMode?: InputMode): StepMeta[] {
  const mode = inputMode || 'transcript';
  const modeStepKeys: Record<InputMode, string[]> = {
    transcript:   ['analyst', 'writer', 'human_review', 'planner', 'repo_context', 'coder', 'reviewer'],
    requirements: ['writer', 'human_review', 'planner', 'repo_context', 'coder', 'reviewer'],
    jira_ticket:  ['ticket_fetcher', 'repo_context', 'coder', 'reviewer'],
  };
  const keys = new Set(modeStepKeys[mode]);
  return ALL_STEPS.filter(s => keys.has(s.key));
}

export { ALL_STEPS as STEPS };

const colorMap: Record<string, { ring: string; badge: string; dot: string; text: string; activeBg: string; activeRing: string }> = {
  cyan:   { ring: 'ring-cyan-200',   badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',   dot: 'bg-cyan-500',   text: 'text-cyan-700',   activeBg: 'bg-cyan-50',   activeRing: 'ring-cyan-300' },
  blue:   { ring: 'ring-blue-200',   badge: 'bg-blue-50 text-blue-700 border-blue-200',   dot: 'bg-blue-500',   text: 'text-blue-700',   activeBg: 'bg-blue-50',   activeRing: 'ring-blue-300' },
  amber:  { ring: 'ring-amber-200',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-500',  text: 'text-amber-700',  activeBg: 'bg-amber-50',  activeRing: 'ring-amber-300' },
  purple: { ring: 'ring-purple-200', badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', text: 'text-purple-700', activeBg: 'bg-purple-50', activeRing: 'ring-purple-300' },
  green:  { ring: 'ring-green-200',  badge: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500',  text: 'text-green-700',  activeBg: 'bg-green-50',  activeRing: 'ring-green-300' },
  rose:   { ring: 'ring-rose-200',   badge: 'bg-rose-50 text-rose-700 border-rose-200',   dot: 'bg-rose-500',   text: 'text-rose-700',   activeBg: 'bg-rose-50',   activeRing: 'ring-rose-300' },
};

function StatusBadge({ status, color }: { status: StepStatus; color: string }) {
  const c = colorMap[color];
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
      Pending
    </span>
  );
  if (status === 'running') return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.badge} border`}>
      <span className={`relative w-1.5 h-1.5 rounded-full ${c.dot}`}>
        <span className={`absolute inset-0 rounded-full ${c.dot} animate-ping opacity-75`} />
      </span>
      Running
    </span>
  );
  if (status === 'awaiting') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <span className="relative w-1.5 h-1.5 rounded-full bg-amber-500">
        <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-75" />
      </span>
      Awaiting Review
    </span>
  );
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Completed
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Failed
    </span>
  );
  if (status === 'skipped') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200">
      Skipped
    </span>
  );
  return null;
}

interface StepCardProps {
  meta: StepMeta;
  info: StepInfo;
  isLast?: boolean;
  isActive?: boolean;
}

export function StepCard({ meta, info, isLast, isActive }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const c = colorMap[meta.color];
  const isCompleted = info.status === 'completed';
  const isRunning = info.status === 'running';
  const isAwaiting = info.status === 'awaiting';
  const hasOutput = !!info.output;

  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base z-10 ring-2 transition-all duration-500
          ${isCompleted ? 'bg-emerald-50 ring-emerald-300' : ''}
          ${isRunning || isAwaiting ? `bg-white ${c.activeRing} shadow-md` : ''}
          ${info.status === 'pending' ? 'bg-white ring-slate-200' : ''}
          ${info.status === 'failed' ? 'bg-red-50 ring-red-200' : ''}
          ${info.status === 'skipped' ? 'bg-slate-50 ring-slate-200 opacity-40' : ''}
        `}>
          {info.status === 'completed' ? (
            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : info.status === 'failed' ? (
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className={`text-sm ${info.status === 'pending' || info.status === 'skipped' ? 'opacity-40' : ''}`}>
              {meta.icon}
            </span>
          )}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 mt-1 rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-200' : 'bg-slate-200'}`}
            style={{ minHeight: '24px' }}
          />
        )}
      </div>

      {/* Card body */}
      <div className={`flex-1 mb-4 rounded-xl border transition-all duration-300
        ${isActive || isRunning || isAwaiting ? `${c.activeBg} border-slate-200 shadow-sm` : ''}
        ${isCompleted ? 'bg-slate-50 border-emerald-200' : ''}
        ${info.status === 'pending' ? 'bg-white border-slate-200 opacity-70' : ''}
        ${info.status === 'failed' ? 'bg-red-50 border-red-200' : ''}
        ${info.status === 'skipped' ? 'bg-white border-slate-200 opacity-40' : ''}
      `}>
        <div
          className={`flex items-center justify-between p-4 ${hasOutput ? 'cursor-pointer select-none' : ''}`}
          onClick={() => hasOutput && setExpanded((v) => !v)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-sm font-semibold ${isCompleted ? 'text-slate-800' : isRunning || isAwaiting ? c.text : 'text-slate-500'}`}>
                {meta.label}
              </span>
              <StatusBadge status={info.status} color={meta.color} />
            </div>
            <p className="text-xs text-slate-400 truncate">{meta.description}</p>
          </div>
          {hasOutput && (
            <button className="ml-3 flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {expanded && hasOutput && (
          <div className="px-4 pb-4 animate-flow-in">
            <div className="rounded-lg bg-slate-900 border border-slate-700 p-3 overflow-auto max-h-64">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{info.output}</pre>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="px-4 pb-4">
            <div className="h-0.5 rounded-full shimmer" />
          </div>
        )}
      </div>
    </div>
  );
}
