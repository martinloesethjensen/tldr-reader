// PHASE 4 + 7
import { useState, useEffect, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './App.css';
import { useFeed } from './hooks/useFeed';
import { useReadingList } from './hooks/useReadingList';
import { FeedTabs } from './components/FeedTabs';
import { TagFilter } from './components/TagFilter';
import { CategoryFilter } from './components/CategoryFilter';
import { ArticleCard } from './components/ArticleCard';
import { ReadingListPanel } from './components/ReadingListPanel';
import type { ActiveTab, FeedId, FeedMeta } from './types';

const FEEDS: FeedMeta[] = [
  { id: 'dev',  label: 'TLDR Dev',  emoji: '🧑‍💻', accent: '#38bdf8' },
  { id: 'ai',   label: 'TLDR AI',   emoji: '🤖',  accent: '#a78bfa' },
  { id: 'tech', label: 'TLDR Tech', emoji: '⚡',  accent: '#4ade80' },
];

export default function App() {
  const [activeTab,  setActiveTab]  = useState<ActiveTab>('dev');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [catFilter,  setCatFilter]  = useState('All');

  const feedDev  = useFeed('dev');
  const feedAi   = useFeed('ai');
  const feedTech = useFeed('tech');
  const rl       = useReadingList();

  const feedMap = { dev: feedDev, ai: feedAi, tech: feedTech } as const;
  const activeFeed = activeTab !== 'reading-list' ? feedMap[activeTab as FeedId] : null;
  const { issue, loading, error, isEmpty, currentDate, reload, prevDay, nextDay, canGoNext } =
    activeFeed ?? { issue: null, loading: false, error: null, isEmpty: false, currentDate: null, reload: () => {}, prevDay: () => {}, nextDay: () => {}, canGoNext: false };

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setActiveTags([]);
    setCatFilter('All');
  }, []);

  const toggleTag = (tag: string) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // Phase 7.6 — window title
  useEffect(() => {
    if (issue && activeTab !== 'reading-list') {
      const label = FEEDS.find(f => f.id === activeTab)?.label ?? activeTab;
      getCurrentWindow().setTitle(`TLDR Reader — ${label} · ${issue.date}`).catch(() => {});
    }
  }, [issue, activeTab]);

  // Phase 7.5 — keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case '1': handleTabChange('dev');           break;
        case '2': handleTabChange('ai');            break;
        case '3': handleTabChange('tech');          break;
        case '4': handleTabChange('reading-list');  break;
        case 'Escape': setActiveTags([]);           break;
        case 'r': case 'R':
          if (activeTab !== 'reading-list') reload();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab, reload, handleTabChange]);

  const filteredArticles = issue?.articles.filter(a =>
    (activeTags.length === 0 || a.tags.some(t => activeTags.includes(t))) &&
    (catFilter === 'All' || a.category === catFilter)
  ) ?? [];

  const allTags = [...new Set(issue?.articles.flatMap(a => a.tags) ?? [])].sort();
  const allCats = [...new Set(issue?.articles.map(a => a.category) ?? [])];

  const activeFeedMeta = FEEDS.find(f => f.id === activeTab);
  const accentColor = activeFeedMeta?.accent ?? '#64748b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 20px 12px',
        borderBottom: '1px solid #1e2530',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '-0.5px',
          color: '#dde4ef',
        }}>
          tldr.reader
        </span>
        {activeTab !== 'reading-list' && (
          <button
            onClick={reload}
            title="Refresh (R)"
            style={{
              marginLeft: 'auto',
              width: 30,
              height: 30,
              borderRadius: 6,
              border: '1px solid #1e2530',
              background: 'transparent',
              color: loading ? accentColor : '#64748b',
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ display: 'inline-block', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>↺</span>
          </button>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </header>

      {/* Tabs */}
      <FeedTabs
        feeds={FEEDS}
        active={activeTab}
        loading={{ dev: feedDev.loading, ai: feedAi.loading, tech: feedTech.loading }}
        onChange={handleTabChange}
        unreadCount={rl.unreadCount}
      />

      {/* Reading list view */}
      {activeTab === 'reading-list' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ReadingListPanel
            entries={rl.entries}
            onRemove={rl.remove}
            onToggleRead={rl.toggleRead}
            onMarkAllRead={rl.markAllRead}
            onClearRead={rl.clearRead}
          />
        </div>
      )}

      {/* Feed view */}
      {activeTab !== 'reading-list' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Phase 7.1 — CSS spinner */}
          {loading && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: `3px solid ${accentColor}25`,
                borderTopColor: accentColor,
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          )}

          {/* Phase 7.2 — Error state */}
          {!loading && error && (
            <div style={{
              margin: 20,
              padding: '16px 20px',
              background: '#1a0a0a',
              border: '1px solid #f8717140',
              borderRadius: 8,
              color: '#f87171',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span>⚠ {error}</span>
              <button
                onClick={reload}
                style={{
                  marginLeft: 'auto',
                  padding: '4px 12px',
                  border: '1px solid #f87171',
                  borderRadius: 4,
                  color: '#f87171',
                  background: 'transparent',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state — no issue published for this date */}
          {!loading && !error && isEmpty && currentDate && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: 40,
              color: '#64748b',
            }}>
              <span style={{ fontSize: 28 }}>📭</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: accentColor,
                  marginBottom: 6,
                }}>
                  {currentDate}
                </div>
                <div style={{ fontSize: 13 }}>No issue published for this date</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={prevDay}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid #1e2530',
                    borderRadius: 6,
                    background: 'transparent',
                    color: '#94a3b8',
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                  }}
                >◀ previous day</button>
                {canGoNext && (
                  <button
                    onClick={nextDay}
                    style={{
                      padding: '6px 14px',
                      border: '1px solid #1e2530',
                      borderRadius: 6,
                      background: 'transparent',
                      color: '#94a3b8',
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: 'pointer',
                    }}
                  >next day ▶</button>
                )}
              </div>
            </div>
          )}

          {/* Issue meta + filters + articles */}
          {!loading && !error && issue && (
            <>
              <div style={{
                padding: '12px 20px 10px',
                borderBottom: '1px solid #1e2530',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <button
                    onClick={prevDay}
                    title="Previous issue"
                    style={{
                      padding: '1px 6px',
                      border: '1px solid #1e2530',
                      borderRadius: 4,
                      background: 'transparent',
                      color: '#64748b',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace",
                      lineHeight: 1.6,
                    }}
                  >◀</button>
                  <span style={{
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: accentColor,
                    flexShrink: 0,
                  }}>
                    {currentDate ?? issue.date}
                  </span>
                  <button
                    onClick={nextDay}
                    disabled={!canGoNext}
                    title="Next issue"
                    style={{
                      padding: '1px 6px',
                      border: '1px solid #1e2530',
                      borderRadius: 4,
                      background: 'transparent',
                      color: canGoNext ? '#64748b' : '#2a3344',
                      fontSize: 11,
                      cursor: canGoNext ? 'pointer' : 'default',
                      fontFamily: "'JetBrains Mono', monospace",
                      lineHeight: 1.6,
                    }}
                  >▶</button>
                  <span style={{ fontSize: 13, color: '#8899aa', marginLeft: 2 }}>
                    {issue.headline}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <CategoryFilter categories={allCats} active={catFilter} onChange={setCatFilter} />
                  <TagFilter tags={allTags} active={activeTags} onToggle={toggleTag} onClear={() => setActiveTags([])} />
                </div>
              </div>

              <div style={{
                padding: '8px 20px',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#64748b',
                borderBottom: '1px solid #1e2530',
                flexShrink: 0,
              }}>
                {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                {(activeTags.length > 0 || catFilter !== 'All') && ' · filtered'}
              </div>

              {/* Phase 7.3 — Empty filter state */}
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredArticles.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: 13, padding: '20px 0' }}>
                    no articles match ·{' '}
                    <button
                      onClick={() => { setActiveTags([]); setCatFilter('All'); }}
                      style={{ color: '#94a3b8', textDecoration: 'underline', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none' }}
                    >
                      clear filters
                    </button>
                  </div>
                ) : (
                  filteredArticles.map(article => (
                    <ArticleCard
                      key={article.url}
                      article={article}
                      activeTags={activeTags}
                      onTagClick={toggleTag}
                      isInReadingList={rl.isInList(article.url)}
                      isRead={rl.isRead(article.url)}
                      onToggleReadingList={() =>
                        rl.isInList(article.url)
                          ? rl.remove(article.url)
                          : rl.add(article, activeTab as FeedId, issue.date)
                      }
                      onToggleRead={() => rl.toggleRead(article.url)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
