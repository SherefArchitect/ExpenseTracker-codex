import {
  CategoryApiError,
  type Category,
  type CategoryNames,
  type StatusFilter,
} from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/categories' + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError')
      throw cause;
    throw new CategoryApiError('network.error');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code =
      response.status === 404 && path.startsWith('?')
        ? 'category.unavailable'
        : typeof body?.code === 'string'
          ? body.code
          : 'server.error';
    throw new CategoryApiError(code, body?.errors ?? {});
  }
  if (body === null) throw new CategoryApiError('server.error');
  return body as T;
}
export const categoryApi = {
  list(search: string, status: StatusFilter, signal?: AbortSignal) {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (status !== 'all') query.set('isActive', String(status === 'active'));
    return request<Category[]>('?' + query.toString(), { signal });
  },
  create: (names: CategoryNames) =>
    request<Category>('', { method: 'POST', body: JSON.stringify(names) }),
  rename: (id: number, names: CategoryNames) =>
    request<Category>('/' + id, { method: 'PUT', body: JSON.stringify(names) }),
  setActive: (id: number, isActive: boolean) =>
    request<Category>('/' + id + '/status', {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
};
