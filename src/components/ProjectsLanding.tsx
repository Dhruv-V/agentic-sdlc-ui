import React, { useCallback, useEffect, useState } from 'react';
import { createProject, listProjects } from '../api';
import type { CreateProjectPayload, Project } from '../types';

interface Props {
  onOpenProject: (projectId: string) => void;
  refreshTick: number;
}

export function ProjectsLanding({ onOpenProject, refreshTick }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraApiToken, setJiraApiToken] = useState('');
  const [jiraSiteUrl, setJiraSiteUrl] = useState('');
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const [jiraProjectLink, setJiraProjectLink] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setProjects(await listProjects());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTick]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!githubToken.trim() || !githubRepo.trim()) {
      setError('GitHub token and repository are required');
      return;
    }
    if (!jiraEmail.trim() || !jiraApiToken.trim()) {
      setError('Jira email and API token are required');
      return;
    }
    if (!jiraSiteUrl.trim() && !jiraProjectLink.trim()) {
      setError('Provide either Jira site URL or a Jira project/board link');
      return;
    }
    if (!jiraProjectKey.trim() && !jiraProjectLink.trim()) {
      setError('Provide either Jira project key or a Jira project link that includes the project');
      return;
    }

    const payload: CreateProjectPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      github_token: githubToken.trim(),
      github_repo: githubRepo.trim(),
      jira_email: jiraEmail.trim(),
      jira_api_token: jiraApiToken.trim(),
      jira_site_url: jiraSiteUrl.trim() || undefined,
      jira_project_key: jiraProjectKey.trim() || undefined,
      jira_project_link: jiraProjectLink.trim() || undefined,
    };

    setCreating(true);
    try {
      const { project_id } = await createProject(payload);
      setName('');
      setDescription('');
      setGithubToken('');
      setGithubRepo('');
      setJiraEmail('');
      setJiraApiToken('');
      setJiraSiteUrl('');
      setJiraProjectKey('');
      setJiraProjectLink('');
      await load();
      onOpenProject(project_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-flow-in">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Projects</h2>
        <p className="text-sm text-slate-500 mt-1">
          Each project must include GitHub and Jira credentials when you create it. Those values are stored with the project and used for every run under that project (they do not fall back to the server’s <span className="font-mono">.env</span>).
        </p>
      </div>

      <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-4 space-y-5 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New project</h3>

        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-700">Project</p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer portal"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              disabled={creating}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description <span className="text-slate-400">(optional)</span></label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              disabled={creating}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-700">GitHub <span className="text-red-500">*</span></p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Personal access token</label>
            <input
              type="password"
              autoComplete="off"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="PAT with repo scope"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              disabled={creating}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Repository</label>
            <input
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="https://github.com/org/repo or org/repo"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              disabled={creating}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-700">Jira Cloud <span className="text-red-500">*</span></p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Project / board link <span className="text-slate-400">(optional if site + key below)</span></label>
            <input
              value={jiraProjectLink}
              onChange={(e) => setJiraProjectLink(e.target.value)}
              placeholder="https://your.atlassian.net/jira/software/projects/PROJ/…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              disabled={creating}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Site URL</label>
              <input
                value={jiraSiteUrl}
                onChange={(e) => setJiraSiteUrl(e.target.value)}
                placeholder="https://your.atlassian.net"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                disabled={creating}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Project key</label>
              <input
                value={jiraProjectKey}
                onChange={(e) => setJiraProjectKey(e.target.value)}
                placeholder="PROJ"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                disabled={creating}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Atlassian email</label>
              <input
                type="email"
                autoComplete="email"
                value={jiraEmail}
                onChange={(e) => setJiraEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                disabled={creating}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">API token</label>
              <input
                type="password"
                autoComplete="off"
                value={jiraApiToken}
                onChange={(e) => setJiraApiToken(e.target.value)}
                placeholder="from id.atlassian.com → API tokens"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                disabled={creating}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create project'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl shimmer" />)}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-sm text-slate-400">No projects yet — create one above.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.project_id}>
              <button
                type="button"
                onClick={() => onOpenProject(p.project_id)}
                className="w-full text-left rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30 px-4 py-3 transition-all shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                {p.description ? <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p> : null}
                <p className="text-xs text-slate-400 mt-2 font-mono">{p.project_id.slice(0, 8)}…</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
