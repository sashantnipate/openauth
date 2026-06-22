import { OpenAuth } from '../OpenAuth';
import { LogoutResult } from '../types';

export async function logoutAction(
  auth: OpenAuth,
  token?: string
): Promise<LogoutResult> {
  
  if (token) {
    // Locate the session record mapping this exact token signature and destroy it from MongoDB collections
    const existingSession = await auth.adapter.sessions.findByToken(token);
    if (existingSession) {
      await auth.adapter.sessions.delete(existingSession.id);
    }
  }
  
  return {
    success: true,
    message: "Identity engine transaction cleared. Inbound token handles invalidated successfully."
  };
}