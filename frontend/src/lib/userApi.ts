/**
 * User API Client
 * Handles user profile, onboarding, and NST access
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export interface UserProfile {
  _id: string;
  clerkId: string;
  email: string;
  username?: string;
  onboardingComplete: boolean;
  interests: string[];
  college?: string;
  isNstVerified: boolean;
}

export interface OnboardingData {
  clerkId: string;
  email: string;
  username?: string;
  interests: string[];
  college: string;
}

// Get user profile
export async function getUserProfile(clerkId: string): Promise<{ user: UserProfile | null; needsOnboarding: boolean }> {
  const response = await fetch(`${API_URL}/api/users/${clerkId}`);
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to fetch user');
  return { user: data.user, needsOnboarding: data.needsOnboarding };
}

// Complete onboarding
export async function completeOnboarding(data: OnboardingData): Promise<{ user: UserProfile; isNstVerified: boolean }> {
  const response = await fetch(`${API_URL}/api/users/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to save onboarding');
  return { user: result.user, isNstVerified: result.isNstVerified };
}

// Check if user can access NST
export async function canAccessNst(clerkId: string): Promise<{ canAccess: boolean; reason: string }> {
  const response = await fetch(`${API_URL}/api/users/${clerkId}/can-access-nst`);
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to check NST access');
  return { canAccess: data.canAccess, reason: data.reason };
}

// Check if email is from NST domain (quick check)
export async function checkNstEmail(email: string): Promise<{ isNstEmail: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/users/check-nst-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to check email');
  return { isNstEmail: data.isNstEmail, message: data.message };
}

// Utility: Check if email is NST domain (client-side)
export function isNstEmail(email: string): boolean {
  return email?.endsWith('@nst.rishihood.edu.in') || false;
}
