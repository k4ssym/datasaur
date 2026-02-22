"use client";

import { useRef, useCallback } from "react";
import { Upload, Stethoscope, Sparkles, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AnamnesisFormProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const PLACEHOLDER = `Пример: Пациент 52 лет обратился с жалобами на кашель с гнойной мокротой в течение 5 дней, повышение температуры до 38.8°C, одышку при физической нагрузке, общую слабость. Из анамнеза: переохлаждение неделю назад. Ранее болел острым бронхитом.`;

const CHAR_LIMIT = 10_000;
const CHAR_WARN = 8_000;

export function AnamnesisForm({
  value,
  onChange,
  onSubmit,
  isLoading,
}: AnamnesisFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        onChange(text.slice(0, CHAR_LIMIT));
      };
      reader.readAsText(file, "utf-8");
      // Reset input so same file can be re-uploaded
      e.target.value = "";
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file || !file.name.match(/\.(txt|md|text)$/i)) return;
      const reader = new FileReader();
      reader.onload = (ev) => onChange((ev.target?.result as string).slice(0, CHAR_LIMIT));
      reader.readAsText(file, "utf-8");
    },
    [onChange]
  );

  const canSubmit = value.trim().length >= 10 && !isLoading;
  const charCount = value.length;
  const isWarn = charCount >= CHAR_WARN;

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-800">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Анамнез пациента</h2>
        </div>
        <p className="text-xs text-slate-500 ml-10 pl-0.5">
          Введите жалобы, историю болезни и клинические данные
        </p>
      </div>

      {/* Textarea */}
      <div
        className="flex-1 flex flex-col gap-1.5"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, CHAR_LIMIT))}
          placeholder={PLACEHOLDER}
          className="flex-1 min-h-[240px] text-[13.5px] leading-relaxed"
          disabled={isLoading}
          spellCheck={false}
        />

        {/* Char counter + clear */}
        <div className="flex items-center justify-between px-0.5">
          <span
            className={cn(
              "text-xs tabular-nums transition-colors",
              isWarn ? "text-amber-500" : "text-slate-400"
            )}
          >
            {charCount.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
          </span>
          {value && (
            <button
              onClick={() => onChange("")}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
              type="button"
            >
              <X className="h-3 w-3" /> Очистить
            </button>
          )}
        </div>
      </div>

      {/* Upload button */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.text"
          onChange={handleFile}
          className="hidden"
          aria-label="Загрузить текстовый файл"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isLoading}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300",
            "py-2.5 px-4 text-sm text-slate-500",
            "hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50",
            "transition-all duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <FileText className="h-4 w-4" />
          Загрузить .txt файл
          <span className="text-slate-400 text-xs">(или перетащите сюда)</span>
        </button>
      </div>

      {/* Submit */}
      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        size="lg"
        className="w-full h-12 text-sm font-semibold tracking-wide gap-2.5 shadow-soft"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Анализирую...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Анализировать
          </>
        )}
      </Button>

      {/* Disclaimer */}
      <p className="text-[11px] text-slate-400 text-center leading-relaxed -mt-2">
        Система использует клинические протоколы МЗ РК.
        <br />
        Не заменяет консультацию врача.
      </p>
    </div>
  );
}
