import { useState, useCallback } from 'react';
import './App.css';
import { FEEDS } from './config/feeds';
import { useFeed, addWeekdays } from './hooks/useFeed';
import { useReadingList } from './hooks/useReadingList';
import { useArticleFilter } from './hooks/useArticleFilter';
import { useWindowTitle } from './hooks/useWindowTitle';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';
import { AppHeader } from './components/layout/AppHeader';
import { FeedTabs } from './components/tabs/FeedTabs';
import { FeedView } from './components/feed/FeedView';
import { ReadingListPanel } from './components/readingList/ReadingListPanel';
import type { ActiveTab, FeedId } from './types';

export default function App() {
  const [activeTab,  setActiveTab]  = useState<ActiveTab>('dev');
  const [targetDate, setTargetDate] = useState<string | null>(null);

  const feedDev  = useFeed('dev',  targetDate);
  const feedAi   = useFeed('ai',   targetDate);
  const feedTech = useFeed('tech', targetDate);
  const rl       = useReadingList();

  const feedMap    = { dev: feedDev, ai: feedAi, tech: feedTech } as const;
  const activeFeed = activeTab !== 'reading-list' ? feedMap[activeTab as FeedId] : null;

  const filter      = useArticleFilter(activeFeed?.issue ?? null);
  const dateForNav  = targetDate ?? activeFeed?.currentDate ?? null;
  const today       = new Date().toISOString().slice(0, 10);
  const canGoNext   = !!dateForNav && addWeekdays(dateForNav, 1) <= today;
  const isLatest    = targetDate === null;
  const accentColor = FEEDS.find(f => f.id === activeTab)?.accent ?? '#64748b';

  const { theme, toggle: toggleTheme } = useTheme();

  const handleTabChange  = useCallback((tab: ActiveTab) => setActiveTab(tab), []);
  const handlePrevDay    = () => { if (dateForNav) setTargetDate(addWeekdays(dateForNav, -1)); };
  const handleNextDay    = () => { if (dateForNav) setTargetDate(addWeekdays(dateForNav,  1)); };
  const handleGoToLatest = () => setTargetDate(null);

  useWindowTitle(activeFeed?.issue ?? null, activeTab);
  useKeyboardShortcuts({
    activeTab,
    onTabChange: handleTabChange,
    onReload:    () => activeFeed?.reload(),
    onEscape:    filter.clearFilters,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppHeader
        activeTab={activeTab}
        loading={activeFeed?.loading ?? false}
        accentColor={accentColor}
        theme={theme}
        onReload={() => activeFeed?.reload()}
        onToggleTheme={toggleTheme}
      />
      <FeedTabs
        active={activeTab}
        loading={{ dev: feedDev.loading, ai: feedAi.loading, tech: feedTech.loading }}
        onChange={handleTabChange}
        unreadCount={rl.unreadCount}
      />
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
      {activeFeed && (
        <FeedView
          feed={activeFeed}
          activeTab={activeTab as FeedId}
          accentColor={accentColor}
          canGoNext={canGoNext}
          isLatest={isLatest}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onGoToLatest={handleGoToLatest}
          filter={filter}
          rl={rl}
        />
      )}
    </div>
  );
}
