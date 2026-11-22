// E6 — Viva Readiness Index gauge (SVG arc, red/amber/green band)

"use client";

import { cn } from "@/lib/utils";

export function bandColor(band: "red" | "amber" | "green") {
  return band === "red" ? "#e11d48" : band === "amber" ? "#f59e0b" : "#059669";
}

export function bandLabel(band: "red" | "amber" | "green") {
  return band === "red" ? "Needs serious practice" : band === "amber" ? "Getting there" : "Viva-ready";
}

export default function ReadinessGauge({
  index,
  band,
  size = 168,
  label,
}: {
  index: number;
  band: "red" | "amber" | "green";
  size?: number;
  label?: string;
}) {
  const stroke = 13;
  const r = (size - stroke) / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135;
  const sweep = 270;
  const toXY = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arc = (fromDeg: number, toDeg: number) => {
    const a = toXY(fromDeg);
    const b = toXY(toDeg);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
  };
  const endAngle = startAngle + (sweep * Math.max(0, Math.min(100, index))) / 100;
  const color = bandColor(band);

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} role="img" aria-label={`Readiness ${index} of 100`}>
        <path d={arc(startAngle, startAngle + sweep)} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth={stroke} strokeLinecap="round" />
        {index > 0 && (
          <path d={arc(startAngle, endAngle)} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" style={{ transition: "all .6s ease" }} />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: 34, fontWeight: 700 }}>
          {index}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>
          / 100 readiness
        </text>
      </svg>
      <span
        className={cn(
          "mt-1 rounded-full px-3 py-0.5 text-xs font-semibold text-white",
          band === "red" ? "bg-rose-600" : band === "amber" ? "bg-amber-500" : "bg-emerald-600"
        )}
      >
        {label ?? bandLabel(band)}
      </span>
    </div>
  );
}
