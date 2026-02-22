"use client";

import { BookOpen, Shield, Zap } from "lucide-react";

export function EmptyState() {
  const features = [
    {
      icon: BookOpen,
      title: "Клинические протоколы РК",
      desc: "База из официальных протоколов Министерства здравоохранения РК",
    },
    {
      icon: Shield,
      title: "RAG-поиск",
      desc: "Семантический поиск по векторной базе FAISS",
    },
    {
      icon: Zap,
      title: "LLM oss-120b",
      desc: "Языковая модель Qazcode для интерпретации симптомов",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center animate-fade-in">
      {/* Logo mark */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-800 to-primary-500 flex items-center justify-center shadow-soft">
          <svg
            viewBox="0 0 24 24"
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-3-3v6M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
            />
          </svg>
        </div>
        {/* Decorative rings */}
        <div className="absolute -inset-3 rounded-3xl border border-primary-100 opacity-60" />
        <div className="absolute -inset-6 rounded-3xl border border-primary-50 opacity-40" />
      </div>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Введите анамнез пациента
      </h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-10">
        Система проанализирует симптомы и подберёт наиболее вероятный диагноз на основе клинических протоколов РК.
      </p>

      {/* Feature cards */}
      <div className="w-full space-y-2.5">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-3 bg-white border border-slate-100 rounded-xl p-3.5 text-left shadow-card"
          >
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50">
              <Icon className="h-4 w-4 text-primary-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">{title}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
