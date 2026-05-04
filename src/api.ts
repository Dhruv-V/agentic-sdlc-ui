import type {
  Run,
  StartRunRequest,
  ReviewRequest,
  CodeStoryRequest,
  Project,
  CreateProjectPayload,
} from './types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export async function createRun(req: StartRunRequest): Promise<{ run_id: string }> {
  const res = await fetch(`${API_BASE_URL}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function listRuns(projectId?: string): Promise<Run[]> {
  const q = projectId ? `?project_id=${encodeURIComponent(projectId)}` : '';
  const res = await fetch(`${API_BASE_URL}/runs${q}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function listProjectRuns(projectId: string): Promise<Run[]> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/runs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function listProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/projects`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createProject(payload: CreateProjectPayload): Promise<{ project_id: string }> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getProject(projectId: string): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateProject(
  projectId: string,
  body: { name?: string | null; description?: string | null },
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
}

export async function patchProjectSecrets(
  projectId: string,
  body: {
    github_token?: string;
    github_repo?: string;
    jira_site_url?: string;
    jira_email?: string;
    jira_api_token?: string;
    jira_project_key?: string;
    jira_project_link?: string;
  },
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/secrets`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      github_token: body.github_token ?? '',
      github_repo: body.github_repo ?? '',
      jira_site_url: body.jira_site_url ?? '',
      jira_email: body.jira_email ?? '',
      jira_api_token: body.jira_api_token ?? '',
      jira_project_key: body.jira_project_key ?? '',
      jira_project_link: body.jira_project_link ?? '',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
}

export async function createProjectRun(projectId: string, req: StartRunRequest): Promise<{ run_id: string }> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getRun(runId: string): Promise<Run> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function submitReview(runId: string, req: ReviewRequest): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
}

export async function codeStory(runId: string, req: CodeStoryRequest): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/code-story`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
}

export function streamRun(runId: string, onUpdate: (run: Run) => void, onError?: (e: Event) => void): () => void {
  const es = new EventSource(`${API_BASE_URL}/runs/${runId}/stream`);
  es.onmessage = (e) => {
    try {
      const run: Run = JSON.parse(e.data);
      onUpdate(run);
      if (run.status === 'completed' || run.status === 'failed') {
        es.close();
      }
    } catch {
      // ignore parse errors
    }
  };
  es.onerror = (e) => {
    onError?.(e);
    es.close();
  };
  return () => es.close();
}
