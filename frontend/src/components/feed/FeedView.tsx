import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBanner } from './ErrorBanner';
import { EmptyState } from './EmptyState';
import { IssueNav } from './IssueNav';
import { ArticleList } from './ArticleList';
import type { UseFeedResult } from '../../hooks/useFeed';
import type { UseReadingList } from '../../hooks/useReadingList';
import type { UseArticleFilterResult } from '../../hooks/useArticleFilter';
import type { Article, FeedId } from '../../types';

interface Props {
  feed:         UseFeedResult;
  activeTab:    FeedId;
  accentColor:  string;
  canGoNext:    boolean;
  isLatest:     boolean;
  onPrevDay:    () => void;
  onNextDay:    () => void;
  onGoToLatest: () => void;
  filter:       UseArticleFilterResult;
  rl:           UseReadingList;
}

export function FeedView({
  feed, activeTab, accentColor,
  canGoNext, isLatest, onPrevDay, onNextDay, onGoToLatest,
  filter, rl,
}: Props) {
  const { issue, loading, error, isEmpty, currentDate, reload } = feed;

  const onToggleReadingList = (article: Article) =>
    rl.isInList(article.url)
      ? rl.remove(article.url)
      : rl.add(article, activeTab, issue!.date);

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

      {loading && <LoadingSpinner accentColor={accentColor} />}

      {!loading && error && <ErrorBanner error={error} onRetry={reload} />}

      {!loading && !error && isEmpty && currentDate && (
        <EmptyState
          currentDate={currentDate}
          accentColor={accentColor}
          canGoNext={canGoNext}
          onPrevDay={onPrevDay}
          onNextDay={onNextDay}
        />
      )}

      {!loading && !error && issue && (
        <>
          <IssueNav
            issue={issue}
            currentDate={currentDate}
            accentColor={accentColor}
            canGoNext={canGoNext}
            isLatest={isLatest}
            onPrevDay={onPrevDay}
            onNextDay={onNextDay}
            onGoToLatest={onGoToLatest}
            allCats={filter.allCats}
            catFilter={filter.catFilter}
            allTags={filter.allTags}
            activeTags={filter.activeTags}
            onCatChange={filter.setCatFilter}
            onTagToggle={filter.toggleTag}
            onTagClear={filter.clearFilters}
          />
          <ArticleList
            filteredArticles={filter.filteredArticles}
            activeTags={filter.activeTags}
            catFilter={filter.catFilter}
            onTagClick={filter.toggleTag}
            onClearFilters={filter.clearFilters}
            isInReadingList={rl.isInList}
            isRead={rl.isRead}
            onToggleReadingList={onToggleReadingList}
            onToggleRead={rl.toggleRead}
          />
        </>
      )}
    </div>
  );
}
