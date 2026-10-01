import { useCallback, useEffect, useRef, useState } from 'react';
import { categoryApi } from './api';
import {
  CategoryApiError,
  type Category,
  type CategoryNames,
  type StatusFilter,
} from './types';
import { trimName } from './validation';

export function useCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const sequence = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const mutationLock = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(trimName(search)), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const reload = useCallback(async () => {
    const version = ++sequence.current;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError('');
    try {
      const next = await categoryApi.list(
        debouncedSearch,
        status,
        controller.signal,
      );
      if (sequence.current !== version) return true;
      setItems(next);
      setRefreshFailed(false);
      return true;
    } catch (cause) {
      if (sequence.current !== version || controller.signal.aborted)
        return true;
      setError(cause instanceof CategoryApiError ? cause.code : 'server.error');
      return false;
    } finally {
      if (sequence.current === version) setLoading(false);
    }
  }, [debouncedSearch, status]);
  // Mutations refresh whichever filter is current when the write completes.
  const latestReload = useRef(reload);
  useEffect(() => {
    latestReload.current = reload;
  }, [reload]);
  useEffect(() => {
    void reload();
    return () => {
      ++sequence.current;
      activeRequest.current?.abort();
    };
  }, [reload]);

  async function mutate(operation: () => Promise<Category>, success: string) {
    if (mutationLock.current) throw new CategoryApiError('request.invalid');
    mutationLock.current = true;
    setSaving(true);
    setNotice('');
    setRefreshFailed(false);
    try {
      await operation(); // A write error propagates to the form; keep entered values.
      setNotice(success);
      const refreshed = await latestReload.current();
      if (!refreshed) setRefreshFailed(true);
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  return {
    items,
    search,
    setSearch,
    status,
    setStatus,
    loading,
    error,
    notice,
    refreshFailed,
    saving,
    reload,
    save: (names: CategoryNames, id?: number) =>
      mutate(
        () =>
          id === undefined
            ? categoryApi.create(names)
            : categoryApi.rename(id, names),
        'categories.saved',
      ),
    setActive: (item: Category) =>
      mutate(
        () => categoryApi.setActive(item.id, !item.isActive),
        'categories.statusSaved',
      ),
    hasFilters: Boolean(trimName(search)) || status !== 'all',
  };
}
