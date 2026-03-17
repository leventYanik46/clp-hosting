interface SearchCopy {
  label: string;
  placeholder: string;
  helper: string;
  loading: string;
  error: string;
  clear: string;
  resultsLabelOne: string;
  resultsLabelMany: string;
  noResults: string;
}

interface BlogSearchItem {
  lang?: string;
  href?: string;
  title?: string;
  excerpt?: string;
  image?: string;
  publishDate?: string;
  category?: string;
  tags?: string[];
  searchText?: string;
  titleSearchText?: string;
}

const SEARCH_CHARACTER_REPLACEMENTS = [
  ['ı', 'i'],
  ['İ', 'i'],
  ['ş', 's'],
  ['Ş', 's'],
  ['ç', 'c'],
  ['Ç', 'c'],
  ['ğ', 'g'],
  ['Ğ', 'g'],
  ['ü', 'u'],
  ['Ü', 'u'],
  ['ö', 'o'],
  ['Ö', 'o'],
] as const;

const escapeHtml = (value = ''): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const escapeRegExp = (value = ''): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeForSearch = (value = ''): string => {
  const replacedValue = SEARCH_CHARACTER_REPLACEMENTS.reduce((normalizedValue, [source, target]) => {
    return normalizedValue.replaceAll(source, target);
  }, value);

  return replacedValue
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s/-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const highlightText = (value = '', query = '', lang = 'en'): string => {
  if (!value) return '';
  if (!query) return escapeHtml(value);

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');

  return value
    .split(regex)
    .map((part) =>
      part.toLocaleLowerCase(lang) === query.toLocaleLowerCase(lang) ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)
    )
    .join('');
};

const parseCopy = (rawValue: string | undefined): SearchCopy | null => {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as SearchCopy;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.error('Invalid blog search copy payload', error);
    return null;
  }
};

export const initBlogSearch = (root: HTMLElement): void => {
  if (root.dataset.initialized === 'true') {
    return;
  }

  const input = root.querySelector<HTMLInputElement>('#blog-search-input');
  const clearButton = root.querySelector<HTMLButtonElement>('#blog-search-clear');
  const status = root.querySelector<HTMLElement>('#blog-search-status');
  const searchResults = root.querySelector<HTMLElement>('#blog-search-results');
  const defaultList = document.getElementById('blog-default-list');
  const pagination = document.getElementById('blog-pagination');
  const copy = parseCopy(root.dataset.copy);
  const lang = root.dataset.lang || 'en';
  const dateLocale = root.dataset.dateLocale || 'en-US';
  const searchIndexUrl = root.dataset.searchIndexUrl;

  if (!input || !clearButton || !status || !searchResults || !defaultList || !pagination || !copy || !searchIndexUrl) {
    return;
  }

  root.dataset.initialized = 'true';

  const formatDate = (value: string | undefined): string => {
    const date = new Date(value ?? '');
    if (Number.isNaN(date.valueOf())) return '';

    return new Intl.DateTimeFormat(dateLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  };

  const formatResultLabel = (count: number): string => {
    if (count === 1) return copy.resultsLabelOne;
    return copy.resultsLabelMany.replace('{count}', String(count));
  };

  const renderDefaultState = (): void => {
    defaultList.hidden = false;
    pagination.hidden = false;
    searchResults.hidden = true;
    searchResults.innerHTML = '';
    status.textContent = copy.helper;
    clearButton.classList.add('hidden');
  };

  const renderEmptyState = (term: string): void => {
    searchResults.innerHTML = `
      <div class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p class="text-lg font-semibold text-gray-900">${escapeHtml(copy.noResults.replace('{term}', term))}</p>
      </div>
    `;
  };

  const renderSearchResults = (items: BlogSearchItem[], term: string): void => {
    if (!term) {
      renderDefaultState();
      return;
    }

    defaultList.hidden = true;
    pagination.hidden = true;
    searchResults.hidden = false;
    clearButton.classList.remove('hidden');

    if (items.length === 0) {
      status.textContent = formatResultLabel(0);
      renderEmptyState(term);
      return;
    }

    status.textContent = formatResultLabel(items.length);

    searchResults.innerHTML = `
      <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
        <p class="text-sm font-semibold text-gray-900">${escapeHtml(formatResultLabel(items.length))}</p>
      </div>
      <div class="mt-6 space-y-4">
        ${items
          .map((item) => {
            const metaParts = [formatDate(item.publishDate), item.category].filter(Boolean).join(' - ');
            const tagsMarkup =
              Array.isArray(item.tags) && item.tags.length > 0
                ? `
                  <div class="mt-4 flex flex-wrap gap-2">
                    ${item.tags
                      .map(
                        (tag) => `
                          <span class="global-search__taxonomy">
                            ${highlightText(tag, term, lang)}
                          </span>
                        `
                      )
                      .join('')}
                  </div>
                `
                : '';

            return `
              <article>
                <a class="global-search__result-item" href="${escapeHtml(item.href ?? '')}">
                  ${item.image ? `<img class="global-search__result-image" src="${escapeHtml(item.image)}" alt="" loading="lazy" decoding="async" />` : ''}
                  <div class="min-w-0 flex-1">
                    ${metaParts ? `<p class="global-search__muted text-sm text-gray-500">${escapeHtml(metaParts)}</p>` : ''}
                    <h2 class="global-search__result-title mt-2 text-xl font-semibold leading-tight text-gray-900">
                      ${highlightText(item.title ?? '', term, lang)}
                    </h2>
                    ${
                      item.excerpt
                        ? `<p class="global-search__muted mt-3 text-base leading-7 text-gray-600">${highlightText(item.excerpt ?? '', term, lang)}</p>`
                        : ''
                    }
                    ${tagsMarkup}
                  </div>
                </a>
              </article>
            `;
          })
          .join('')}
      </div>
    `;
  };

  let searchIndex: BlogSearchItem[] | null = null;
  let searchIndexPromise: Promise<BlogSearchItem[]> | null = null;
  let activeSearchId = 0;

  const loadSearchIndex = async (): Promise<BlogSearchItem[]> => {
    if (searchIndex) return searchIndex;
    if (!searchIndexPromise) {
      searchIndexPromise = fetch(searchIndexUrl, {
        headers: {
          Accept: 'application/json',
        },
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load search index: ${response.status}`);
        }

        const data = (await response.json()) as BlogSearchItem[];
        searchIndex = Array.isArray(data) ? data : [];
        return searchIndex;
      });
    }

    return searchIndexPromise;
  };

  const runSearch = async (rawTerm: string): Promise<void> => {
    const currentSearchId = ++activeSearchId;
    const trimmedTerm = rawTerm.trim();
    const normalizedTokens = normalizeForSearch(trimmedTerm)
      .split(' ')
      .map((token) => token.trim())
      .filter(Boolean);

    if (normalizedTokens.length === 0) {
      renderDefaultState();
      return;
    }

    defaultList.hidden = true;
    pagination.hidden = true;
    searchResults.hidden = false;
    clearButton.classList.remove('hidden');
    status.textContent = copy.loading;
    searchResults.innerHTML = `
      <div class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
        ${escapeHtml(copy.loading)}
      </div>
    `;

    try {
      const data = await loadSearchIndex();

      if (currentSearchId !== activeSearchId) {
        return;
      }

      const matches = data.filter((item) => {
        if (item.lang !== lang) return false;
        const searchableText =
          typeof item.searchText === 'string' && item.searchText.length > 0 ? item.searchText : item.titleSearchText;

        if (typeof searchableText !== 'string') return false;

        return normalizedTokens.every((token) => searchableText.includes(token));
      });

      renderSearchResults(matches, trimmedTerm);
    } catch (error) {
      if (currentSearchId !== activeSearchId) {
        return;
      }

      console.error(error);
      status.textContent = copy.error;
      searchResults.hidden = false;
      defaultList.hidden = true;
      pagination.hidden = true;
      clearButton.classList.remove('hidden');
      searchResults.innerHTML = `
        <div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          ${escapeHtml(copy.error)}
        </div>
      `;
    }
  };

  input.addEventListener('input', (event) => {
    if (!(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }

    void runSearch(event.currentTarget.value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    input.value = '';
    renderDefaultState();
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    renderDefaultState();
    input.focus();
  });

  renderDefaultState();

  if (input.value.trim()) {
    void runSearch(input.value);
  }
};
