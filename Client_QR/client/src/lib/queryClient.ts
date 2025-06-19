import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get session information for authenticated requests
  const getSessionHeaders = () => {
    const headers: Record<string, string> = {};

    // Add Content-Type for requests with data
    if (data) {
      headers["Content-Type"] = "application/json";
    }

    // Get session ID from global variable (set by useSession hook)
    const sessionId = (window as any).__currentSessionId;

    if (sessionId) {
      // Get table number from URL parameters as the primary source
      const params = new URLSearchParams(window.location.search);
      let tableNumber = params.get('table');

      // If table number is not in URL, extract it from the session ID as a fallback
      if (!tableNumber) {
        // Session format: session-TABLE-timestamp-random
        const parts = sessionId.split('-');
        if (parts.length >= 2 && parts[0] === 'session') {
          tableNumber = parts[1];
        }
      }

      // Add session headers for authenticated endpoints
      if (url.includes('/cart') || url.includes('/orders')) {
        headers["X-Session-ID"] = sessionId;
        if (tableNumber) {
          headers["X-Table-Number"] = tableNumber;
        }
      }
    }

    return headers;
  };

  const res = await fetch(url, {
    method,
    headers: getSessionHeaders(),
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
