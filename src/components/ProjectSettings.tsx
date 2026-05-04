import React, { useEffect, useState } from 'react';
import { getProject, patchProjectSecrets, updateProject } from '../api';
import type { Project } from '../types';

interface Props {
  projectId: string;
  onSaved: () => void;
  onBack: () => void;
}

export function ProjectSettings({ projectId, onSaved, onBack }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [jiraProjectLink, setJiraProjectLink] = useState('');
  const [jiraSiteUrl, setJiraSiteUrl] = useState('');
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraApiToken, setJiraApiToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getProject(projectId);
        if (cancelled) return;
        setProject(p);
        setName(p.name);
        setDescription(p.description ?? '');
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setSaving(true);
    try {
      await updateProject(projectId, { name, description });
      setMsg('Project details saved.');
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecrets = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setSaving(true);
    try {
      await patchProjectSecrets(projectId, {
        github_token: githubToken || undefined,
        github_repo: githubRepo || undefined,
        jira_project_link: jiraProjectLink || undefined,
        jira_site_url: jiraSiteUrl || undefined,
        jira_project_key: jiraProjectKey || undefined,
        jira_email: jiraEmail || undefined,
        jira_api_token: jiraApiToken || undefined,
      });
      setMsg('Integration secrets updated (non-empty fields only).');
      setGithubToken('');
      setJiraApiToken('');
      onSaved();
      const p = await getProject(projectId);
      setProject(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500 py-12 text-center">Loading project…</div>;
  }
  if (error && !project) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-flow-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          ← Back to project
        </button>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-800">Project settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Name and description are visible. Integration tokens are stored on the server and never returned to the browser; use the form below only to rotate or add values (non-empty fields are saved).
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">{error}</div>
      )}
      {msg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">{msg}</div>
      )}

      <form onSubmit={handleSaveMeta} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</h3>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            disabled={saving}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
            disabled={saving}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-medium disabled:opacity-50"
        >
          Save details
        </button>
      </form>

      {project && (
        <p className="text-xs text-slate-400">
          GitHub: {project.has_github_repo ? 'repo saved' : 'no repo'} · token {project.has_github_token ? 'saved' : 'not set'}
          {' · '}
          Jira: {project.has_jira ? 'configured' : 'not set'}
        </p>
      )}

      <form onSubmit={handleSaveSecrets} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Integrations</h3>
        <p className="text-xs text-slate-400">Only fill fields you want to set or replace. Leave token fields blank to keep existing values.</p>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">GitHub token</label>
          <input
            type="password"
            autoComplete="off"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="New PAT (repo scope)"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
            disabled={saving}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">GitHub repository</label>
          <input
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            placeholder="https://github.com/org/repo or org/repo"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
            disabled={saving}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Jira project link</label>
          <input
            value={jiraProjectLink}
            onChange={(e) => setJiraProjectLink(e.target.value)}
            placeholder="Browse or board URL"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
            disabled={saving}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Jira site URL</label>
            <input
              value={jiraSiteUrl}
              onChange={(e) => setJiraSiteUrl(e.target.value)}
              placeholder="https://org.atlassian.net"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Jira project key</label>
            <input
              value={jiraProjectKey}
              onChange={(e) => setJiraProjectKey(e.target.value)}
              placeholder="PROJ"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
              disabled={saving}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Jira email</label>
            <input
              type="email"
              value={jiraEmail}
              onChange={(e) => setJiraEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Jira API token</label>
            <input
              type="password"
              autoComplete="off"
              value={jiraApiToken}
              onChange={(e) => setJiraApiToken(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
              disabled={saving}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium disabled:opacity-50"
        >
          Save integrations
        </button>
      </form>
    </div>
  );
}
