import { useState, useEffect } from 'react';
import type { Article, Issue } from '../types';

export interface UseArticleFilterResult {
  filteredArticles: Article[];
  allTags:          string[];
  allCats:          string[];
  activeTags:       string[];
  catFilter:        string;
  toggleTag:        (tag: string) => void;
  setCatFilter:     (cat: string) => void;
  clearFilters:     () => void;
}

export function useArticleFilter(issue: Issue | null): UseArticleFilterResult {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [catFilter,  setCatFilter]  = useState('All');

  // Reset filters whenever the issue changes (tab switch or date navigation)
  useEffect(() => {
    setActiveTags([]);
    setCatFilter('All');
  }, [issue]);

  const toggleTag = (tag: string) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const clearFilters = () => { setActiveTags([]); setCatFilter('All'); };

  const filteredArticles = issue?.articles.filter(a =>
    (activeTags.length === 0 || a.tags.some(t => activeTags.includes(t))) &&
    (catFilter === 'All' || a.category === catFilter)
  ) ?? [];

  const allTags = [...new Set(issue?.articles.flatMap(a => a.tags) ?? [])].sort();
  const allCats = [...new Set(issue?.articles.map(a => a.category) ?? [])];

  return { filteredArticles, allTags, allCats, activeTags, catFilter, toggleTag, setCatFilter, clearFilters };
}
