export interface ApiErrorResponse {
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  code: string;
  statusCode: number;
  requestId?: string;
  details?: unknown;

  constructor(statusCode: number, errorData: ApiErrorResponse) {
    super(errorData.message || 'An API error occurred');
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = errorData.code || 'API_ERROR';
    this.requestId = errorData.requestId;
    this.details = errorData.details;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse = {
      code: `HTTP_${response.status}`,
      message: response.statusText,
    };

    try {
      const json = await response.json();
      if (json.error) {
        errorData = json.error;
      }
    } catch {
      // Body wasn't JSON
    }

    throw new ApiClientError(response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};

export const fetcher = <T>(url: string): Promise<T> => api.get<T>(url);
