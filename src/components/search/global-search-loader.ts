export const bootstrapGlobalSearch = (): void => {
  let loadPromise:
    | Promise<typeof import('./global-search')>
    | null = null;

  const cleanupBootstrapListeners = (): void => {
    document.removeEventListener('click', handleBootstrapClick);
    document.removeEventListener('keydown', handleBootstrapKeydown);
  };

  const loadGlobalSearch = async () => {
    const searchModule = await (loadPromise ??= import('./global-search'));
    cleanupBootstrapListeners();
    searchModule.initGlobalSearch();
    return searchModule;
  };

  const openGlobalSearch = async (trigger?: HTMLElement | null): Promise<void> => {
    const searchModule = await loadGlobalSearch();
    searchModule.openGlobalSearch(trigger);
  };

  const handleBootstrapClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = target.closest<HTMLElement>('[data-search-trigger]');
    if (!trigger) return;

    event.preventDefault();
    void openGlobalSearch(trigger);
  };

  const handleBootstrapKeydown = (event: KeyboardEvent): void => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      void openGlobalSearch(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    }
  };

  document.addEventListener('click', handleBootstrapClick);
  document.addEventListener('keydown', handleBootstrapKeydown);
};
