import type { PredictRequest, PredictResponse } from "@/types";

// Dev:    NEXT_PUBLIC_API_BASE is unset → "/api/backend" (Next.js proxy route)
// Docker: NEXT_PUBLIC_API_BASE=""        → "" (frontend calls FastAPI directly on same origin)
const BACKEND = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public detail?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function predict(request: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${BACKEND}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err.detail ?? err.error ?? JSON.stringify(err);
    } catch {
      detail = await res.text();
    }
    throw new ApiError(
      res.status === 503
        ? "Сервис временно недоступен. Проверьте, запущен ли бэкенд."
        : res.status === 422
        ? "Некорректный запрос. Проверьте текст анамнеза."
        : `Ошибка сервера (${res.status})`,
      res.status,
      detail
    );
  }

  return res.json() as Promise<PredictResponse>;
}

export async function checkHealth(): Promise<{
  status: string;
  rag: { loaded: boolean; total_vectors: number };
}> {
  const res = await fetch(`${BACKEND}/health`);
  if (!res.ok) throw new ApiError("Backend unavailable", res.status);
  return res.json();
}
