const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('advisor-auth')
    ? JSON.parse(localStorage.getItem('advisor-auth')!).state?.token
    : null;

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

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'Request failed' };
    }

    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (email: string, password: string, name: string) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    }),

  me: () => request('/api/auth/me'),

  // Campaigns
  getCampaigns: () => request('/api/campaigns'),

  getCampaign: (id: string) => request(`/api/campaigns/${id}`),

  createCampaign: (data: { name: string; description?: string; quizData?: any }) =>
    request('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCampaign: (id: string, data: any) =>
    request(`/api/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteCampaign: (id: string) =>
    request(`/api/campaigns/${id}`, { method: 'DELETE' }),

  // Chat
  sendMessage: (message: string, campaignId?: string, context?: any) =>
    request('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, campaignId, context })
    }),

  getChatHistory: (campaignId?: string) =>
    request(`/api/chat/history${campaignId ? `?campaignId=${campaignId}` : ''}`),

  clearChatHistory: (campaignId?: string) =>
    request(`/api/chat/history${campaignId ? `?campaignId=${campaignId}` : ''}`, {
      method: 'DELETE'
    })
};
