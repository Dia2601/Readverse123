import { CreativePerspective, PerspectiveComment } from "../types";

const LOCAL_PERSPECTIVES_KEY = "readverse_creative_perspectives_v1";
const LOCAL_BOOKMARKS_KEY = "readverse_bookmarked_perspectives_v1";

export function getLocalPerspectives(): CreativePerspective[] {
  try {
    const raw = localStorage.getItem(LOCAL_PERSPECTIVES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading local perspectives:", e);
    return [];
  }
}

export function saveLocalPerspective(item: CreativePerspective): void {
  try {
    const list = getLocalPerspectives();
    const existingIdx = list.findIndex((p) => p.id === item.id);
    if (existingIdx >= 0) {
      list[existingIdx] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(LOCAL_PERSPECTIVES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Error saving local perspective:", e);
  }
}

export function deleteLocalPerspective(id: string): void {
  try {
    const list = getLocalPerspectives().filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_PERSPECTIVES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Error deleting local perspective:", e);
  }
}

export function getBookmarkedPerspectiveIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function togglePerspectiveBookmark(id: string): boolean {
  try {
    const ids = getBookmarkedPerspectiveIds();
    const exists = ids.includes(id);
    const updated = exists ? ids.filter((item) => item !== id) : [...ids, id];
    localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}

// Fetch all public perspectives from server + merge with local public ones
export async function fetchPublicPerspectives(): Promise<CreativePerspective[]> {
  try {
    const res = await fetch("/api/creative-perspectives");
    if (res.ok) {
      const serverList: CreativePerspective[] = await res.json();
      // Also get any local public perspectives that may not yet be on server
      const localList = getLocalPerspectives().filter((p) => p.visibility === "public");
      const map = new Map<string, CreativePerspective>();
      
      serverList.forEach((p) => map.set(p.id, p));
      localList.forEach((p) => {
        if (!map.has(p.id)) {
          map.set(p.id, p);
        }
      });

      return Array.from(map.values());
    }
  } catch (e) {
    console.warn("Could not fetch remote perspectives, falling back to local:", e);
  }

  // Fallback to local public perspectives
  return getLocalPerspectives().filter((p) => p.visibility === "public");
}

// Publish or update perspective
export async function syncPerspectiveToServer(item: CreativePerspective): Promise<CreativePerspective> {
  // Always save locally first
  saveLocalPerspective(item);

  try {
    const res = await fetch("/api/creative-perspectives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const synced = await res.json();
      saveLocalPerspective(synced);
      return synced;
    }
  } catch (e) {
    console.warn("Server sync error (saved locally):", e);
  }

  return item;
}
