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
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // TODO: Add authentication token/session handling
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // For cookie-based auth
  });

  return handleResponse<T>(response);
}

// API Methods
export const api = {
  // Health
  health: () => fetchWithAuth<{ status: string }>("/api/health"),

  // User
  getMe: () => fetchWithAuth<{
    id: string;
    email: string;
    google_user_id: string;
    created_at: string;
    updated_at: string;
  }>("/api/me"),

  // Goals
  getGoals: () =>
    fetchWithAuth<
      Array<{
        id: string;
        title: string;
        year: number;
        description: string | null;
        created_at: string;
        updated_at: string;
      }>
    >("/api/goals"),

  createGoal: (data: {
    title: string;
    year: number;
    description?: string | null;
  }) =>
    fetchWithAuth<{ id: string }>("/api/goals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateGoal: (goalId: string, data: {
    title: string;
    year: number;
    description?: string | null;
  }) =>
    fetchWithAuth<{ ok: boolean }>(`/api/goals/${goalId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteGoal: (goalId: string) =>
    fetchWithAuth<{ ok: boolean }>(`/api/goals/${goalId}`, {
      method: "DELETE",
    }),

  // Habits
  getHabits: () =>
    fetchWithAuth<
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
          effective_week_start: string;
          created_at: string;
          updated_at: string;
        }>;
      }>
    >("/api/habits"),

  createHabit: (data: {
    name: string;
    weekly_target: number;
    requires_text_on_completion: boolean;
    linked_goal_id?: string | null;
    order_index?: number;
    client_timezone?: string | null;
    client_tz_offset_minutes?: number | null;
  }) =>
    fetchWithAuth<{ id: string }>("/api/habits", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateHabit: (habitId: string, data: {
    name: string;
    weekly_target: number;
    requires_text_on_completion: boolean;
    linked_goal_id?: string | null;
    order_index?: number;
    client_timezone?: string | null;
    client_tz_offset_minutes?: number | null;
  }) =>
    fetchWithAuth<{ ok: boolean }>(`/api/habits/${habitId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteHabit: (habitId: string) =>
    fetchWithAuth<{ ok: boolean }>(`/api/habits/${habitId}`, {
      method: "DELETE",
    }),

  // Completions
  getCompletions: (start: string, end: string) =>
    fetchWithAuth<
      Array<{
        id: string;
        habit_id: string;
        date: string;
        text: string | null;
        created_at: string;
        updated_at: string;
      }>
    >(`/api/completions?start=${start}&end=${end}`),

  createCompletion: (data: {
    habit_id: string;
    date: string;
    text?: string | null;
    client_timezone?: string | null;
    client_tz_offset_minutes?: number | null;
  }) =>
    fetchWithAuth<{ id: string }>("/api/completions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteCompletion: (
    completionId: string,
    client_timezone?: string | null,
    client_tz_offset_minutes?: number | null
  ) =>
    fetchWithAuth<{ ok: boolean }>(
      `/api/completions/${completionId}?${new URLSearchParams({
        ...(client_timezone && { client_timezone }),
        ...(client_tz_offset_minutes !== undefined && {
          client_tz_offset_minutes: String(client_tz_offset_minutes),
        }),
      }).toString()}`,
      {
        method: "DELETE",
      }
    ),
};
