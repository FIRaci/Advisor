import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SESSION_EXPIRED_ERROR = 'Session expired. Please log in again.';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
  _count?: {
    chats: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  fallback?: boolean;
}

export interface CampaignUpdatePayload {
  name?: string;
  description?: string | null;
  status?: Campaign['status'];
  quizData?: Record<string, string>;
  strategy?: Record<string, unknown>;
  isFavorite?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

function clearAuthSession(): void {
  try {
    useAuthStore.getState().logout();
  } catch {
    // Ignore store errors and still clear persisted token.
  }

  try {
    localStorage.removeItem('advisor-auth');
  } catch {
    // Ignore localStorage errors.
  }
}

function getTokenFromStorage(): string | null {
  try {
    const raw = localStorage.getItem('advisor-auth');
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getTokenFromStorage();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : null;

    if (!res.ok) {
      if (res.status === 401 && token) {
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
  updateMe: (data: { name?: string; email?: string }) =>
    request<UserProfile>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/api/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // Campaigns
  getCampaigns: () => request<Campaign[]>('/api/campaigns'),

  getCampaign: (id: string) => request<Campaign>(`/api/campaigns/${id}`),

  createCampaign: (data: { name: string; description?: string; quizData?: Record<string, string> }) =>
    request<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCampaign: (id: string, data: CampaignUpdatePayload) =>
    request<Campaign>(`/api/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteCampaign: (id: string) =>
    request(`/api/campaigns/${id}`, { method: 'DELETE' }),

  // Chat
  sendMessage: (message: string, campaignId?: string, context?: Record<string, unknown>) =>
    request<ChatMessage>('/api/chat/message', {
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
    })
};
