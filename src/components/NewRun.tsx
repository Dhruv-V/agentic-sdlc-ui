import React, { useState } from 'react';
import { createProjectRun, createRun } from '../api';
import type { InputMode } from '../types';

interface Props {
  onCreated: (runId: string) => void;
  /** When set, uses project saved secrets and POST /projects/{id}/runs */
  projectId?: string;
  projectName?: string;
}

const SAMPLE_TRANSCRIPT = `Meeting Transcript - Product Planning Session
Date: March 30, 2026
Attendees: Alice (PM), Bob (Engineering Lead), Carol (Designer)

Alice: We need to build a user authentication system for our web app. Users should be able to sign up and log in using email and password.

Bob: We should also support social login — at minimum Google and GitHub OAuth. And we need proper session management with JWT tokens.

Carol: From the UX side, we need a clean login/signup page, password reset flow, and a profile page where users can update their info.

Alice: Security is important — we need rate limiting on auth endpoints, email verification on signup, and secure password hashing.

Bob: We'll need a forgot password flow with email reset links. Tokens should expire after 24 hours for security.

Carol: The UI should be mobile-responsive and follow our existing design system. Error states and loading indicators are important.

Alice: Timeline is 2 weeks. Let's prioritize core auth first, then social login, then the profile page.`;

const MODE_TABS: { mode: InputMode; label: string; icon: React.ReactNode; description: string }[] = [
  {
    mode: 'transcript',
    label: 'Transcript',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    description: 'Extract requirements from a meeting transcript — full pipeline',
  },
  {
    mode: 'requirements',
    label: 'Requirements',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: 'Provide requirements directly — skips the analyst step',
  },
  {
    mode: 'jira_ticket',
    label: 'Jira Ticket',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    description: 'Code directly from a Jira ticket — fetches and implements',
  },
];

export function NewRun({ onCreated, projectId, projectName }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>('transcript');
  const [transcript, setTranscript] = useState('');
  const [requirements, setRequirements] = useState('');
  const [jiraTicketKey, setJiraTicketKey] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [jiraSiteUrl, setJiraSiteUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraApiToken, setJiraApiToken] = useState('');
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const [jiraProjectLink, setJiraProjectLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSample, setUseSample] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (inputMode === 'transcript' && !useSample && !transcript.trim()) {
      setError('Please enter a meeting transcript'); return;
    }
    if (inputMode === 'requirements' && !requirements.trim()) {
      setError('Please enter requirements'); return;
    }
    if (inputMode === 'jira_ticket' && !jiraTicketKey.trim()) {
      setError('Please enter a Jira ticket key'); return;
    }

    setLoading(true);
    try {
      const payload = {
        input_mode: inputMode,
        transcript: inputMode === 'transcript' ? (useSample ? SAMPLE_TRANSCRIPT : transcript) : undefined,
        requirements: inputMode === 'requirements' ? requirements : undefined,
        jira_ticket_key: inputMode === 'jira_ticket' ? jiraTicketKey : undefined,
        repo_url: repoUrl || undefined,
        github_token: githubToken || undefined,
        jira_site_url: jiraSiteUrl || undefined,
        jira_email: jiraEmail || undefined,
        jira_api_token: jiraApiToken || undefined,
        jira_project_key: jiraProjectKey || undefined,
        jira_project_link: jiraProjectLink || undefined,
      };
      const { run_id } = projectId
        ? await createProjectRun(projectId, payload)
        : await createRun(payload);
      onCreated(run_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start pipeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-flow-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {projectId ? `Add feature${projectName ? ` — ${projectName}` : ''}` : 'New Pipeline Run'}
          </h3>
          <p className="text-xs text-slate-400">
            {projectId
              ? 'Uses this project’s saved GitHub and Jira credentials. You can override the target repo URL below for this run only.'
              : 'Choose an input mode and run the SDLC pipeline'}
          </p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
        {MODE_TABS.map(({ mode, label, icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setInputMode(mode)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
              ${inputMode === mode
                ? 'bg-white text-blue-600 border border-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 border border-transparent'
              }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Mode description */}
      <p className="text-xs text-slate-400 px-1">
        {MODE_TABS.find(t => t.mode === inputMode)?.description}
      </p>

      {/* GitHub Repo URL */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          GitHub repository <span className="text-slate-400">(optional — enables repo-aware coding)</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo or owner/repo"
            className="flex-1 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors font-mono"
            disabled={loading}
          />
        </div>
      </div>

      {/* Per-run GitHub / Jira — hidden inside a project (use Project → Settings) */}
      {!projectId && (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
        <div>
          <h4 className="text-xs font-semibold text-slate-700">Integrations for this run</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Leave blank to use API server <span className="font-mono">.env</span>. Filled values apply only to this run and are not shown again after you start.
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">GitHub token</label>
          <input
            type="password"
            autoComplete="off"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_… or fine-grained PAT (repo scope)"
            className="w-full rounded-lg bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-3 py-2 focus:outline-none focus:border-blue-400 font-mono"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Jira project link <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={jiraProjectLink}
            onChange={(e) => setJiraProjectLink(e.target.value)}
            placeholder="https://your.atlassian.net/jira/software/projects/PROJ/…"
            className="w-full rounded-lg bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-3 py-2 focus:outline-none focus:border-blue-400 font-mono"
            disabled={loading}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Jira site URL</label>
            <input
              type="text"
              value={jiraSiteUrl}
              onChange={(e) => setJiraSiteUrl(e.target.value)}
              placeholder="https://your.atlassian.net"
              className="w-full rounded-lg bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-3 py-2 focus:outline-none focus:border-blue-400 font-mono"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Jira project key</label>
            <input
              type="text"
              value={jiraProjectKey}
              onChange={(e) => setJiraProjectKey(e.target.value)}
              placeholder="e.g. SDLC"
              className="w-full rounded-lg bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-3 py-2 focus:outline-none focus:border-blue-400 font-mono"
              disabled={loading}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Jira email</label>
            <input
              type="email"
              autoComplete="email"
              value={jiraEmail}
              onChange={(e) => setJiraEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-3 py-2 focus:outline-none focus:border-blue-400"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Jira API token</label>
            <input
              type="password"
              autoComplete="off"
              value={jiraApiToken}
              onChange={(e) => setJiraApiToken(e.target.value)}
              placeholder="from id.atlassian.com → Security → API tokens"
              className="w-full rounded-lg bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-3 py-2 focus:outline-none focus:border-blue-400 font-mono"
              disabled={loading}
            />
          </div>
        </div>
      </div>
      )}

      {/* TRANSCRIPT MODE */}
      {inputMode === 'transcript' && (
        <>
          <div
            onClick={() => setUseSample((v) => !v)}
            className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 select-none
              ${useSample ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all
                ${useSample ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'}`}>
                {useSample && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700">Use sample transcript</p>
                <p className="text-xs text-slate-400">A pre-written product planning meeting about a user auth system</p>
              </div>
            </div>
            {useSample && (
              <div className="mt-3 rounded-lg bg-white border border-slate-200 p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-slate-500 whitespace-pre-wrap font-mono leading-relaxed">{SAMPLE_TRANSCRIPT}</pre>
              </div>
            )}
          </div>

          {!useSample && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Meeting Transcript</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your meeting transcript here..."
                rows={8}
                className="w-full rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-4 py-3 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors font-mono leading-relaxed"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-slate-400">
                {transcript.length > 0 ? `${transcript.length} characters` : 'Minimum ~200 characters recommended'}
              </p>
            </div>
          )}
        </>
      )}

      {/* REQUIREMENTS MODE */}
      {inputMode === 'requirements' && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Requirements</label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder={"Describe the feature requirements...\n\nExample:\n- Add a /api/health endpoint that returns {status: 'ok'}\n- Add rate limiting middleware (100 req/min per IP)\n- Update the dashboard to show real-time metrics"}
            rows={8}
            className="w-full rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-4 py-3 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors font-mono leading-relaxed"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-slate-400">
            Plain text requirements — skips the analyst step and goes directly to PRD generation
          </p>
        </div>
      )}

      {/* JIRA TICKET MODE */}
      {inputMode === 'jira_ticket' && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Jira Ticket Key</label>
          <input
            type="text"
            value={jiraTicketKey}
            onChange={(e) => setJiraTicketKey(e.target.value)}
            placeholder="e.g. SDLC-42"
            className="w-full rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors font-mono"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-slate-400">
            The pipeline will fetch the ticket details, gather repo context, and code directly
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/25"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Starting pipeline...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {inputMode === 'jira_ticket' ? 'Code Ticket' : 'Run Pipeline'}
          </>
        )}
      </button>
    </form>
  );
}
