import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '';
const SESSION_EXPIRED_ERROR = 'Session expired. Please log in again.';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: any;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  quizData?: Record<string, string>;
  quizProgress?: QuizProgress;
  strategy?: Record<string, unknown>;
  _count?: {
    chats: number;
  };
}

export type ChatPane = 'STRATEGY' | 'CONTENT' | 'SYSTEM';

export type ChatKind =
  | 'plan_options'
  | 'stage_transition'
  | 'plan_selected'
  | 'content_prompt'
  | 'content_response'
  | 'system_event'
  | null;

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  pane: ChatPane;
  kind?: ChatKind;
  metadata?: Record<string, unknown> | null;
  content: string;
  createdAt: string;
  fallback?: boolean;
}

export interface AssistContentResponse {
  type: string;
  content: string;
  fallback: boolean;
  userMessage: ChatMessage | null;
  assistantMessage: ChatMessage;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export interface CampaignUpdatePayload {
  name?: string;
  description?: string | null;
  status?: Campaign['status'];
  quizData?: Record<string, string>;
  quizProgress?: QuizProgress;
  strategy?: Record<string, unknown>;
  isFavorite?: boolean;
}

export interface QuizProgressSnapshot {
  stageIndex: number;
  stageLabel?: string;
  completedAt: string;
  answers: Record<string, string>;
}

export interface QuizProgress {
  currentStage?: number;
  completedStages?: number[];
  totalStages?: number;
  lastUpdated?: string;
  stageSnapshots?: QuizProgressSnapshot[];
}

export interface MetricsSnapshot {
  id: string;
  campaignId: string;
  periodStart: string;
  periodEnd: string;
  label?: string;
  metrics: Record<string, unknown>;
  createdAt: string;
}

export interface MetricsSnapshotPayload {
  periodStart: string;
  periodEnd: string;
  label?: string;
  metrics: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  brandProfile?: Record<string, unknown>;
}

function clearAuthSession(): void {
  try {
    useAuthStore.getState().logout();
  } catch {
    // Ignore store errors.
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : null;

    if (!res.ok) {
      if (res.status === 401) {
        clearAuthSession();
        return { success: false, error: SESSION_EXPIRED_ERROR };
      }

      const errorMessage = data && typeof data === 'object' && 'error' in data
        ? String((data as { error?: unknown }).error || '')
        : '';

      return { success: false, error: errorMessage || `Request failed (${res.status})` };
    }

    if (data && typeof data === 'object' && 'success' in data) {
      return data as ApiResponse<T>;
    }

    return { success: true, data: data as T };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ id: string; email: string; name: string; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (email: string, password: string, name: string) =>
    request<{ id: string; email: string; name: string; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    }),

  me: () => request<UserProfile>('/api/auth/me'),

  // User settings
  updateMe: (data: { name?: string; email?: string; avatar?: string }) =>
    request<UserProfile>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  getBrandProfile: () => request<Record<string, unknown>>('/api/users/me/brand-profile'),

  updateBrandProfile: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/users/me/brand-profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/api/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // Campaigns
  getCampaigns: (limit = 50, offset = 0) => request<Campaign[]>(`/api/campaigns?limit=${limit}&offset=${offset}`),

  getCampaign: (id: string) => request<Campaign>(`/api/campaigns/${id}`),

  createCampaign: (data: { name: string; description?: string; quizData?: Record<string, string>; quizProgress?: QuizProgress }) =>
    request<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCampaign: (id: string, data: CampaignUpdatePayload) =>
    request<Campaign>(`/api/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  updateQuizProgress: (id: string, data: { stageIndex: number; stageLabel?: string; totalStages?: number; answers?: Record<string, string>; completed?: boolean }) =>
    request<Campaign>(`/api/campaigns/${id}/quiz-progress`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  createMetricsSnapshot: (id: string, data: MetricsSnapshotPayload) =>
    request<MetricsSnapshot>(`/api/campaigns/${id}/metrics`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMetricsSnapshots: (id: string, limit = 12) =>
    request<MetricsSnapshot[]>(`/api/campaigns/${id}/metrics?limit=${limit}`),

  deleteCampaign: (id: string) =>
    request(`/api/campaigns/${id}`, { method: 'DELETE' }),

  // Chat
  sendMessage: (message: string, campaignId?: string, context?: Record<string, unknown>) =>
    request<SendMessageResponse>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, campaignId, context })
    }),

  getChatHistory: (campaignId?: string, limit = 200) => {
    const params = new URLSearchParams();
    if (campaignId) {
      params.set('campaignId', campaignId);
    }
    params.set('limit', String(limit));
    const query = params.toString();

    return request<ChatMessage[]>(`/api/chat/history${query ? `?${query}` : ''}`);
  },

  clearChatHistory: (campaignId?: string) =>
    request(`/api/chat/history${campaignId ? `?campaignId=${campaignId}` : ''}`, {
      method: 'DELETE'
    }),

  // Content Assistant (Stream 2)
  assistContent: (type: 'email' | 'ad_copy' | 'social_post' | 'landing_page' | 'custom', campaignId: string, customPrompt?: string) =>
    request<AssistContentResponse>('/api/chat/assist', {
      method: 'POST',
      body: JSON.stringify({ type, campaignId, customPrompt })
    })
};
