import { useAuthStore } from '@/store/authStore';
import type { AuthResponse, MeResponse, ProfileResponse } from '@/types/auth';
import type { EventSummary, EventCreate } from '@/types/event';

const API_BASE = '/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  return apiRequest('/health');
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
  username: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getCurrentUser(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me');
}

export async function getProfile(): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>('/profile/me');
}

export async function updateProfile(input: {
  displayName?: string;
  username?: string;
  bio?: string | null;
  profilePhoto?: string | null;
  interests?: string[];
  discoveryRadius?: number;
}): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>('/profile/me', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteProfile(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/profile/me', {
    method: 'DELETE',
  });
}

export async function getEvents(): Promise<EventSummary[]> {
  return apiRequest<EventSummary[]>('/events');
}

export async function getEvent(id: string): Promise<EventSummary> {
  return apiRequest<EventSummary>(`/events/${id}`);
}

export async function createEvent(input: EventCreate): Promise<EventSummary> {
  return apiRequest<EventSummary>('/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateEvent(id: string, input: Partial<EventCreate>): Promise<EventSummary> {
  return apiRequest<EventSummary>(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteEvent(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/events/${id}`, {
    method: 'DELETE',
  });
}

export async function cancelEvent(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/events/${id}/cancel`, {
    method: 'PATCH',
  });
}

export async function joinEvent(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/events/${id}/join`, {
    method: 'POST',
  });
}

export async function leaveEvent(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/events/${id}/leave`, {
    method: 'POST',
  });
}

// Notifications
export async function getNotifications(): Promise<{ notifications: Array<{ id: string; type: string; title: string; message: string; eventId: string | null; isRead: boolean; createdAt: string }> }> {
  return apiRequest('/notifications');
}

export async function markNotificationRead(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/notifications/read-all', { method: 'PUT' });
}

// Reports
export async function createReport(input: { targetType: 'USER' | 'EVENT'; targetId: string; reason: string }): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/reports', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// Blocks
export async function blockUser(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/blocks/${id}`, { method: 'POST' });
}

export async function unblockUser(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/blocks/${id}`, { method: 'DELETE' });
}

export async function getBlockedUsers(): Promise<{ blockedUsers: Array<{ id: string; displayName: string; username: string }> }> {
  return apiRequest('/blocks');
}

// Admin
export async function getAdminUsers(): Promise<{ users: Array<{ id: string; email: string; username: string; displayName: string; role: string; isSuspended: boolean; createdAt: string }> }> {
  return apiRequest('/admin/users');
}

export async function getAdminEvents(): Promise<{ events: Array<{ id: string; title: string; category: string; status: string; startTime: string; organizer: { id: string; displayName: string }; participantCount: number }> }> {
  return apiRequest('/admin/events');
}

export async function getAdminReports(): Promise<{ reports: Array<{ id: string; targetType: string; reason: string; status: string; createdAt: string; reporter: { id: string; displayName: string }; reportedUser: { id: string; displayName: string; username: string } | null; event: { id: string; title: string } | null }> }> {
  return apiRequest('/admin/reports');
}

export async function suspendUser(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/admin/users/${id}/suspend`, { method: 'PATCH' });
}

export async function unsuspendUser(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/admin/users/${id}/unsuspend`, { method: 'PATCH' });
}

export async function adminDeleteUser(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' });
}

export async function adminDeleteEvent(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/admin/events/${id}`, { method: 'DELETE' });
}

export async function markReportReviewed(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/admin/reports/${id}/reviewed`, { method: 'PATCH' });
}

export async function dismissReport(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/admin/reports/${id}/dismiss`, { method: 'PATCH' });
}
