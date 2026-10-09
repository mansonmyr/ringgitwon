import { getAuth } from 'firebase/auth';

const endpoint = (import.meta.env.VITE_EMAIL_API_URL ?? '').replace(/\/$/, '');
export const emailAlertsConfigured = Boolean(endpoint);
export type EmailStatus = { status: 'off' | 'pending' | 'verified' | 'expired'; email?: string | null };
export async function emailRequest<T>(action: 'status' | 'subscribe' | 'disable' | 'test', room: string, extra: Record<string, unknown> = {}): Promise<T> {
  if (!endpoint) throw new Error('Email notifications have not been connected yet.');
  const user = getAuth().currentUser;
  if (!user) throw new Error('Join the room again before using email alerts.');
  try {
    const response = await fetch(`${endpoint}/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ ...extra, room }), signal: AbortSignal.timeout(30_000),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Email service unavailable.');
    return body as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'Error') throw error;
    throw new Error('Email service could not be reached. Please try again later.');
  }
}
