import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/auth/AuthProvider";
import type { ChartDatum } from "@/components/ui";
import { supabase } from "./supabase";

export type LiveAnalytics = {
  loading: boolean;
  error: string | null;
  metrics: {
    students: string;
    model: string;
    average: string;
    highRisk: string;
  };
  scoreSeries: ChartDatum[];
  riskSeries: ChartDatum[];
  refresh: () => void;
};

function riskLabel(value: string) {
  if (value === "low") return "Low";
  if (value === "medium") return "Medium";
  if (value === "high") return "High";
  return "Unclassified";
}

export function useLiveAnalytics(): LiveAnalytics {
  const { demoMode, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [modelStatus, setModelStatus] = useState("Unavailable");
  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    if (demoMode || !user || !supabase) {
      setEvaluations([]);
      setModelStatus("Unavailable");
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    Promise.all([
      supabase
        .from("performance_evaluations")
        .select(
          "score,risk_level,classification,enrollments(students(first_name,last_name,institutional_id),class_records(subjects(code)))",
        )
        .order("score", { ascending: false }),
      supabase
        .from("model_versions")
        .select("name,version,status")
        .eq("status", "active")
        .limit(1)
        .maybeSingle(),
    ])
      .then(([evaluationResult, modelResult]) => {
        if (!active) return;
        if (evaluationResult.error) throw evaluationResult.error;
        if (modelResult.error) throw modelResult.error;
        setEvaluations(evaluationResult.data ?? []);
        setModelStatus(
          modelResult.data
            ? `${modelResult.data.version} active`
            : "Unavailable",
        );
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setEvaluations([]);
        setModelStatus("Unavailable");
        setError("Unable to load persisted APMS analytics.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [demoMode, user, version]);

  const scoreSeries = useMemo(
    () =>
      evaluations.slice(0, 8).map((item, index) => {
        const student = item.enrollments?.students;
        const label =
          student?.first_name && student?.last_name
            ? `${student.first_name} ${student.last_name}`.slice(0, 12)
            : `Record ${index + 1}`;
        return { label, value: Number(item.score) || 0 };
      }),
    [evaluations],
  );

  const riskSeries = useMemo(() => {
    const counts = new Map<string, number>([
      ["Low", 0],
      ["Medium", 0],
      ["High", 0],
    ]);
    for (const item of evaluations) {
      const label = riskLabel(String(item.risk_level));
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts, ([label, value]) => ({ label, value }));
  }, [evaluations]);

  const average =
    evaluations.length > 0
      ? evaluations.reduce((sum, item) => sum + (Number(item.score) || 0), 0) /
        evaluations.length
      : null;
  const highRisk = evaluations.filter((item) => item.risk_level === "high");

  return {
    loading,
    error,
    metrics: {
      students: String(evaluations.length),
      model: modelStatus,
      average: average == null ? "-" : `${average.toFixed(1)}%`,
      highRisk: String(highRisk.length),
    },
    scoreSeries,
    riskSeries,
    refresh,
  };
}
