import React, { useState, useEffect, useCallback } from 'react';
import { RunList } from './components/RunList';
import { RunDetail } from './components/RunDetail';
import { NewRun } from './components/NewRun';
import { ProjectsLanding } from './components/ProjectsLanding';
import { ProjectSettings } from './components/ProjectSettings';
import { API_BASE_URL, createProjectRun, getProject } from './api';
import type { Project } from './types';

type ProjectPanel = 'runs' | 'new-feature' | 'settings';

export default function App() {
  const [projectsMode, setProjectsMode] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projectPanel, setProjectPanel] = useState<ProjectPanel>('runs');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [globalRunId, setGlobalRunId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const loadProject = useCallback(async (pid: string) => {
    try {
      setProject(await getProject(pid));
    } catch {
      setProject(null);
    }
  }, []);

  useEffect(() => {
    if (projectId) loadProject(projectId);
    else setProject(null);
  }, [projectId, loadProject, refreshTick]);

  const goProjects = () => {
    setProjectsMode(true);
    setProjectId(null);
    setProjectPanel('runs');
    setSelectedRunId(null);
    setGlobalRunId(null);
    setRefreshTick((t) => t + 1);
  };

  const openProject = (pid: string) => {
    setProjectsMode(false);
    setProjectId(pid);
    setProjectPanel('runs');
    setSelectedRunId(null);
    setGlobalRunId(null);
    setRefreshTick((t) => t + 1);
  };

  const handleProjectRunCreated = (runId: string) => {
    setSelectedRunId(runId);
    setProjectPanel('runs');
    setRefreshTick((t) => t + 1);
  };

  const [jiraQuickKey, setJiraQuickKey] = useState('');
  const [jiraQuickLoading, setJiraQuickLoading] = useState(false);
  const [jiraQuickErr, setJiraQuickErr] = useState<string | null>(null);

  const startQuickJira = async () => {
    if (!projectId || !jiraQuickKey.trim()) return;
    setJiraQuickLoading(true);
    setJiraQuickErr(null);
    try {
      const { run_id } = await createProjectRun(projectId, {
        input_mode: 'jira_ticket',
        jira_ticket_key: jiraQuickKey.trim(),
      });
      setJiraQuickKey('');
      handleProjectRunCreated(run_id);
    } catch (e: unknown) {
      setJiraQuickErr(e instanceof Error ? e.message : 'Failed to start');
    } finally {
      setJiraQuickLoading(false);
    }
  };

  const sidebarForProjects = projectsMode && (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <RunList
        onSelect={(id) => { setGlobalRunId(id); setProjectsMode(false); setProjectId(null); }}
        onNewRun={() => { setProjectsMode(false); setProjectId(null); setGlobalRunId(null); }}
        refreshTick={refreshTick}
      />
      <p className="text-xs text-slate-400 mt-3 px-1">
        Runs without a project still work. Prefer opening a <span className="font-medium text-slate-600">project</span> to use saved credentials.
      </p>
    </div>
  );

  const sidebarForProject = !projectsMode && projectId && (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <button
          type="button"
          onClick={goProjects}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          ← All projects
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{project?.name ?? 'Project'}</h2>
          {project?.description ? (
            <p className="text-xs text-slate-500 mt-1 line-clamp-3">{project.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setProjectPanel('new-feature'); setSelectedRunId(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${projectPanel === 'new-feature' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
          >
            Add feature
          </button>
          <button
            type="button"
            onClick={() => { setProjectPanel('settings'); setSelectedRunId(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${projectPanel === 'settings' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
          >
            Settings
          </button>
        </div>

        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-3 space-y-2">
          <p className="text-xs font-medium text-slate-600">Code any Jira ticket</p>
          <p className="text-xs text-slate-400">Fetch → repo context → PR + AI review</p>
          <div className="flex gap-2">
            <input
              value={jiraQuickKey}
              onChange={(e) => setJiraQuickKey(e.target.value)}
              placeholder="PROJ-123"
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono"
              disabled={jiraQuickLoading}
            />
            <button
              type="button"
              onClick={startQuickJira}
              disabled={jiraQuickLoading || !jiraQuickKey.trim()}
              className="px-2 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium disabled:opacity-50"
            >
              Go
            </button>
          </div>
          {jiraQuickErr && <p className="text-xs text-red-600">{jiraQuickErr}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <RunList
          projectId={projectId}
          onSelect={(id) => { setSelectedRunId(id); setProjectPanel('runs'); }}
          onNewRun={() => { setProjectPanel('new-feature'); setSelectedRunId(null); }}
          refreshTick={refreshTick}
        />
      </div>
    </div>
  );

  const mainContent = () => {
    if (projectsMode) {
      if (globalRunId) {
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <RunDetail runId={globalRunId} onBack={() => { setGlobalRunId(null); }} />
          </div>
        );
      }
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ProjectsLanding onOpenProject={openProject} refreshTick={refreshTick} />
        </div>
      );
    }

    if (projectId) {
      if (projectPanel === 'new-feature') {
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <NewRun
              projectId={projectId}
              projectName={project?.name}
              onCreated={handleProjectRunCreated}
            />
          </div>
        );
      }
      if (projectPanel === 'settings') {
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ProjectSettings
              projectId={projectId}
              onSaved={() => setRefreshTick((t) => t + 1)}
              onBack={() => setProjectPanel('runs')}
            />
          </div>
        );
      }
      if (selectedRunId) {
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <RunDetail
              runId={selectedRunId}
              onBack={() => { setSelectedRunId(null); setRefreshTick((t) => t + 1); }}
            />
          </div>
        );
      }
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-600 font-medium">Pick a run from the list</p>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            After planning, use <span className="font-medium">Code this story</span> on a card for the GitHub PR link and AI review. Or start <span className="font-medium">Add feature</span> / <span className="font-medium">Code any Jira ticket</span> from the sidebar.
          </p>
        </div>
      );
    }

    if (globalRunId) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <RunDetail
            runId={globalRunId}
            onBack={() => { setGlobalRunId(null); setProjectsMode(true); }}
          />
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <NewRun
          onCreated={(runId) => {
            setGlobalRunId(runId);
            setRefreshTick((t) => t + 1);
          }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            type="button"
            onClick={goProjects}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/25">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
              Agentic SDLC
            </span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <nav className="flex items-center gap-2 text-xs text-slate-400">
            <button type="button" onClick={goProjects} className={projectsMode ? 'text-slate-700 font-medium' : 'hover:text-slate-600'}>
              Projects
            </button>
            {!projectsMode && projectId && (
              <>
                <span>/</span>
                <span className="text-slate-600 truncate max-w-[140px]">{project?.name ?? 'Project'}</span>
              </>
            )}
            {!projectsMode && !projectId && globalRunId && (
              <>
                <span>/</span>
                <span className="text-slate-600 font-mono">Run</span>
              </>
            )}
          </nav>

          <div className="flex-1" />
          <ApiStatus />

          {projectsMode && !globalRunId && (
            <button
              type="button"
              onClick={() => { setProjectsMode(false); setProjectId(null); setGlobalRunId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition-all"
            >
              Global new run
            </button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="hidden lg:block space-y-4">
            {projectsMode ? sidebarForProjects : projectId ? sidebarForProject : (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <button type="button" onClick={goProjects} className="text-xs text-blue-600 mb-3">← Projects</button>
                <p className="text-xs text-slate-500 mb-3">You are viewing a run outside of a project.</p>
                <RunList
                  onSelect={(id) => setGlobalRunId(id)}
                  onNewRun={() => setGlobalRunId(null)}
                  refreshTick={refreshTick}
                />
              </div>
            )}
          </aside>

          <main className="lg:col-span-2">
            {!projectsMode && !projectId && !globalRunId && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-6 lg:hidden">
                <button type="button" onClick={goProjects} className="text-xs text-blue-600 mb-2">← Projects</button>
              </div>
            )}
            <div className="lg:hidden space-y-4 mb-6">
              {projectsMode ? sidebarForProjects : projectId ? sidebarForProject : null}
            </div>
            {mainContent()}
          </main>
        </div>
      </div>
    </div>
  );
}

function ApiStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const check = () => {
      fetch(`${API_BASE_URL}/`)
        .then((r) => setStatus(r.ok ? 'online' : 'offline'))
        .catch(() => setStatus('offline'));
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0
        ${status === 'online' ? 'bg-emerald-500' : ''}
        ${status === 'offline' ? 'bg-red-500' : ''}
        ${status === 'checking' ? 'bg-slate-300' : ''}
      `}
      />
      <span className="text-slate-400">
        {status === 'online' ? 'API connected' : status === 'offline' ? 'API offline' : '…'}
      </span>
    </div>
  );
}
