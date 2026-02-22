"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Stethoscope, Github, AlertTriangle } from "lucide-react";
import { AnamnesisForm } from "@/components/AnamnesisForm";
import { ResultsCard } from "@/components/ResultsCard";
import { SkeletonResult } from "@/components/SkeletonResult";
import { EmptyState } from "@/components/EmptyState";
import { predict, checkHealth, ApiError } from "@/lib/api";
import type { AppState } from "@/types";
import { cn } from "@/lib/utils";

/* ── Header ──────────────────────────────────────────────────────────── */
function Header({ backendOnline }: { backendOnline: boolean | null }) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-screen-xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-800">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-slate-900 tracking-tight">КлинДиагноз</span>
            <span className="text-[10px] font-medium text-primary-600 bg-primary-50 border border-primary-100 rounded-full px-2 py-0.5">
              v2.0 · RAG
            </span>
          </div>
        </div>

        {/* Right: status + links */}
        <div className="flex items-center gap-4">
          {/* Backend status */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                backendOnline === null
                  ? "bg-slate-300 animate-pulse"
                  : backendOnline
                  ? "bg-emerald-400"
                  : "bg-red-400"
              )}
            />
            <span className="text-slate-500">
              {backendOnline === null
                ? "Подключение..."
                : backendOnline
                ? "Сервер активен"
                : "Сервер недоступен"}
            </span>
          </div>

          <div className="w-px h-4 bg-slate-200" />

          <a
            href="https://github.com/dair-mus/qazcode-nu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

/* ── Error banner ─────────────────────────────────────────────────────── */
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-fade-in">
      <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700 flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="text-red-300 hover:text-red-500 transition-colors text-xs ml-2"
      >
        ✕
      </button>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function Home() {
  const [anamnesis, setAnamnesis] = useState("");
  const [state, setState] = useState<AppState>({ status: "idle" });
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Health check on mount
  useEffect(() => {
    checkHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!anamnesis.trim() || state.status === "loading") return;

    setState({ status: "loading" });

    try {
      const data = await predict({ anamnesis: anamnesis.trim(), top_k: 4 });
      setState({ status: "success", data });
      setBackendOnline(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Произошла непредвиденная ошибка. Попробуйте ещё раз.";
      setState({ status: "error", message });
      if (err instanceof ApiError && err.status && err.status >= 500) {
        setBackendOnline(false);
      }
    }
  }, [anamnesis, state.status]);

  // Ctrl+Enter shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header backendOnline={backendOnline} />

      {/* Subtle background pattern */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #1E40AF 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {/* Page title (mobile) */}
        <div className="mb-6 sm:hidden">
          <h1 className="text-lg font-bold text-slate-900">Анализ анамнеза</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Протоколы МЗ РК · Ctrl+Enter для анализа
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 lg:gap-8 items-start">

          {/* ── LEFT PANEL ── */}
          <div className="lg:sticky lg:top-[calc(3.5rem+1.5rem)]">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-6 lg:p-7">
              {/* Title (desktop) */}
              <div className="hidden lg:block mb-6">
                <h1 className="text-lg font-bold text-slate-900">Анализ анамнеза</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Введите описание или загрузите файл · Ctrl+Enter
                </p>
              </div>

              {/* Error banner (left side) */}
              {state.status === "error" && (
                <div className="mb-5">
                  <ErrorBanner
                    message={state.message}
                    onDismiss={() => setState({ status: "idle" })}
                  />
                </div>
              )}

              <AnamnesisForm
                value={anamnesis}
                onChange={setAnamnesis}
                onSubmit={handleSubmit}
                isLoading={state.status === "loading"}
              />
            </div>

            {/* Stats bar (desktop only) */}
            <div className="hidden lg:grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Протоколов", value: "1 000+" },
                { label: "Модель", value: "oss-120b" },
                { label: "Индекс", value: "FAISS" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 text-center shadow-card"
                >
                  <p className="text-[11px] text-slate-400">{label}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="min-h-[480px]">
            {state.status === "idle" && <EmptyState />}
            {state.status === "loading" && <SkeletonResult />}
            {state.status === "success" && <ResultsCard data={state.data} />}
            {state.status === "error" && (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-6 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <p className="text-base font-semibold text-slate-800 mb-1">Не удалось получить диагноз</p>
                <p className="text-sm text-slate-500 max-w-xs">
                  {state.message}
                </p>
                <button
                  onClick={() => setState({ status: "idle" })}
                  className="mt-5 text-sm text-primary-700 hover:text-primary-800 font-medium underline-offset-2 hover:underline transition-all"
                >
                  Попробовать снова
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-4 mt-auto">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>КлинДиагноз — HackNU 2026 · QazCode Challenge</span>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-primary-400" />
            <span>Протоколы МЗ РК · FAISS · oss-120b</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
