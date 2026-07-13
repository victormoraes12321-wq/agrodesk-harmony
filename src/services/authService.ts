import { getAccessToken, getRefreshToken } from "@/services/api";
import { loginApi, logoutApi } from "@/services/helpdesk-api";
import type { User } from "@/types";

const STORAGE_KEY = "agrodesk-ti-current-user-v1";

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  if (!getRefreshToken() && !getAccessToken()) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as User;
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveUser(user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export async function login(username: string, password: string): Promise<User> {
  const payload = await loginApi(username, password);
  const user = payload.user;
  saveUser(user);
  return user;
}

export async function logout(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await logoutApi();
  } catch {
    // ignore logout failures and still clear local user state
  }
  localStorage.removeItem(STORAGE_KEY);
}

export function getCurrentUser(): User | null {
  return getStoredUser();
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
