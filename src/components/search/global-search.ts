interface SearchItem {
  lang: string;
  group: string;
  slug: string;
  href?: string;
  frontmatter: {
    title: string;
    image?: string;
    description?: string;
    categories?: string[];
    tags?: string[];
  };
  content: string;
}

interface SearchCopy {
  title: string;
  label: string;
  placeholder: string;
  loading: string;
  error: string;
  prompt: string;
  noResults: string;
  resultsOne: string;
  resultsMany: string;
  inLabel: string;
  shortcut: string;
  navigate: string;
  select: string;
  close: string;
  seconds: string;
  categoriesLabel: string;
  tagsLabel: string;
  groupLabels: Record<string, string>;
}

interface PreparedSearchItem extends SearchItem {
  plainContent: string;
  titleSearch: string;
  descriptionSearch: string;
  categoriesSearch: string;
  tagsSearch: string;
  contentSearch: string;
}

interface SearchConfig {
  lang: string;
  searchIndexUrl: string;
  defaultLanguage: string;
  defaultLanguageInSubdir: boolean;
  trailingSlash: boolean;
  copy: SearchCopy;
}

type SearchCopyOverrides = Partial<SearchCopy>;

interface SearchState {
  isOpen: boolean;
  activeIndex: number;
  activeSearchId: number;
  preparedIndex: PreparedSearchItem[] | null;
  indexPromise: Promise<PreparedSearchItem[]> | null;
  previousActiveElement: HTMLElement | null;
  activeScopeGroups: string[] | null;
  activeCopy: SearchCopy;
}

let openGlobalSearchHandler: ((trigger?: HTMLElement | null) => void) | null = null;

const decodeHtmlEntities = (value: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
};

const plainifyContent = (value = ''): string => {
  return decodeHtmlEntities(
    value
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
      .replace(/<\/?[^>]+(>|$)/g, ' ')
      .replace(/[#*_`>~-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
};

const normalizeSearchValue = (value: string, lang: string): string => {
  return value.toLocaleLowerCase(lang).replace(/\s+/g, ' ').trim();
};

const escapeHtml = (value = ''): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const escapeRegExp = (value = ''): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const humanizeGroup = (value: string): string => {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const highlightText = (value: string, query: string, lang: string): string => {
  if (!value) return '';
  if (!query) return escapeHtml(value);

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return value
    .split(regex)
    .map((part) =>
      part.toLocaleLowerCase(lang) === query.toLocaleLowerCase(lang)
        ? `<mark>${escapeHtml(part)}</mark>`
        : escapeHtml(part)
    )
    .join('');
};

const buildExcerpt = (item: PreparedSearchItem, query: string, lang: string): string => {
  if (!item.plainContent) return '';

  const excerptSource = item.plainContent;
  const normalizedQuery = normalizeSearchValue(query, lang);
  const matchIndex = item.contentSearch.indexOf(normalizedQuery);

  if (matchIndex < 0) {
    const fallbackExcerpt = excerptSource.slice(0, 180).trim();
    return fallbackExcerpt.length < excerptSource.length ? `${fallbackExcerpt}...` : fallbackExcerpt;
  }

  const start = Math.max(0, matchIndex - 60);
  const end = Math.min(excerptSource.length, matchIndex + query.length + 120);
  const excerpt = excerptSource.slice(start, end).trim();
  const prefix = start > 0 ? '... ' : '';
  const suffix = end < excerptSource.length ? ' ...' : '';

  return `${prefix}${excerpt}${suffix}`;
};

const localizePath = (slug: string, config: SearchConfig): string => {
  const path = slug === '/' ? '/' : slug.startsWith('/') ? slug : `/${slug}`;
  let localizedPath = path;

  if (config.lang === config.defaultLanguage) {
    localizedPath = config.defaultLanguageInSubdir && path !== '/' ? `/${config.lang}${path}` : path;
    if (config.defaultLanguageInSubdir && path === '/') {
      localizedPath = `/${config.lang}`;
    }
  } else {
    localizedPath = path === '/' ? `/${config.lang}` : `/${config.lang}${path}`;
  }

  if (config.trailingSlash) {
    return localizedPath !== '/' && !localizedPath.endsWith('/') ? `${localizedPath}/` : localizedPath;
  }

  return localizedPath !== '/' && localizedPath.endsWith('/') ? localizedPath.slice(0, -1) : localizedPath;
};

const formatResultSummary = (count: number, copy: SearchCopy): string => {
  if (count === 1) return copy.resultsOne;
  return copy.resultsMany.replace('{count}', String(count));
};

const getTriggerCopyOverrides = (trigger?: HTMLElement | null): SearchCopyOverrides => {
  if (!trigger?.dataset.searchCopy) return {};

  try {
    const parsedValue = JSON.parse(trigger.dataset.searchCopy) as SearchCopyOverrides;
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch (error) {
    console.error('Invalid search copy override', error);
    return {};
  }
};

const getTriggerScopeGroups = (trigger?: HTMLElement | null): string[] | null => {
  const scopeValue = trigger?.dataset.searchScope;
  if (!scopeValue) return null;

  const scopeGroups = scopeValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return scopeGroups.length > 0 ? scopeGroups : null;
};

export const initGlobalSearch = (): void => {
  const root = document.querySelector<HTMLElement>('[data-global-search-root]');
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';

  const titleElement = root.querySelector<HTMLElement>('[data-global-search-title]');
  const labelElement = root.querySelector<HTMLElement>('[data-global-search-label]');
  const input = root.querySelector<HTMLInputElement>('[data-global-search-input]');
  const resultsElement = root.querySelector<HTMLElement>('[data-global-search-results]');
  const statusElement = root.querySelector<HTMLElement>('[data-global-search-status]');
  const summaryElement = root.querySelector<HTMLElement>('[data-global-search-summary]');
  const summaryCountElement = root.querySelector<HTMLElement>('[data-global-search-summary-count]');
  const summaryTimeElement = root.querySelector<HTMLElement>('[data-global-search-summary-time]');

  if (
    !titleElement ||
    !labelElement ||
    !input ||
    !resultsElement ||
    !statusElement ||
    !summaryElement ||
    !summaryCountElement ||
    !summaryTimeElement
  ) {
    return;
  }

  const config: SearchConfig = {
    lang: root.dataset.lang || document.documentElement.lang || 'en',
    searchIndexUrl: root.dataset.searchIndexUrl || '/search-index.json',
    defaultLanguage: root.dataset.defaultLanguage || 'en',
    defaultLanguageInSubdir: root.dataset.defaultLanguageInSubdir === 'true',
    trailingSlash: root.dataset.trailingSlash === 'true',
    copy: JSON.parse(root.dataset.copy || '{}') as SearchCopy,
  };

  const state: SearchState = {
    isOpen: false,
    activeIndex: -1,
    activeSearchId: 0,
    preparedIndex: null,
    indexPromise: null,
    previousActiveElement: null,
    activeScopeGroups: null,
    activeCopy: config.copy,
  };

  const controller = new AbortController();

  const applyActiveCopy = (nextCopy: SearchCopy) => {
    state.activeCopy = nextCopy;
    titleElement.textContent = nextCopy.title;
    labelElement.textContent = nextCopy.label;
    input.placeholder = nextCopy.placeholder;
  };

  const renderPrompt = () => {
    statusElement.textContent = state.activeCopy.prompt;
    resultsElement.innerHTML = `
      <div class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-600">
        ${escapeHtml(state.activeCopy.prompt)}
      </div>
    `;
    summaryElement.hidden = true;
  };

  const renderError = () => {
    statusElement.textContent = state.activeCopy.error;
    resultsElement.innerHTML = `
      <div class="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-700">
        ${escapeHtml(state.activeCopy.error)}
      </div>
    `;
    summaryElement.hidden = true;
  };

  const getPreparedIndex = async (): Promise<PreparedSearchItem[]> => {
    if (state.preparedIndex) return state.preparedIndex;
    if (!state.indexPromise) {
      state.indexPromise = fetch(config.searchIndexUrl, {
        headers: {
          Accept: 'application/json',
        },
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to load search index: ${response.status}`);
          }

          const data = (await response.json()) as SearchItem[];
          const localeItems = Array.isArray(data) ? data.filter((item) => item.lang === config.lang) : [];

          state.preparedIndex = localeItems.map((item) => {
            const categories = Array.isArray(item.frontmatter.categories) ? item.frontmatter.categories : [];
            const tags = Array.isArray(item.frontmatter.tags) ? item.frontmatter.tags : [];
            const plainContent = plainifyContent(item.content || '');

            return {
              ...item,
              plainContent,
              titleSearch: normalizeSearchValue(item.frontmatter.title || '', config.lang),
              descriptionSearch: normalizeSearchValue(item.frontmatter.description || '', config.lang),
              categoriesSearch: normalizeSearchValue(categories.join(' '), config.lang),
              tagsSearch: normalizeSearchValue(tags.join(' '), config.lang),
              contentSearch: normalizeSearchValue(plainContent, config.lang),
            };
          });

          return state.preparedIndex;
        })
        .catch((error) => {
          state.indexPromise = null;
          throw error;
        });
    }

    return state.indexPromise;
  };

  const getResultItems = (): HTMLElement[] => {
    return Array.from(resultsElement.querySelectorAll<HTMLElement>('[data-search-result-item]'));
  };

  const updateActiveItem = () => {
    const resultItems = getResultItems();
    resultItems.forEach((item, index) => {
      item.classList.toggle('is-active', index === state.activeIndex);
      item.setAttribute('aria-selected', index === state.activeIndex ? 'true' : 'false');
    });

    const activeItem = resultItems[state.activeIndex];
    activeItem?.scrollIntoView({ block: 'nearest' });
  };

  const renderResults = (items: PreparedSearchItem[], query: string, elapsedSeconds: string) => {
    const resultCount = items.length;
    const activeCopy = state.activeCopy;
    statusElement.textContent =
      resultCount > 0
        ? `${formatResultSummary(resultCount, activeCopy)} ${activeCopy.inLabel} ${elapsedSeconds} ${activeCopy.seconds}`
        : activeCopy.noResults.replace('{query}', query);

    summaryCountElement.textContent = formatResultSummary(resultCount, activeCopy);
    summaryTimeElement.textContent = elapsedSeconds;
    summaryElement.hidden = false;

    if (resultCount === 0) {
      resultsElement.innerHTML = `
        <div class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-600">
          ${escapeHtml(activeCopy.noResults.replace('{query}', query))}
        </div>
      `;
      state.activeIndex = -1;
      return;
    }

    const groupedResults = items.reduce<Map<string, PreparedSearchItem[]>>((groups, item) => {
      const groupItems = groups.get(item.group) || [];
      groupItems.push(item);
      groups.set(item.group, groupItems);
      return groups;
    }, new Map());

    resultsElement.innerHTML = Array.from(groupedResults.entries())
      .map(([group, groupItems]) => {
        const groupTitle = activeCopy.groupLabels[group] || humanizeGroup(group);

        return `
          <section class="space-y-3">
            <div class="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
              ${escapeHtml(groupTitle)}
            </div>
            <div class="space-y-3">
              ${groupItems
                .map((item) => {
                  const categoriesMarkup =
                    item.frontmatter.categories && item.frontmatter.categories.length > 0
                      ? `
                        <div class="global-search__taxonomy">
                          <span class="global-search__taxonomy-label">${escapeHtml(activeCopy.categoriesLabel)}</span>
                          <span>${item.frontmatter.categories.map((value) => highlightText(value, query, config.lang)).join(', ')}</span>
                        </div>
                      `
                      : '';
                  const tagsMarkup =
                    item.frontmatter.tags && item.frontmatter.tags.length > 0
                      ? `
                        <div class="global-search__taxonomy">
                          <span class="global-search__taxonomy-label">${escapeHtml(activeCopy.tagsLabel)}</span>
                          <span>${item.frontmatter.tags.map((value) => highlightText(value, query, config.lang)).join(', ')}</span>
                        </div>
                      `
                      : '';
                  const excerpt = buildExcerpt(item, query, config.lang);

                  return `
                    <a
                      class="global-search__result-item"
                      data-search-result-item
                      href="${escapeHtml(item.href || localizePath(item.slug, config))}"
                    >
                      ${item.frontmatter.image ? `<img class="global-search__result-image" src="${escapeHtml(item.frontmatter.image)}" alt="" loading="lazy" decoding="async" />` : ''}
                      <div class="min-w-0 flex-1">
                        <div class="global-search__result-title text-lg font-semibold leading-snug text-gray-900">
                          ${highlightText(item.frontmatter.title, query, config.lang)}
                        </div>
                        ${
                          item.frontmatter.description
                            ? `<p class="global-search__muted mt-2 text-sm leading-6 text-gray-600">${highlightText(item.frontmatter.description, query, config.lang)}</p>`
                            : ''
                        }
                        ${
                          excerpt
                            ? `<p class="global-search__muted mt-3 text-sm leading-6 text-gray-700">${highlightText(excerpt, query, config.lang)}</p>`
                            : ''
                        }
                        ${
                          categoriesMarkup || tagsMarkup
                            ? `<div class="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">${categoriesMarkup}${tagsMarkup}</div>`
                            : ''
                        }
                      </div>
                    </a>
                  `;
                })
                .join('')}
            </div>
          </section>
        `;
      })
      .join('');

    state.activeIndex = -1;
    updateActiveItem();
  };

  const runSearch = async () => {
    const currentSearchId = ++state.activeSearchId;
    const query = input.value.trim();

    if (!query) {
      state.activeIndex = -1;
      renderPrompt();
      return;
    }

    statusElement.textContent = state.activeCopy.loading;
    resultsElement.innerHTML = `
      <div class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-600">
        ${escapeHtml(state.activeCopy.loading)}
      </div>
    `;
    summaryElement.hidden = true;

    try {
      const index = await getPreparedIndex();
      if (currentSearchId !== state.activeSearchId) return;

      const normalizedQuery = normalizeSearchValue(query, config.lang);
      const startTime = performance.now();
      const scopedIndex =
        state.activeScopeGroups && state.activeScopeGroups.length > 0
          ? index.filter((item) => state.activeScopeGroups?.includes(item.group))
          : index;
      const matches = scopedIndex.filter((item) => {
        return (
          item.titleSearch.includes(normalizedQuery) ||
          item.descriptionSearch.includes(normalizedQuery) ||
          item.categoriesSearch.includes(normalizedQuery) ||
          item.tagsSearch.includes(normalizedQuery) ||
          item.contentSearch.includes(normalizedQuery)
        );
      });
      const elapsedSeconds = ((performance.now() - startTime) / 1000).toFixed(3);

      renderResults(matches, query, elapsedSeconds);
    } catch (error) {
      if (currentSearchId !== state.activeSearchId) return;
      console.error(error);
      renderError();
    }
  };

  const applyTriggerContext = (trigger?: HTMLElement | null) => {
    state.activeScopeGroups = getTriggerScopeGroups(trigger);
    applyActiveCopy({
      ...config.copy,
      ...getTriggerCopyOverrides(trigger),
    });
  };

  const openSearch = (trigger?: HTMLElement | null) => {
    applyTriggerContext(trigger);

    if (state.isOpen) {
      if (trigger?.dataset.searchClearOnOpen === 'true') {
        input.value = '';
      }

      if (input.value.trim()) {
        void runSearch();
      } else {
        state.activeIndex = -1;
        renderPrompt();
      }
      input.focus();
      return;
    }

    state.isOpen = true;
    state.previousActiveElement =
      trigger || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    root.dataset.open = 'true';
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('global-search-open');

    if (trigger?.dataset.searchClearOnOpen === 'true') {
      input.value = '';
    }

    if (input.value.trim()) {
      void runSearch();
    } else {
      renderPrompt();
    }

    input.focus();
    input.select();
    void getPreparedIndex().catch((error) => {
      console.error(error);
    });
  };

  openGlobalSearchHandler = openSearch;

  const closeSearch = () => {
    if (!state.isOpen) return;

    state.isOpen = false;
    state.activeIndex = -1;
    root.dataset.open = 'false';
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('global-search-open');
    updateActiveItem();
    state.previousActiveElement?.focus();
  };

  const moveSelection = (direction: 1 | -1) => {
    const resultItems = getResultItems();
    if (resultItems.length === 0) return;

    if (state.activeIndex < 0) {
      state.activeIndex = direction === 1 ? 0 : resultItems.length - 1;
    } else {
      state.activeIndex = Math.min(Math.max(state.activeIndex + direction, 0), resultItems.length - 1);
    }

    updateActiveItem();
  };

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest<HTMLElement>('[data-search-trigger]');
      if (trigger) {
        event.preventDefault();
        openSearch(trigger);
        return;
      }

      if (!root.contains(target)) return;

      if (target.closest('[data-search-close]')) {
        event.preventDefault();
        closeSearch();
      }
    },
    { signal: controller.signal }
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch(document.activeElement instanceof HTMLElement ? document.activeElement : null);
        return;
      }

      if (!state.isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveSelection(1);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveSelection(-1);
        return;
      }

      if (event.key === 'Enter' && state.activeIndex >= 0) {
        const activeItem = getResultItems()[state.activeIndex] as HTMLAnchorElement | undefined;
        if (!activeItem) return;
        event.preventDefault();
        window.location.assign(activeItem.href);
      }
    },
    { signal: controller.signal }
  );

  input.addEventListener(
    'input',
    () => {
      void runSearch();
    },
    { signal: controller.signal }
  );
  renderPrompt();
};

export const openGlobalSearch = (trigger?: HTMLElement | null): void => {
  initGlobalSearch();
  openGlobalSearchHandler?.(trigger);
};
