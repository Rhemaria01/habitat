"use client";

import { useMemo } from "react";
import type { StatsDayPoint } from "@/app/actions/stats";
import { prefersReducedMotion } from "@/animations/config";

type StatsTrendChartProps = {
  points: StatsDayPoint[];
};

export function StatsTrendChart({ points }: StatsTrendChartProps) {
  const { path, areaPath, labels } = useMemo(() => {
    const withData = points.filter((p) => p.adherence !== null);
    if (withData.length === 0) {
      return { path: "", areaPath: "", labels: points };
    }

    const w = 100;
    const h = 48;
    const pad = 2;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;

    const coords = points.map((p, i) => {
      const x = pad + (i / Math.max(points.length - 1, 1)) * innerW;
      const y =
        p.adherence === null
          ? innerH + pad
          : pad + innerH - (p.adherence / 100) * innerH;
      return { x, y, p };
    });

    const linePoints = coords.filter((c) => c.p.adherence !== null);
    let d = "";
    linePoints.forEach((c, i) => {
      d += i === 0 ? `M ${c.x} ${c.y}` : ` L ${c.x} ${c.y}`;
    });

    const first = linePoints[0];
    const last = linePoints[linePoints.length - 1];
    const area =
      first && last
        ? `${d} L ${last.x} ${h} L ${first.x} ${h} Z`
        : "";

    return { path: d, areaPath: area, labels: points };
  }, [points]);

  const hasData = points.some((p) => p.adherence !== null);

  return (
    <section className="glass-panel stats-trend-panel">
      <div className="panel-head">
        <h2>Completion trend</h2>
        <p className="panel-meta">Daily adherence in selected range</p>
      </div>
      <div className="stats-trend-chart" role="img" aria-label="Adherence trend line chart">
        {hasData ? (
          <svg viewBox="0 0 100 52" preserveAspectRatio="none" className="stats-trend-svg">
            {areaPath ? (
              <path
                d={areaPath}
                className="stats-trend-area"
                style={
                  prefersReducedMotion()
                    ? undefined
                    : { animation: "stats-trend-fill 0.8s ease-out forwards" }
                }
              />
            ) : null}
            <path d={path} className="stats-trend-line" fill="none" />
          </svg>
        ) : (
          <p className="stats-chart-empty text-sm text-muted-foreground">
            Log habits to see trends here.
          </p>
        )}
        {hasData ? (
          <div className="stats-chart-labels">
            <span>{labels[0]?.label}</span>
            <span>{labels[Math.floor(labels.length / 2)]?.label}</span>
            <span>{labels[labels.length - 1]?.label}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
