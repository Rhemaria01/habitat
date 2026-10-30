"use client";

import type { CalendarDaySegment } from "@/app/actions/calendar";

type CalendarDayRingProps = {
  segments: CalendarDaySegment[];
  dimmed?: boolean;
};

const SIZE = 78;
const CX = SIZE / 2;
const CY = SIZE / 2;
const STROKE = 3.35;
const OUTER_R = 31;
const INNER_R = 22.5;
const SEG_GAP_DEG = 10;
const MAX = 3;

const OUTER_SLOT = [132, 88];
const INNER_SLOT = 228;

function arcRatio(outcome: CalendarDaySegment["outcome"]): number {
  switch (outcome) {
    case "completed":
      return 1;
    case "partial":
      return 0.55;
    default:
      return 0;
  }
}

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arcPath(r: number, startDeg: number, endDeg: number) {
  const start = polar(r, startDeg);
  const end = polar(r, endDeg);
  const sweep = endDeg - startDeg;
  if (sweep <= 0) return "";
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

function Track({ r }: { r: number }) {
  return (
    <circle
      cx={CX}
      cy={CY}
      r={r}
      fill="none"
      className="cal-ring-track"
      strokeWidth={STROKE}
    />
  );
}

function ArcSegment({
  r,
  startDeg,
  sweepDeg,
  color,
  dimmed,
}: {
  r: number;
  startDeg: number;
  sweepDeg: number;
  color: string;
  dimmed?: boolean;
}) {
  if (sweepDeg <= 0.5) return null;
  const d = arcPath(r, startDeg, startDeg + sweepDeg);
  if (!d) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      opacity={dimmed ? 0.42 : 0.95}
    />
  );
}

function CenterWedge({ color, dimmed }: { color: string; dimmed?: boolean }) {
  const r = 6.5;
  const p0 = { x: CX, y: CY };
  const p1 = polar(r, -58);
  const p2 = polar(r, 12);
  return (
    <path
      d={`M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y} Z`}
      fill={color}
      opacity={dimmed ? 0.35 : 0.88}
    />
  );
}

type ArcPlan = { seg: CalendarDaySegment; slot: number; start: number };

function planArcs(visible: CalendarDaySegment[]): {
  outer: ArcPlan[];
  inner: { seg: CalendarDaySegment; start: number } | null;
} {
  if (visible.length === 0) return { outer: [], inner: null };

  if (visible.length === 1) {
    return {
      outer: [
        { seg: visible[0], slot: OUTER_SLOT[0], start: -90 + SEG_GAP_DEG / 2 },
      ],
      inner: null,
    };
  }

  if (visible.length === 2) {
    return {
      outer: [
        { seg: visible[0], slot: OUTER_SLOT[0], start: -90 + SEG_GAP_DEG / 2 },
      ],
      inner: { seg: visible[1], start: 112 + SEG_GAP_DEG / 2 },
    };
  }

  let cursor = -90;
  const first: ArcPlan = {
    seg: visible[0],
    slot: OUTER_SLOT[0],
    start: cursor + SEG_GAP_DEG / 2,
  };
  cursor += OUTER_SLOT[0] + SEG_GAP_DEG;
  const second: ArcPlan = {
    seg: visible[1],
    slot: OUTER_SLOT[1],
    start: cursor + SEG_GAP_DEG / 2,
  };

  return {
    outer: [first, second],
    inner: { seg: visible[2], start: 112 + SEG_GAP_DEG / 2 },
  };
}

export function CalendarDayRing({ segments, dimmed }: CalendarDayRingProps) {
  const visible = segments.slice(0, MAX);
  const { outer, inner } = planArcs(visible);
  const wedgeColor = visible[0]?.color ?? "var(--chart-1)";

  return (
    <svg
      className={`cal-day-ring-svg ${dimmed ? "dimmed" : ""}`}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden
    >
      <Track r={OUTER_R} />
      <Track r={INNER_R} />

      {outer.map((a, i) => (
        <ArcSegment
          key={`o-${i}`}
          r={OUTER_R}
          startDeg={a.start}
          sweepDeg={a.slot * arcRatio(a.seg.outcome)}
          color={a.seg.color}
          dimmed={dimmed}
        />
      ))}

      {inner ? (
        <ArcSegment
          r={INNER_R}
          startDeg={inner.start}
          sweepDeg={INNER_SLOT * arcRatio(inner.seg.outcome)}
          color={inner.seg.color}
          dimmed={dimmed}
        />
      ) : null}

      {visible.length > 0 ? <CenterWedge color={wedgeColor} dimmed={dimmed} /> : null}
    </svg>
  );
}

export function CalendarDayDots({ segments }: { segments: CalendarDaySegment[] }) {
  const visible = segments.slice(0, MAX);
  return (
    <div className="cal-day-dots" aria-hidden>
      {visible.map((s, i) => (
        <span
          key={i}
          className={`cal-day-dot ${s.outcome === "missed" ? "missed" : ""}`}
          style={{
            background: s.color,
            opacity: s.outcome === "missed" ? 0.4 : 1,
          }}
        />
      ))}
    </div>
  );
}
