"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  FileText, ExternalLink, Clock, ChevronRight,
  AlertCircle, CheckCircle2, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PredictResponse, ProtocolRef } from "@/types";

interface ResultsCardProps {
  data: PredictResponse;
}

/* ── helpers ─────────────────────────────────────────────────────────── */

function extractDiagnosisTitle(text: string): string {
  // Try to extract "Диагноз: ..." or "1. **Диагноз**: ..."
  const patterns = [
    /\*\*Диагноз\*\*[:\s]+([^\n]+)/i,
    /^1\.\s+\*?\*?Диагноз\*?\*?\s*[:\-]\s*(.+)$/im,
    /Диагноз[:\s]+([^\n]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].replace(/\*\*/g, "").trim();
  }
  // Fallback: first meaningful line
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines[0]?.replace(/^[\d.]+\s*\*?\*?/, "").replace(/\*\*/g, "").trim() ?? "Диагноз";
}

function extractIcdCode(text: string): string | null {
  const m = text.match(/МКБ[-–]10[:\s]+([A-Z]\d{2}(?:\.\d{1,2})?)/i);
  return m?.[1] ?? null;
}

function severityColor(severity: string | null) {
  if (!severity) return "secondary";
  const s = severity.toLowerCase();
  if (s.includes("тяж") || s.includes("severe")) return "warning";
  if (s.includes("сред") || s.includes("moderate")) return "default";
  return "success";
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}с` : `${ms}мс`;
}

function ProtocolCard({ protocol, rank }: { protocol: ProtocolRef; rank: number }) {
  const primaryIcd = protocol.icd_codes[0] ?? null;
  const relevancePct = Math.round(protocol.relevance_score * 100);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-primary-100 hover:bg-primary-50/40 transition-all duration-150 group">
      {/* Rank */}
      <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors">
        {rank}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate leading-snug">
          {protocol.title || protocol.source}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {primaryIcd && (
            <Badge variant="icd" className="text-[10px] px-1.5 py-0">
              {primaryIcd}
            </Badge>
          )}
          <span className="text-[11px] text-slate-400 truncate">{protocol.source}</span>
        </div>
      </div>

      {/* Relevance */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
        <span className="text-[11px] font-medium text-slate-500">{relevancePct}%</span>
        {/* Progress bar */}
        <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-400 transition-all"
            style={{ width: `${relevancePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────── */

export function ResultsCard({ data }: ResultsCardProps) {
  const { diagnosis, extracted_symptoms, protocols_used, timing } = data;

  const diagnosisTitle = useMemo(() => extractDiagnosisTitle(diagnosis), [diagnosis]);
  const icdCode = useMemo(() => extractIcdCode(diagnosis), [diagnosis]);

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Success banner */}
      <div className="flex items-center gap-2.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2.5">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">Анализ завершён</span>
        <span className="text-emerald-500 ml-auto text-xs flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatMs(timing.total_ms)}
        </span>
      </div>

      {/* Main diagnosis card */}
      <Card className="overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary-700 via-primary-500 to-primary-400" />

        <CardHeader className="pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Предварительный диагноз
          </p>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">
            {diagnosisTitle}
          </h2>

          {/* ICD + severity badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {icdCode && (
              <Badge variant="icd" className="text-xs px-2.5 py-1 font-mono font-semibold">
                МКБ-10: {icdCode}
              </Badge>
            )}
            {extracted_symptoms.severity && (
              <Badge variant={severityColor(extracted_symptoms.severity)} className="text-xs">
                {extracted_symptoms.severity} тяжесть
              </Badge>
            )}
            {extracted_symptoms.duration && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Clock className="h-2.5 w-2.5" />
                {extracted_symptoms.duration}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Patient info */}
          {extracted_symptoms.patient_info && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              <span className="font-medium text-slate-600">Пациент: </span>
              {extracted_symptoms.patient_info}
            </p>
          )}

          {/* Divider */}
          <div className="h-px bg-slate-100" />

          {/* Symptoms */}
          {extracted_symptoms.symptoms.length > 0 && (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Выявленные симптомы
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {extracted_symptoms.symptoms.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-primary-50 border border-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 hover:bg-primary-100 transition-colors cursor-default"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Divider */}
          <div className="h-px bg-slate-100" />

          {/* Full LLM diagnosis */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Клиническое обоснование
            </h3>
            <div className="prose-medical text-sm">
              <ReactMarkdown>{diagnosis}</ReactMarkdown>
            </div>
          </section>

          {/* Protocols */}
          {protocols_used.length > 0 && (
            <>
              <div className="h-px bg-slate-100" />
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Протоколы РК
                  </h3>
                  <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    по релевантности
                  </span>
                </div>
                <div className="space-y-2">
                  {protocols_used.map((p, i) => (
                    <ProtocolCard key={i} protocol={p} rank={i + 1} />
                  ))}
                </div>
              </section>
            </>
          )}
        </CardContent>
      </Card>

      {/* Timing details */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Симптомы", ms: timing.symptom_extraction_ms },
          { label: "Протоколы", ms: timing.rag_search_ms },
          { label: "Диагноз", ms: timing.diagnosis_ms },
        ].map(({ label, ms }) => (
          <div
            key={label}
            className="bg-white border border-slate-100 rounded-lg px-3 py-2 text-center shadow-card"
          >
            <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
            <p className="text-xs font-semibold text-slate-700 tabular-nums">{formatMs(ms)}</p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-slate-400 bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-2.5">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
        <span>
          Информация носит справочный характер и не заменяет клиническое суждение врача.
          Основано на клинических протоколах МЗ РК.
        </span>
      </div>
    </div>
  );
}
