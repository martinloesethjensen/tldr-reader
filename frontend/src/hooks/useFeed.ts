// PHASE 3 + date navigation
import { useState, useEffect } from 'react';
import { fetchFeed, fetchFeedForDate, NoIssueError } from '../api';
import type { FeedId, Issue } from '../types';

// In-memory cache keyed by "feedId:date", plus "feedId:latest" for the auto-resolved issue.
// Lives only for the duration of the app session — never persisted.
const cache = new Map<string, Issue>();

function ck(feedId: FeedId, date: string) { return `${feedId}:${date}`; }
const latestKey = (feedId: FeedId) => `${feedId}:latest`;

/** Move dateStr by n weekdays (positive = forward, negative = back). */
export function addWeekdays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  let rem = Math.abs(n);
  const step = n > 0 ? 1 : -1;
  while (rem > 0) {
    dt.setUTCDate(dt.getUTCDate() + step);
    if (dt.getUTCDay() !== 0 && dt.getUTCDay() !== 6) rem--;
  }
  return dt.toISOString().slice(0, 10);
}

interface UseFeedResult {
  issue:       Issue | null;
  loading:     boolean;
  error:       string | null;
  /** True when the backend confirmed no issue exists for the requested date. */
  isEmpty:     boolean;
  /** The date currently being viewed — populated even when isEmpty is true. */
  currentDate: string | null;
  reload:      () => void;
}

/**
 * targetDate = null  → fetch the latest issue
 * targetDate = "YYYY-MM-DD" → fetch that specific date
 */
export function useFeed(feedId: FeedId, targetDate: string | null): UseFeedResult {
  const [issue,       setIssue]       = useState<Issue | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [isEmpty,     setIsEmpty]     = useState(false);
  // The date we are currently showing (null = still resolving latest)
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  async function doLoad(date: string | null, bust = false) {
    // Cache hit — serve immediately without a network request
    const key = date !== null ? ck(feedId, date) : latestKey(feedId);
    if (!bust && cache.has(key)) {
      const cached = cache.get(key)!;
      setIssue(cached);
      setCurrentDate(cached.date);
      setIsEmpty(false);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setIsEmpty(false);
    setIssue(null);
    try {
      const data = date !== null
        ? await fetchFeedForDate(feedId, date)
        : await fetchFeed(feedId);
      // Store under both the resolved date key and (for latest loads) the latest key
      cache.set(ck(feedId, data.date), data);
      if (date === null) cache.set(latestKey(feedId), data);
      setIssue(data);
      setCurrentDate(data.date);
    } catch (e) {
      if (e instanceof NoIssueError) {
        setIssue(null);
        setIsEmpty(true);
        setCurrentDate(e.date);
      } else {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch whenever feedId or targetDate changes
  useEffect(() => {
    setCurrentDate(null);
    const key = targetDate !== null ? ck(feedId, targetDate) : latestKey(feedId);
    const cached = cache.get(key);
    if (cached) {
      setIssue(cached);
      setCurrentDate(cached.date);
      setIsEmpty(false);
      setLoading(false);
      setError(null);
    } else {
      setIssue(null);
      setIsEmpty(false);
      setLoading(true);
      doLoad(targetDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedId, targetDate]);

  const reload = () => {
    if (issue) cache.delete(ck(feedId, issue.date));
    if (targetDate === null) cache.delete(latestKey(feedId));
    doLoad(targetDate, true);
  };

  return { issue, loading, error, isEmpty, currentDate, reload };
}

export function bustCache(feedId: FeedId) {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(`${feedId}:`)) cache.delete(key);
  }
  cache.delete(latestKey(feedId));
}
