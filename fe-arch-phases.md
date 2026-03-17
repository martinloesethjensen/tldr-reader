# Frontend Architecture Refactor

## What's already good
- Hooks properly separated from components
- `api.ts` is cleanly isolated
- Module-level cache/singleton patterns in `useFeed` and `useReadingList` are intentional and correct — don't change them

## Real problems

1. **`App.tsx` does five jobs** — layout shell, keyboard handler, window-title updater, filter state owner, and article list renderer
2. **Tauri imports in components crash in browser mode** — `ArticleCard` imports `@tauri-apps/plugin-opener` directly; `App.tsx` imports `@tauri-apps/api/window`. Both throw if you run `vite dev` without a Tauri host
3. **`FEEDS` constant lives in `App.tsx`** but is static config, not state — it gets needlessly drilled as a prop to `FeedTabs`
4. **`@keyframes spin/pulse` are injected as `<style>` tags** inside JSX — duplicated and wrong place
5. **`ReadingListPanel` reconstructs `Article` shape inline** from `ReadingListEntry` to pass to `ArticleCard` — a type mismatch smell
6. **`ArticleCard` has optional no-op props** (`onTagClick={() => {}}`, `activeTags={[]}`) when used in the reading list context — a sign the component is serving two contexts it shouldn't

---

## Target Directory Tree

```
src/
  main.tsx                          (unchanged)
  App.tsx                           (gutted — layout shell only, ~80 lines)
  App.css                           (keyframe animations moved here)

  config/
    feeds.ts                        (FEEDS constant, moved from App.tsx)

  lib/
    tauri.ts                        (isTauri, openExternalUrl, setWindowTitle)
    storage.ts                      (localStorage helpers from useReadingList)

  types/
    article.ts                      (Article, Issue)
    feed.ts                         (FeedId, FeedMeta, ActiveTab)
    readingList.ts                  (ReadingListEntry)
    index.ts                        (barrel re-export — existing imports unchanged)

  hooks/
    useFeed.ts                      (minor cleanup)
    useReadingList.ts               (imports storage from lib/)
    useArticleFilter.ts             (extracted from App.tsx)
    useKeyboardShortcuts.ts         (extracted from App.tsx)
    useWindowTitle.ts               (extracted from App.tsx)

  components/
    layout/
      AppHeader.tsx                 (extracted from App.tsx)
    feed/
      FeedView.tsx                  (top-level feed branch, extracted from App.tsx)
      IssueNav.tsx                  (date nav + headline row)
      ArticleList.tsx               (count bar + list + empty-filter state)
      ArticleCard.tsx               (moved, no logic changes)
      LoadingSpinner.tsx            (extracted)
      ErrorBanner.tsx               (extracted)
      EmptyState.tsx                (extracted)
    filters/
      TagFilter.tsx                 (moved)
      CategoryFilter.tsx            (moved)
    tabs/
      FeedTabs.tsx                  (moved, drops feeds prop)
    readingList/
      ReadingListPanel.tsx          (moved, minor fix)
      ReadingListEntryCard.tsx      (new — takes ReadingListEntry directly)
```

---

## Key Design Decisions

### `lib/tauri.ts` — most important new file

```ts
export function isTauri(): boolean
export async function openExternalUrl(url: string): Promise<void>  // falls back to window.open
export async function setWindowTitle(title: string): Promise<void> // no-op outside Tauri
```

No component or hook imports from `@tauri-apps/*` directly. Only this file does.

### `useArticleFilter(issue)` hook

Owns `activeTags` and `catFilter` state. Resets automatically when `issue` changes. Returns
`{ filteredArticles, allTags, allCats, activeTags, catFilter, toggleTag, setCatFilter, clearFilters }`.
Removes ~20 lines of interleaved state from `App.tsx`.

### `ReadingListEntryCard` instead of reconstructing `Article`

`ReadingListPanel` currently does `{ title: e.title, url: e.url, ... }` to pass a
`ReadingListEntry` as an `Article` to `ArticleCard`. A dedicated `ReadingListEntryCard` takes
`ReadingListEntry` directly, avoiding the mismatch and eliminating the meaningless
`activeTags={[]}` no-op props.

### `config/feeds.ts` — static config, not a prop

`FeedTabs` imports `FEEDS` directly. The `feeds` prop on `FeedTabs` is removed.

---

## Patterns to adopt

- Only `lib/tauri.ts` imports from `@tauri-apps/*`
- All hooks export a named interface for their return type (e.g. `UseFeedResult`)
- Derived values (`allTags`, `filteredArticles`) stay derived — never put them in state
- Keyframe animations in `App.css`, not injected `<style>` tags

## Patterns to avoid

- The `activeFeed ?? { issue: null, loading: false, reload: () => {}, ... }` null-default object — grows with every new field; guard at render level instead
- Optional no-op props on shared components to handle multiple contexts — use separate components

---

## Phases

Each phase leaves the app in a working, buildable state and can be committed independently.

### Phase 1 — Moves and reorganisation (no logic changes)

- [ ] Create `src/config/feeds.ts` — move `FEEDS` from `App.tsx`; remove the `feeds` prop from `FeedTabs`, have it import directly
- [ ] Create `src/types/` with `article.ts`, `feed.ts`, `readingList.ts`, and a barrel `index.ts`; delete `src/types.ts`
- [ ] Move `@keyframes spin` and `@keyframes pulse` into `App.css`; remove both `<style>` tags from JSX
- [ ] Move components into subdirectories (`feed/`, `filters/`, `tabs/`, `readingList/`, `layout/`), updating imports as you go

### Phase 2 — Tauri abstraction

- [ ] Create `src/lib/tauri.ts` with `isTauri()`, `openExternalUrl()`, `setWindowTitle()`
- [ ] Update `ArticleCard` to use `openExternalUrl` from `lib/tauri.ts`
- [ ] Update the window-title effect in `App.tsx` to use `setWindowTitle` from `lib/tauri.ts`
- [ ] Verify: `vite dev` without a Tauri host no longer throws on article link clicks

### Phase 3 — Storage extraction

- [ ] Create `src/lib/storage.ts` — move `loadFromStorage`, `saveToStorage`, and `STORAGE_KEY` from `useReadingList.ts`
- [ ] Update `useReadingList.ts` to import from `lib/storage.ts`

### Phase 4 — Hook extraction

- [ ] Create `useArticleFilter.ts` — move filter state and derived values; update `App.tsx`
- [ ] Create `useKeyboardShortcuts.ts` — move the keyboard `useEffect`; update `App.tsx`
- [ ] Create `useWindowTitle.ts` — move the window-title `useEffect`; update `App.tsx`

After this phase `App.tsx` should be under 80 lines.

### Phase 5 — Component extraction

- [ ] Extract `AppHeader.tsx`
- [ ] Extract `LoadingSpinner.tsx`, `ErrorBanner.tsx`, `EmptyState.tsx`
- [ ] Extract `IssueNav.tsx` (date nav + headline row)
- [ ] Extract `ArticleList.tsx` (count bar + list + empty-filter state)
- [ ] Compose `FeedView.tsx` from the above

After this phase `App.tsx` should be under 40 lines.

### Phase 6 — Reading list type fix

- [ ] Create `ReadingListEntryCard.tsx` that accepts `ReadingListEntry` directly
- [ ] Update `ReadingListPanel.tsx` to use `ReadingListEntryCard` — remove inline `Article` reconstruction
- [ ] Confirm `ArticleCard` is feed-view only; remove or document the optional no-op props

---

## Cleanup note

`bustCache` is exported from `useFeed.ts` but appears to be unused — confirm and delete if so.
