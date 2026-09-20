import { UserProfile, RocketCustomization, PlanetId } from "../types";
import { ROCKET_SKINS } from "../components/RocketAvatar";

const STORAGE_ACCOUNTS_KEY = "readverse_accounts_v1";
const STORAGE_CURRENT_ID_KEY = "readverse_current_account_id_v1";

export function createEmptyUserProfile(): UserProfile {
  return {
    id: `astronaut_${Date.now()}`,
    name: "",
    avatarRocket: { ...ROCKET_SKINS.cyan },
    readingStyle: "",
    readWorks: [],
    exploringWorks: [],
    workItems: [],
    interests: [],
    readingFrequency: "",
    experienceLevel: "not_set",
    joinedDate: new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    starsCount: 0,
    visitedPlanets: [],
    stats: {
      analysis: 0,
      multiPerspective: 0,
      criticalReasoning: 0,
      connection: 0,
      creativity: 0,
    },
    completedActivities: [],
    createdConstellations: [],
    badgesWon: [],
    savedCreations: [],
  };
}

export function getStoredAccounts(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((acc: any): UserProfile => ({
      ...acc,
      readWorks: Array.isArray(acc.readWorks) ? acc.readWorks.filter(Boolean) : [],
      exploringWorks: Array.isArray(acc.exploringWorks) ? acc.exploringWorks.filter(Boolean) : [],
      workItems: Array.isArray(acc.workItems)
        ? acc.workItems.map((w: any) => ({
            ...w,
            title: w.title || w.workTitle || "",
            workTitle: w.workTitle || w.title || "",
            author: w.author || "Khuyết danh",
            status: w.status || "read",
          }))
        : [],
    }));
  } catch (e) {
    console.warn("Failed to load accounts from storage:", e);
    return [];
  }
}

export function saveAccountToStorage(account: UserProfile): void {
  try {
    const accounts = getStoredAccounts();
    const existingIdx = accounts.findIndex((a) => a.id === account.id);
    let updated: UserProfile[];
    if (existingIdx >= 0) {
      updated = [...accounts];
      updated[existingIdx] = account;
    } else {
      updated = [account, ...accounts];
    }
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updated));
    localStorage.setItem(STORAGE_CURRENT_ID_KEY, account.id);
  } catch (e) {
    console.warn("Failed to save account to storage:", e);
  }
}

export function getCurrentAccountId(): string | null {
  try {
    return localStorage.getItem(STORAGE_CURRENT_ID_KEY);
  } catch {
    return null;
  }
}

export function setCurrentAccountId(id: string): void {
  try {
    localStorage.setItem(STORAGE_CURRENT_ID_KEY, id);
  } catch (e) {
    console.warn("Failed to set current account id:", e);
  }
}

export function getActiveUser(): UserProfile | null {
  const currentId = getCurrentAccountId();
  const accounts = getStoredAccounts();
  if (currentId) {
    const found = accounts.find((a) => a.id === currentId);
    if (found) return found;
  }
  if (accounts.length > 0) {
    return accounts[0];
  }
  return null;
}
