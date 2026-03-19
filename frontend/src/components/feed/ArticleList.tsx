import { ArticleCard } from './ArticleCard';
import type { Article } from '../../types';

interface Props {
  filteredArticles:    Article[];
  activeTags:          string[];
  catFilter:           string;
  onTagClick:          (tag: string) => void;
  onClearFilters:      () => void;
  isInReadingList:     (url: string) => boolean;
  isRead:              (url: string) => boolean;
  onToggleReadingList: (article: Article) => void;
  onToggleRead:        (url: string) => void;
}

export function ArticleList({
  filteredArticles, activeTags, catFilter,
  onTagClick, onClearFilters,
  isInReadingList, isRead, onToggleReadingList, onToggleRead,
}: Props) {
  return (
    <>
      <div style={{
        padding: '8px 20px',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
        {(activeTags.length > 0 || catFilter !== 'All') && ' · filtered'}
      </div>

      <div className="articles-grid" style={{ padding: '12px 20px' }}>
        {filteredArticles.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
            no articles match ·{' '}
            <button
              onClick={onClearFilters}
              style={{ color: 'var(--text-subtle)', textDecoration: 'underline', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none' }}
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
              onTagClick={onTagClick}
              isInReadingList={isInReadingList(article.url)}
              isRead={isRead(article.url)}
              onToggleReadingList={() => onToggleReadingList(article)}
              onToggleRead={() => onToggleRead(article.url)}
            />
          ))
        )}
      </div>
    </>
  );
}
