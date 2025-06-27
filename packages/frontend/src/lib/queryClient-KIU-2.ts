import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to get session headers
function getSessionHeaders(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const tableNumber = params.get('table') || 'unknown';

  // Get session ID from the current session context
  // This will be set by the useSession hook
  const sessionId = (window as any).__currentSessionId;

  const headers: Record<string, string> = {};

  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }

  if (tableNumber && tableNumber !== 'unknown') {
    headers['x-table-number'] = tableNumber;
  }

  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseHeaders = data ? { "Content-Type": "application/json" } : {};
  const sessionHeaders = getSessionHeaders();

  const res = await fetch(url, {
    method,
    headers: { ...baseHeaders, ...sessionHeaders },
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
    const sessionHeaders = getSessionHeaders();

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: sessionHeaders,
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
