import { useState } from 'react';
import type { Story, Run } from '../types';
import { codeStory } from '../api';

interface StoryCardProps {
  story: Story;
  index: number;
  runId: string;
  onCoded: () => void;
}

function StoryStatusBadge({ status }: { status: Story['status'] }) {
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
      Pending
    </span>
  );
  if (status === 'coding') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
      Coding
    </span>
  );
  if (status === 'reviewing') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200">
      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
      Reviewing
    </span>
  );
  if (status === 'done') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Done
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Failed
    </span>
  );
  return null;
}

function StoryCard({ story, index, runId, onCoded }: StoryCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<'code' | 'review' | 'files' | null>(null);

  const isActive = story.status === 'coding' || story.status === 'reviewing';
  const isDone = story.status === 'done';
  const canCode = story.status === 'pending';

  const handleCodeStory = async () => {
    setLoading(true);
    setError(null);
    try {
      await codeStory(runId, { story_index: index });
      onCoded();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start coding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border transition-all duration-300
      ${isDone   ? 'border-emerald-200 bg-emerald-50/50' : ''}
      ${isActive ? 'border-blue-200 bg-blue-50/50 shadow-sm' : ''}
      ${canCode  ? 'border-slate-200 bg-white' : ''}
      ${story.status === 'failed' ? 'border-red-200 bg-red-50/50' : ''}
    `}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Index badge */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5
            ${isDone   ? 'bg-emerald-100 text-emerald-700' : ''}
            ${isActive ? 'bg-blue-100 text-blue-600'       : ''}
            ${canCode  ? 'bg-slate-100 text-slate-500'     : ''}
            ${story.status === 'failed' ? 'bg-red-100 text-red-600' : ''}
          `}>
            {isDone
              ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              : index + 1
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-sm font-semibold truncate ${isDone || isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                {story.title}
              </span>
              <StoryStatusBadge status={story.status} />
              {story.ticket_id && (
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {story.ticket_id}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{story.description}</p>

            {/* Task list */}
            {story.tasks && story.tasks.length > 0 && (
              <div className="mt-2 space-y-1">
                {story.tasks.map((task, ti) => (
                  <div key={ti} className="flex items-start gap-2">
                    <span className="text-slate-400 text-xs mt-0.5 flex-shrink-0">
                      {story.task_ids?.[ti]
                        ? <span className="font-mono bg-slate-100 px-1 rounded border border-slate-200">{story.task_ids[ti]}</span>
                        : <span>·</span>
                      }
                    </span>
                    <span className="text-xs text-slate-500">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active shimmer */}
        {isActive && <div className="mt-3 h-0.5 rounded-full shimmer" />}

        {/* Error */}
        {story.status === 'failed' && story.error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-600 font-mono">{story.error}</p>
          </div>
        )}

        {/* Artifacts */}
        {isDone && (
          <div className="mt-3 flex flex-wrap gap-2">
            {story.pull_request_url && (
              <a href={story.pull_request_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-xs font-medium transition-all">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Pull Request
              </a>
            )}
            {story.branch_name && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {story.branch_name}
              </span>
            )}
            {story.generated_code && (
              <button
                onClick={() => setExpanded(expanded === 'code' ? null : 'code')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-medium transition-all"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                {expanded === 'code' ? 'Hide Code' : 'View Code'}
              </button>
            )}
            {story.file_changes && story.file_changes.length > 0 && (
              <button
                onClick={() => setExpanded(expanded === 'files' ? null : 'files')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 text-xs font-medium transition-all"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {expanded === 'files' ? 'Hide Files' : `${story.file_changes.length} Files`}
              </button>
            )}
            {story.review_comments && (
              <button
                onClick={() => setExpanded(expanded === 'review' ? null : 'review')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-medium transition-all"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {expanded === 'review' ? 'Hide Review' : 'AI Review'}
              </button>
            )}
          </div>
        )}

        {/* Expanded panels */}
        {expanded === 'files' && story.file_changes && (
          <div className="mt-3 rounded-lg bg-white border border-slate-200 animate-flow-in">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">Changed Files ({story.file_changes.length})</span>
            </div>
            <div className="divide-y divide-slate-100">
              {story.file_changes.map((fc, fi) => (
                <div key={fi} className="px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      fc.action === 'create' ? 'bg-emerald-50 text-emerald-700' :
                      fc.action === 'delete' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-700'
                    }`}>{fc.action}</span>
                    <span className="text-xs font-mono text-slate-600">{fc.path}</span>
                  </div>
                  {fc.content && (
                    <pre className="text-xs text-slate-500 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-auto">
                      {fc.content.slice(0, 2000)}{fc.content.length > 2000 ? '\n... (truncated)' : ''}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {expanded === 'code' && story.generated_code && (
          <div className="mt-3 rounded-lg bg-slate-900 border border-slate-700 animate-flow-in">
            <div className="px-3 py-2 border-b border-slate-700 flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Generated Code</span>
            </div>
            <div className="p-3 max-h-72 overflow-auto">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{story.generated_code}</pre>
            </div>
          </div>
        )}
        {expanded === 'review' && story.review_comments && (
          <div className="mt-3 rounded-lg bg-purple-50 border border-purple-200 animate-flow-in">
            <div className="px-3 py-2 border-b border-purple-100 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-purple-700">AI Code Review</span>
            </div>
            <div className="p-3 max-h-72 overflow-auto">
              <pre className="text-xs text-purple-700 whitespace-pre-wrap font-mono leading-relaxed">{story.review_comments}</pre>
            </div>
          </div>
        )}

        {/* Code Story button */}
        {canCode && (
          <div className="mt-3">
            {error && (
              <div className="mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
            <button
              onClick={handleCodeStory}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Code This Story
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  run: Run;
  onUpdated: () => void;
}

export function StoriesPanel({ run, onUpdated }: Props) {
  const stories = run.state?.stories;
  if (!stories || stories.length === 0) return null;

  const doneCount = stories.filter((s) => s.status === 'done').length;

  return (
    <div className="space-y-3 animate-flow-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User Stories</span>
        </div>
        <span className="text-xs text-slate-400">{doneCount} / {stories.length} coded</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
          style={{ width: `${(doneCount / stories.length) * 100}%` }}
        />
      </div>

      {/* Story cards */}
      <div className="space-y-3">
        {stories.map((story, i) => (
          <StoryCard key={i} story={story} index={i} runId={run.run_id} onCoded={onUpdated} />
        ))}
      </div>
    </div>
  );
}
