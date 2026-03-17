// PHASE 3
import type { Issue } from './types';

const BASE = 'http://localhost:3737';

/** Thrown when the backend responds 404 — the date exists but has no issue. */
export class NoIssueError extends Error {
  constructor(public readonly date: string) {
    super(`No issue found for ${date}`);
  }
}

export async function fetchFeed(feedId: string): Promise<Issue> {
  const res = await fetch(`${BASE}/feed/${feedId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchFeedForDate(feedId: string, date: string): Promise<Issue> {
  const res = await fetch(`${BASE}/feed/${feedId}/${date}`);
  if (res.status === 404) throw new NoIssueError(date);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchAll(): Promise<Issue[]> {
  const res = await fetch(`${BASE}/all`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
