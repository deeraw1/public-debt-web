"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ── Nigeria historical actuals (2019-2024) ─────────────────────────────────────
const ACTUALS = [
  { year: 2019, debtGdp: 25.1, intRev: 62.1, primBal: -1.4 },
  { year: 2020, debtGdp: 26.0, intRev: 83.1, primBal: -3.5 },
  { year: 2021, debtGdp: 23.7, intRev: 96.3, primBal: -2.8 },
  { year: 2022, debtGdp: 24.0, intRev: 79.6, primBal: -2.9 },
  { year: 2023, debtGdp: 26.1, intRev: 91.2, primBal: -3.1 },
  { year: 2024, debtGdp: 27.4, intRev: 101.3, primBal: -2.6 },
];

// IMF/World Bank emerging market thresholds
const THRESHOLDS = [
  { label: "Debt/GDP moderate risk", value: 55, color: "#f59e0b" },
  { label: "Debt/GDP high risk", value: 70, color: "#ef4444" },
  { label: "Interest/Revenue moderate risk", value: 18, color: "#f59e0b" },
  { label: "Interest/Revenue high risk", value: 22, color: "#ef4444" },
];

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  description: string;
}

function Slider({ label, value, min, max, step, unit, onChange, description }: SliderProps) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-1">
        <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{label}</span>
        <span style={{ color: "var(--accent2)", fontWeight: 700, fontSize: 16 }}>
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "var(--accent)" }}
      />
      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{description}</div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  risk: "low" | "moderate" | "high";
}

function MetricCard({ label, value, sub, risk }: MetricCardProps) {
  const riskColors = { low: "#22c55e", moderate: "#f59e0b", high: "#ef4444" };
  const riskLabels = { low: "Low Risk", moderate: "Moderate Risk", high: "High Risk" };
  return (
    <div
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ color: "var(--accent2)", fontSize: 28, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: "var(--muted)", fontSize: 12 }}>{sub}</div>}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 4,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: riskColors[risk],
            display: "inline-block",
          }}
        />
        <span style={{ color: riskColors[risk], fontSize: 12, fontWeight: 600 }}>{riskLabels[risk]}</span>
      </div>
    </div>
  );
}

interface ThresholdRowProps {
  label: string;
  current: number;
  moderate: number;
  high: number;
  unit: string;
}

function ThresholdRow({ label, current, moderate, high, unit }: ThresholdRowProps) {
  const pct = Math.min((current / (high * 1.4)) * 100, 100);
  const modPct = (moderate / (high * 1.4)) * 100;
  const highPct = (high / (high * 1.4)) * 100;
  const color = current >= high ? "#ef4444" : current >= moderate ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex justify-between mb-1">
        <span style={{ color: "var(--text)", fontSize: 13 }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>
          {current.toFixed(1)}{unit}
        </span>
      </div>
      <div style={{ position: "relative", height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 4,
            transition: "width 0.3s ease",
          }}
        />
        <div style={{ position: "absolute", left: `${modPct}%`, top: 0, height: "100%", width: 2, background: "#f59e0b", opacity: 0.7 }} />
        <div style={{ position: "absolute", left: `${highPct}%`, top: 0, height: "100%", width: 2, background: "#ef4444", opacity: 0.7 }} />
      </div>
      <div className="flex justify-between mt-1">
        <span style={{ color: "var(--muted)", fontSize: 11 }}>Safe</span>
        <span style={{ color: "#f59e0b", fontSize: 11 }}>{moderate}{unit} moderate</span>
        <span style={{ color: "#ef4444", fontSize: 11 }}>{high}{unit} high</span>
      </div>
    </div>
  );
}

// ── DSA arithmetic ─────────────────────────────────────────────────────────────
function runDSA(
  baseDebtGdp: number,
  gdpGrowth: number,
  nominalInterest: number,
  primaryBalance: number,
  oilRevBoost: number,
  fxShare: number,
  fxDepreciation: number,
  years = 5
) {
  const scenarios: { name: string; gdpDelta: number; rDelta: number; pbDelta: number }[] = [
    { name: "Optimistic", gdpDelta: 1.5,  rDelta: -0.5, pbDelta: 0.5 },
    { name: "Baseline",   gdpDelta: 0,    rDelta: 0,    pbDelta: 0   },
    { name: "Pessimistic",gdpDelta: -1.5, rDelta: 1.0,  pbDelta: -0.8 },
  ];

  const results: Record<string, { year: number; debtGdp: number; intRev: number; primBal: number }[]> = {};

  for (const sc of scenarios) {
    const g = (gdpGrowth + sc.gdpDelta) / 100;
    const r = (nominalInterest + sc.rDelta) / 100;
    const pb = primaryBalance + sc.pbDelta;
    const oilAdj = oilRevBoost / 100;

    let d = baseDebtGdp;
    const rows = [];

    for (let i = 1; i <= years; i++) {
      const yr = 2024 + i;
      // FX stock-flow adjustment
      const fxAdj = fxShare * fxDepreciation / 100 * d / 100;
      // Debt accumulation: d(t) = [(1+r)/(1+g)] * d(t-1) - pb/100
      d = ((1 + r) / (1 + g)) * d - pb / 100 * 100 + fxAdj;
      d = Math.max(d, 0);

      // Interest/Revenue: approximate revenue at 9% of GDP baseline
      const revGdp = 9.0 + oilAdj * i;
      const intGdp = d * r;
      const intRev = (intGdp / revGdp) * 100;

      rows.push({ year: yr, debtGdp: parseFloat(d.toFixed(2)), intRev: parseFloat(intRev.toFixed(2)), primBal: parseFloat(pb.toFixed(2)) });
    }
    results[sc.name] = rows;
  }
  return results;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", minWidth: 200 }}>
      <p style={{ color: "var(--accent2)", fontWeight: 700, marginBottom: 8 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 4 }}>
          <span style={{ color: p.color || "var(--muted)", fontSize: 13 }}>{p.name}</span>
          <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 13 }}>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function PublicDebtApp() {
  const [gdpGrowth, setGdpGrowth] = useState(3.8);
  const [nominalInterest, setNominalInterest] = useState(8.5);
  const [primaryBalance, setPrimaryBalance] = useState(-2.5);
  const [oilRevBoost, setOilRevBoost] = useState(0);
  const [fxShare, setFxShare] = useState(29);
  const [fxDepreciation, setFxDepreciation] = useState(5);
  const [activeMetric, setActiveMetric] = useState<"debtGdp" | "intRev">("debtGdp");

  const scenarios = useMemo(
    () => runDSA(27.4, gdpGrowth, nominalInterest, primaryBalance, oilRevBoost, fxShare, fxDepreciation),
    [gdpGrowth, nominalInterest, primaryBalance, oilRevBoost, fxShare, fxDepreciation]
  );

  const baseline2029 = scenarios.Baseline[scenarios.Baseline.length - 1];
  const optimistic2029 = scenarios.Optimistic[scenarios.Optimistic.length - 1];
  const pessimistic2029 = scenarios.Pessimistic[scenarios.Pessimistic.length - 1];

  const debtRisk2029 =
    pessimistic2029.debtGdp >= 70 ? "high" : pessimistic2029.debtGdp >= 55 ? "moderate" : "low";
  const irRisk2029 =
    baseline2029.intRev >= 22 ? "high" : baseline2029.intRev >= 18 ? "moderate" : "low";
  const overallRisk = debtRisk2029 === "high" || irRisk2029 === "high" ? "high"
    : debtRisk2029 === "moderate" || irRisk2029 === "moderate" ? "moderate" : "low";

  // Merge actuals + projection bands for chart
  const chartData = [
    ...ACTUALS.map((a) => ({
      year: a.year,
      actual: activeMetric === "debtGdp" ? a.debtGdp : a.intRev,
      base: undefined as number | undefined,
      optimistic: undefined as number | undefined,
      pessimistic: undefined as number | undefined,
    })),
    { year: 2024, actual: activeMetric === "debtGdp" ? 27.4 : 101.3, base: undefined, optimistic: undefined, pessimistic: undefined },
    ...scenarios.Baseline.map((b, i) => ({
      year: b.year,
      actual: undefined as number | undefined,
      base: activeMetric === "debtGdp" ? b.debtGdp : b.intRev,
      optimistic: activeMetric === "debtGdp" ? scenarios.Optimistic[i].debtGdp : scenarios.Optimistic[i].intRev,
      pessimistic: activeMetric === "debtGdp" ? scenarios.Pessimistic[i].debtGdp : scenarios.Pessimistic[i].intRev,
    })),
  ];

  const threshold = activeMetric === "debtGdp" ? { mod: 55, high: 70 } : { mod: 18, high: 22 };
  const yDomain = activeMetric === "debtGdp" ? [0, 90] : [0, 140];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #0b0e18 0%, #0d1220 60%, #111828 100%)",
          borderBottom: "1px solid var(--border)",
          padding: "56px 24px 48px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["IMF DSA Framework", "Nigeria Actuals 2019–2024", "3-Scenario Fan Chart", "Interactive Sliders"].map((tag) => (
            <span
              key={tag}
              style={{
                background: "rgba(200,168,58,0.12)",
                border: "1px solid rgba(200,168,58,0.3)",
                color: "var(--accent2)",
                borderRadius: 20,
                padding: "4px 14px",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>
          Public Debt Sustainability Analyser
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 16, maxWidth: 620, margin: "0 auto" }}>
          Model Nigeria&apos;s debt-to-GDP trajectory under your own growth and interest rate assumptions.
          IMF-style DSA arithmetic with optimistic, baseline, and pessimistic fan-chart projections to 2029.
        </p>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        {/* Summary metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 40 }}>
          <MetricCard
            label="Baseline Debt/GDP 2029"
            value={`${baseline2029.debtGdp.toFixed(1)}%`}
            sub={`Optimistic: ${optimistic2029.debtGdp.toFixed(1)}% · Pessimistic: ${pessimistic2029.debtGdp.toFixed(1)}%`}
            risk={baseline2029.debtGdp >= 70 ? "high" : baseline2029.debtGdp >= 55 ? "moderate" : "low"}
          />
          <MetricCard
            label="Interest / Revenue 2029"
            value={`${baseline2029.intRev.toFixed(1)}%`}
            sub="IMF high risk threshold: 22%"
            risk={irRisk2029}
          />
          <MetricCard
            label="Primary Balance 2029"
            value={`${primaryBalance > 0 ? "+" : ""}${primaryBalance.toFixed(1)}% GDP`}
            sub="Surplus stabilises debt"
            risk={primaryBalance >= 0 ? "low" : primaryBalance >= -2 ? "moderate" : "high"}
          />
          <MetricCard
            label="Overall DSA Assessment"
            value={overallRisk === "low" ? "Sustainable" : overallRisk === "moderate" ? "Moderate Risk" : "High Risk"}
            sub="Across all three scenarios"
            risk={overallRisk}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>
          {/* Chart panel */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "28px 24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ color: "var(--text)", fontWeight: 700, fontSize: 18 }}>
                  {activeMetric === "debtGdp" ? "Debt-to-GDP Trajectory" : "Interest / Revenue Trajectory"}
                </h2>
                <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                  Historical actuals (solid) + 2025–2029 scenario fan (shaded)
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["debtGdp", "intRev"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setActiveMetric(m)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      border: "1px solid",
                      borderColor: activeMetric === m ? "var(--accent)" : "var(--border)",
                      background: activeMetric === m ? "rgba(200,168,58,0.15)" : "transparent",
                      color: activeMetric === m ? "var(--accent2)" : "var(--muted)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {m === "debtGdp" ? "Debt/GDP" : "Int/Rev"}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" stroke="var(--muted)" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis domain={yDomain} stroke="var(--muted)" tick={{ fill: "var(--muted)", fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 13, paddingTop: 16 }} />

                <ReferenceLine y={threshold.mod} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Moderate", fill: "#f59e0b", fontSize: 11, position: "right" }} />
                <ReferenceLine y={threshold.high} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "High", fill: "#ef4444", fontSize: 11, position: "right" }} />

                {/* Fan band: pessimistic to optimistic */}
                <Area dataKey="pessimistic" name="Pessimistic" fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls />
                <Area dataKey="optimistic" name="Optimistic" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls />
                <Line dataKey="base" name="Baseline" stroke="var(--accent)" strokeWidth={2.5} dot={false} connectNulls />
                <Line dataKey="actual" name="Historical" stroke="#60a5fa" strokeWidth={2.5} dot={{ fill: "#60a5fa", r: 4 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "24px 20px",
              }}
            >
              <h3 style={{ color: "var(--accent2)", fontWeight: 700, fontSize: 15, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Scenario Parameters
              </h3>

              <Slider label="Real GDP Growth" value={gdpGrowth} min={-2} max={8} step={0.1} unit="%" onChange={setGdpGrowth} description="Nigeria 2024 estimate: ~3.4%. Oil sector recovery can push higher." />
              <Slider label="Nominal Interest Rate" value={nominalInterest} min={4} max={18} step={0.5} unit="%" onChange={setNominalInterest} description="Weighted avg rate on new borrowing. Domestic MPR currently 27.5%." />
              <Slider label="Primary Balance" value={primaryBalance} min={-6} max={2} step={0.1} unit="% GDP" onChange={setPrimaryBalance} description="Revenue minus non-interest spending. Negative = deficit." />
              <Slider label="Oil Revenue Boost" value={oilRevBoost} min={-3} max={5} step={0.1} unit="pp/yr" onChange={setOilRevBoost} description="Annual change in oil rev as % GDP. Positive = higher oil output/price." />
              <Slider label="FX Debt Share" value={fxShare} min={10} max={60} step={1} unit="%" onChange={setFxShare} description="Share of public debt in foreign currency (~29% as of 2024)." />
              <Slider label="Annual FX Depreciation" value={fxDepreciation} min={0} max={30} step={0.5} unit="%" onChange={setFxDepreciation} description="Naira weakening adds to FX debt stock in GDP terms." />
            </div>

            {/* IMF Thresholds panel */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "24px 20px",
              }}
            >
              <h3 style={{ color: "var(--accent2)", fontWeight: 700, fontSize: 15, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                IMF Benchmark Thresholds
              </h3>
              <ThresholdRow label="Debt/GDP (2029 Baseline)" current={baseline2029.debtGdp} moderate={55} high={70} unit="%" />
              <ThresholdRow label="Interest/Revenue (2029 Baseline)" current={baseline2029.intRev} moderate={18} high={22} unit="%" />
              <ThresholdRow label="Debt/GDP (2029 Pessimistic)" current={pessimistic2029.debtGdp} moderate={55} high={70} unit="%" />

              <div style={{ marginTop: 20, padding: "14px", background: "rgba(200,168,58,0.07)", borderRadius: 8, borderLeft: "3px solid var(--accent)" }}>
                <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.7 }}>
                  Nigeria&apos;s nominal debt/GDP appears contained (~27%), but the
                  <strong style={{ color: "var(--accent2)" }}> interest/revenue ratio </strong>
                  has exceeded the IMF&apos;s high-risk threshold of 22% — a reflection of low revenue
                  mobilisation rather than high debt stock.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scenario table */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "28px 24px",
            marginTop: 32,
            overflowX: "auto",
          }}
        >
          <h2 style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
            Projection Table — All Scenarios
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Year", "Optimistic Debt/GDP", "Baseline Debt/GDP", "Pessimistic Debt/GDP", "Baseline Int/Rev", "Baseline Prim Bal"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", color: "var(--muted)", textAlign: "right", fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.Baseline.map((b, i) => {
                const opt = scenarios.Optimistic[i];
                const pes = scenarios.Pessimistic[i];
                return (
                  <tr key={b.year} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px 14px", color: "var(--accent2)", fontWeight: 700, textAlign: "right" }}>{b.year}</td>
                    <td style={{ padding: "10px 14px", color: "#22c55e", textAlign: "right" }}>{opt.debtGdp.toFixed(1)}%</td>
                    <td style={{ padding: "10px 14px", color: "var(--accent)", fontWeight: 600, textAlign: "right" }}>{b.debtGdp.toFixed(1)}%</td>
                    <td style={{ padding: "10px 14px", color: "#ef4444", textAlign: "right" }}>{pes.debtGdp.toFixed(1)}%</td>
                    <td
                      style={{
                        padding: "10px 14px",
                        color: b.intRev >= 22 ? "#ef4444" : b.intRev >= 18 ? "#f59e0b" : "#22c55e",
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      {b.intRev.toFixed(1)}%
                    </td>
                    <td style={{ padding: "10px 14px", color: b.primBal >= 0 ? "#22c55e" : "#ef4444", textAlign: "right" }}>
                      {b.primBal > 0 ? "+" : ""}{b.primBal.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Methodology note */}
        <div style={{ marginTop: 24, padding: "20px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <h3 style={{ color: "var(--accent2)", fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Methodology</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.8 }}>
            Debt accumulation follows the IMF DSA identity: <strong style={{ color: "var(--text)" }}>d(t) = [(1+r)/(1+g)] × d(t−1) − pb(t)</strong>, where r is the nominal
            interest rate, g is nominal GDP growth, and pb is the primary balance as % of GDP. A foreign-currency stock-flow adjustment
            is added for FX-denominated debt under naira depreciation. Optimistic/pessimistic scenarios shift GDP growth by ±1.5pp,
            interest rate by ∓0.5/+1.0pp, and primary balance by ±0.5/∓0.8pp. Historical data from DMO and NBS.
          </p>
        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "32px 24px", borderTop: "1px solid var(--border)", marginTop: 48 }}>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          Built by{" "}
          <a href="mailto:adediranabiola160@gmail.com" style={{ color: "var(--accent)", textDecoration: "none" }}>
            Abiola Adediran
          </a>{" "}
          · IMF DSA Framework · Nigeria Macro Analytics
        </p>
      </footer>
    </div>
  );
}
