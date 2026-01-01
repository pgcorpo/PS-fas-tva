const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface APIError {
  errorCode: string;
  message: string;
}

export class APIErrorResponse extends Error {
  constructor(
    public errorCode: string,
    public message: string,
    public status: number
  ) {
    super(message);
    this.name = "APIErrorResponse";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: APIError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        errorCode: "INTERNAL_ERROR",
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    throw new APIErrorResponse(
      errorData.errorCode || "INTERNAL_ERROR",
      errorData.message || "An error occurred",
      response.status
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Add Bearer token if provided
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  return handleResponse<T>(response);
}

// Token cache at module level
let cachedToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

/**
 * Get the JWT token from the token endpoint with caching
 */
async function getToken(): Promise<string | null> {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  // Deduplicate concurrent requests
  if (tokenPromise) {
    return tokenPromise;
  }

  // Fetch token
  tokenPromise = (async () => {
    try {
      const response = await fetch("/api/token");
      if (response.ok) {
        const data = await response.json();
        cachedToken = data.token;
        return cachedToken;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch token:", error);
      return null;
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
}

/**
 * Clear the token cache (call on logout or 401 errors)
 */
export function clearTokenCache() {
  cachedToken = null;
}

// API Methods
export const api = {
  // Health
  health: () => fetchWithAuth<{ status: string }>("/api/health"),

  // User
  getMe: async () => {
    const token = await getToken();
    return fetchWithAuth<{
      id: string;
      email: string;
      google_user_id: string;
      created_at: string;
      updated_at: string;
    }>("/api/me", {}, token ?? undefined);
  },

  // Goals
  getGoals: async () => {
    const token = await getToken();
    return fetchWithAuth<
      Array<{
        id: string;
        title: string;
        year: number;
        description: string | null;
        is_deleted: boolean;
        created_at: string;
        updated_at: string;
      }>
    >("/api/goals", {}, token ?? undefined);
  },

  createGoal: async (data: {
    title: string;
    year: number;
    description?: string | null;
  }) => {
    const token = await getToken();
    return fetchWithAuth<{ id: string }>(
      "/api/goals",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token ?? undefined
    );
  },

  updateGoal: async (
    goalId: string,
    data: {
      title: string;
      year: number;
      description?: string | null;
    }
  ) => {
    const token = await getToken();
    return fetchWithAuth<{ ok: boolean }>(
      `/api/goals/${goalId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token ?? undefined
    );
  },

  deleteGoal: async (goalId: string) => {
    const token = await getToken();
    return fetchWithAuth<{ ok: boolean }>(
      `/api/goals/${goalId}`,
      {
        method: "DELETE",
      },
      token ?? undefined
    );
  },

  // Habits
  getHabits: async () => {
    const token = await getToken();
    return fetchWithAuth<
      Array<{
        id: string;
        name: string;
        order_index: number;
        linked_goal_id: string | null;
        is_deleted: boolean;
        created_at: string;
        updated_at: string;
        versions: Array<{
          id: string;
          weekly_target: number;
          requires_text_on_completion: boolean;
          linked_goal_id: string | null;
          description: string | null;
          effective_week_start: string;
          created_at: string;
          updated_at: string;
        }>;
      }>
    >("/api/habits", {}, token ?? undefined);
  },

  createHabit: async (data: {
    name: string;
    weekly_target: number;
    requires_text_on_completion: boolean;
    linked_goal_id?: string | null;
    description?: string | null;
    order_index?: number;
    client_timezone?: string | null;
    client_tz_offset_minutes?: number | null;
  }) => {
    const token = await getToken();
    return fetchWithAuth<{ id: string }>(
      "/api/habits",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token ?? undefined
    );
  },

  updateHabit: async (
    habitId: string,
    data: {
      name: string;
      weekly_target: number;
      requires_text_on_completion: boolean;
      linked_goal_id?: string | null;
      description?: string | null;
      order_index?: number;
      client_timezone?: string | null;
      client_tz_offset_minutes?: number | null;
    }
  ) => {
    const token = await getToken();
    return fetchWithAuth<{ ok: boolean }>(
      `/api/habits/${habitId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token ?? undefined
    );
  },

  deleteHabit: async (habitId: string) => {
    const token = await getToken();
    return fetchWithAuth<{ ok: boolean }>(
      `/api/habits/${habitId}`,
      {
        method: "DELETE",
      },
      token ?? undefined
    );
  },

  // Completions
  getCompletions: async (start: string, end: string) => {
    const token = await getToken();
    return fetchWithAuth<
      Array<{
        id: string;
        habit_id: string;
        date: string;
        text: string | null;
        created_at: string;
        updated_at: string;
      }>
    >(`/api/completions?start=${start}&end=${end}`, {}, token ?? undefined);
  },

  getHabitCompletions: async (
    habitId: string,
    limit: number = 20,
    offset: number = 0
  ) => {
    const token = await getToken();
    return fetchWithAuth<
      Array<{
        id: string;
        habit_id: string;
        user_id: string;
        date: string;
        text: string | null;
        created_at: string;
        updated_at: string;
      }>
    >(
      `/api/habits/${habitId}/completions?limit=${limit}&offset=${offset}`,
      {},
      token ?? undefined
    );
  },

  createCompletion: async (data: {
    habit_id: string;
    date: string;
    text?: string | null;
    client_timezone?: string | null;
    client_tz_offset_minutes?: number | null;
  }) => {
    const token = await getToken();
    return fetchWithAuth<{ id: string }>(
      "/api/completions",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token ?? undefined
    );
  },

  deleteCompletion: async (
    completionId: string,
    client_timezone?: string | null,
    client_tz_offset_minutes?: number | null
  ) => {
    const token = await getToken();
    return fetchWithAuth<{ ok: boolean }>(
      `/api/completions/${completionId}?${new URLSearchParams({
        ...(client_timezone && { client_timezone }),
        ...(client_tz_offset_minutes !== undefined && {
          client_tz_offset_minutes: String(client_tz_offset_minutes),
        }),
      }).toString()}`,
      {
        method: "DELETE",
      },
      token ?? undefined
    );
  },
};
