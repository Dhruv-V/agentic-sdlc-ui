export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'awaiting' | 'skipped';

export type RunStatus = 'running' | 'awaiting_review' | 'completed' | 'failed';

export type ReviewAction = 'approve' | 'reject' | 'feedback';

export type StoryStatus = 'pending' | 'coding' | 'reviewing' | 'done' | 'failed';

export type InputMode = 'transcript' | 'requirements' | 'jira_ticket';

export interface StoryTask {
  title: string;
  description: string;
}

export interface FileChange {
  path: string;
  action: 'create' | 'update' | 'delete';
  content?: string;
}

export interface Story {
  title: string;
  description: string;
  ticket_id?: string;
  task_ids?: string[];
  tasks?: StoryTask[];
  status: StoryStatus;
  generated_code?: string;
  pull_request_url?: string;
  branch_name?: string;
  review_comments?: string;
  file_changes?: FileChange[];
  error?: string;
}

export interface StepInfo {
  status: StepStatus;
  output?: string | null;
}

export interface RunState {
  input_mode?: InputMode;
  transcript?: string;
  repo_url?: string;
  jira_ticket_key?: string;
  requirements?: string;
  prd?: string;
  human_approved?: boolean;
  human_notes?: string;
  jira_epic_key?: string;
  linear_story_ids?: string[];
  story_title?: string;
  pull_request_url?: string;
  branch_name?: string;
  generated_code?: string;
  review_comments?: string;
  stories?: Story[];
  repo_context?: Record<string, unknown>;
  file_changes?: FileChange[];
  error?: string;
  current_step?: string;
}

export interface Run {
  run_id: string;
  status: RunStatus;
  current_step: string;
  input_mode?: InputMode;
  transcript: string;
  project_id?: string | null;
  steps: Record<string, StepInfo>;
  state: RunState;
  created_at: string;
  completed_at?: string | null;
  error?: string | null;
}

/** Body for POST /projects — all integration fields required. */
export interface CreateProjectPayload {
  name: string;
  description?: string;
  github_token: string;
  github_repo: string;
  jira_email: string;
  jira_api_token: string;
  jira_site_url?: string;
  jira_project_key?: string;
  jira_project_link?: string;
}

export interface Project {
  project_id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  has_github_token?: boolean;
  has_github_repo?: boolean;
  has_jira?: boolean;
}

export interface StartRunRequest {
  input_mode: InputMode;
  transcript?: string;
  requirements?: string;
  jira_ticket_key?: string;
  repo_url?: string;
  /** Overrides GITHUB_TOKEN for this run (PR + repo reads). */
  github_token?: string;
  /** Jira Cloud site, e.g. https://your.atlassian.net — overrides JIRA_URL. */
  jira_site_url?: string;
  /** Overrides JIRA_EMAIL. */
  jira_email?: string;
  /** Overrides JIRA_API_TOKEN. */
  jira_api_token?: string;
  /** Overrides JIRA_PROJECT_KEY (e.g. SDLC). */
  jira_project_key?: string;
  /** Optional browse/board URL; site + project key parsed when possible. */
  jira_project_link?: string;
  /** Attach run to a project (uses that project’s saved secrets as defaults). */
  project_id?: string;
}

export interface ReviewRequest {
  action: ReviewAction;
  notes?: string;
  feedback?: string;
}

export interface CodeStoryRequest {
  story_index: number;
}
