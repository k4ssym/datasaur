/**
 * Next.js catch-all proxy → FastAPI backend.
 * Все запросы /api/backend/* пересылаются на BACKEND_URL/*.
 * Это избавляет от CORS при локальной разработке.
 */
import { type NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

async function proxy(request: NextRequest, path: string): Promise<NextResponse> {
  const targetUrl = `${BACKEND}/${path}`;
  const contentType = request.headers.get("content-type") ?? "";

  const init: RequestInit = {
    method: request.method,
    headers: { "Content-Type": contentType || "application/json" },
    // Forward body for POST/PUT/PATCH
    ...(["POST", "PUT", "PATCH"].includes(request.method)
      ? { body: await request.text() }
      : {}),
  };

  try {
    const upstream = await fetch(targetUrl, init);
    const body = await upstream.text();

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "X-Proxied-From": BACKEND,
      },
    });
  } catch (err) {
    console.error("[proxy] Error forwarding to backend:", err);
    return NextResponse.json(
      {
        error: "backend_unreachable",
        detail: `Не удалось подключиться к бэкенду (${BACKEND}). Убедитесь, что сервер запущен.`,
      },
      { status: 503 }
    );
  }
}

// Extract path from catch-all route
function extractPath(request: NextRequest): string {
  const url = request.nextUrl.pathname;
  // Remove /api/backend/ prefix
  return url.replace(/^\/api\/backend\/?/, "");
}

export async function GET(request: NextRequest)    { return proxy(request, extractPath(request)); }
export async function POST(request: NextRequest)   { return proxy(request, extractPath(request)); }
export async function PUT(request: NextRequest)    { return proxy(request, extractPath(request)); }
export async function DELETE(request: NextRequest) { return proxy(request, extractPath(request)); }
export async function PATCH(request: NextRequest)  { return proxy(request, extractPath(request)); }
