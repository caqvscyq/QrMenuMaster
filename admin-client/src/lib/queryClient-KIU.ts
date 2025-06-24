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
  // Get table-specific session ID with validation
  const params = new URLSearchParams(window.location.search);
  const tableNumber = params.get('table') || 'unknown';

  // Validate table number format to prevent injection
  const validTableNumber = /^[A-Za-z0-9_-]+$/.test(tableNumber) ? tableNumber : 'unknown';

  const sessionKey = `cart-session-id-${validTableNumber}`;
  const sessionId = localStorage.getItem(sessionKey);

  const headers: Record<string, string> = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Only add session ID if it's valid and belongs to this table
  if (sessionId && sessionId.includes(`session-${validTableNumber}-`)) {
    headers["X-Session-ID"] = sessionId;
    headers["X-Table-Number"] = validTableNumber; // Add table number for server validation
  } else if (sessionId) {
    console.warn(`Invalid session ID for table ${validTableNumber}:`, sessionId);
    // Clear invalid session
    localStorage.removeItem(sessionKey);
  }

  const res = await fetch(url, {
    method,
    headers,
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
    // Get table-specific session ID with validation
    const params = new URLSearchParams(window.location.search);
    const tableNumber = params.get('table') || 'unknown';

    // Validate table number format to prevent injection
    const validTableNumber = /^[A-Za-z0-9_-]+$/.test(tableNumber) ? tableNumber : 'unknown';

    const sessionKey = `cart-session-id-${validTableNumber}`;
    const sessionId = localStorage.getItem(sessionKey);

    const headers: Record<string, string> = {};

    // Only add session ID if it's valid and belongs to this table
    if (sessionId && sessionId.includes(`session-${validTableNumber}-`)) {
      headers["X-Session-ID"] = sessionId;
      headers["X-Table-Number"] = validTableNumber; // Add table number for server validation
    } else if (sessionId) {
      console.warn(`Invalid session ID for table ${validTableNumber}:`, sessionId);
      // Clear invalid session
      localStorage.removeItem(sessionKey);
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
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
