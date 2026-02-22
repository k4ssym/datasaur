"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function SkeletonResult() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Status bar */}
      <div className="flex items-center gap-2.5 text-sm text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-4 py-2.5">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600" />
        </div>
        <Activity className="h-3.5 w-3.5" />
        <span className="font-medium">Анализирую анамнез...</span>
      </div>

      {/* Diagnosis card skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-3.5 w-36 mb-3" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2 mt-1" />
        </CardHeader>
        <CardContent className="space-y-5">
          {/* MKB badge row */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="h-px bg-slate-100" />

          {/* Symptoms section */}
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <div className="flex flex-wrap gap-2">
              {[80, 110, 70, 95, 60].map((w, i) => (
                <Skeleton key={i} className="h-6 rounded-full" style={{ width: w }} />
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Protocols section */}
          <div className="space-y-2.5">
            <Skeleton className="h-3 w-36" />
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100">
                <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-3 w-14 flex-shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Steps progress */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Симптомы", done: true },
          { label: "Протоколы", done: true },
          { label: "Диагноз", done: false },
        ].map(({ label, done }) => (
          <div
            key={label}
            className={`rounded-lg px-3 py-2 text-center text-xs font-medium border transition-colors ${
              done
                ? "bg-primary-50 border-primary-100 text-primary-700"
                : "bg-slate-50 border-slate-100 text-slate-400"
            }`}
          >
            {done ? "✓ " : "⋯ "}{label}
          </div>
        ))}
      </div>
    </div>
  );
}
