export const bootstrapBlogSearch = (): void => {
  const root = document.querySelector<HTMLElement>('[data-blog-search-root]');
  const input = root?.querySelector<HTMLInputElement>('#blog-search-input');

  if (!root || !input) {
    return;
  }

  let initialized = false;
  let initializePromise: Promise<void> | null = null;
  let idleTimer: number | null = null;

  const initializeSearch = async (): Promise<void> => {
    if (initialized) return;

    if (!initializePromise) {
      initializePromise = import('./blog-search').then(({ initBlogSearch }) => {
        initBlogSearch(root);
        initialized = true;

        if (idleTimer !== null) {
          window.clearTimeout(idleTimer);
          idleTimer = null;
        }
      });
    }

    await initializePromise;
  };

  const triggerInitialization = (): void => {
    void initializeSearch();
  };

  input.addEventListener('focus', triggerInitialization, { once: true });
  input.addEventListener('input', triggerInitialization, { once: true });
  input.addEventListener('keydown', triggerInitialization, { once: true });
  input.addEventListener('pointerdown', triggerInitialization, { once: true });

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(
      () => {
        void initializeSearch();
      },
      { timeout: 3500 }
    );
  } else {
    idleTimer = window.setTimeout(() => {
      void initializeSearch();
    }, 3500);
  }
};
