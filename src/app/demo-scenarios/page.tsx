"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import CryptoNav from "@/components/CryptoNav";
import { scenarioData } from "@/lib/scenario-data";
import { analyzeScenario, getVolumeChartData } from "@/lib/analysis";
import type { ScenarioId } from "@/lib/crypto-types";

const SCENARIOS: { id: ScenarioId; label: string; description: string }[] = [
  { id: "day1", label: "Day 1", description: "Normal discussion" },
  { id: "day2", label: "Day 2", description: "Slight increase" },
  { id: "day3", label: "Day 3", description: "Discussion spike" },
  { id: "day4", label: "Day 4", description: "Cooling phase" },
  { id: "day5", label: "Day 5", description: "Post-event normalization" },
];

const VOLUME_COLORS = ["#6366f1", "#6366f1", "#a855f7", "#6366f1", "#6366f1"];
const SENTIMENT_COLORS = { positive: "#10b981", negative: "#ef4444", neutral: "#64748b" };

export default function DemoScenariosPage() {
  const [selected, setSelected] = useState<ScenarioId>("day1");

  const output = useMemo(
    () => analyzeScenario(scenarioData[selected], selected, "Bitcoin"),
    [selected]
  );

  const volumeData = useMemo(() => getVolumeChartData(), []);
  const sentimentPieData = useMemo(
    () => [
      { name: "Positive", value: output.sentimentBreakdown.positive, color: SENTIMENT_COLORS.positive },
      { name: "Negative", value: output.sentimentBreakdown.negative, color: SENTIMENT_COLORS.negative },
      { name: "Neutral", value: output.sentimentBreakdown.neutral, color: SENTIMENT_COLORS.neutral },
    ],
    [output.sentimentBreakdown]
  );

  const volumeDataWithHighlight = volumeData.map((d) => ({
    ...d,
    isSpike: d.day === SCENARIOS.find((s) => s.id === selected)?.label && output.spikeDetected,
  }));

  return (
    <div className="min-h-screen bg-black text-white">
      <CryptoNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Discussion Intelligence Replay
        </h1>
        <p className="text-sm text-white/70 mb-8">
          Pre-stored sample datasets simulating historical monitoring windows. Select a scenario to run the same analysis logic.
        </p>

        <section className="mb-10">
          <h2 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wide">
            Select scenario
          </h2>
          <div className="flex flex-wrap gap-3">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  selected === s.id
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-white/20 bg-white/5 text-white/90 hover:bg-white/10"
                }`}
              >
                {s.label} – {s.description}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-6 mb-10 transition-opacity duration-300 ease-out">
          <h2 className="text-lg font-semibold text-white mb-4">
            Intelligence Output
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide">Topic</p>
              <p className="font-medium text-white">{output.topic}</p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide">Keyword Monitored</p>
              <p className="font-medium text-white">{output.keywordMonitored}</p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide">Discussion Change</p>
              <p className="font-medium text-white">{output.discussionChange}</p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide">Spike Detected</p>
              <p className={`font-medium ${output.spikeDetected ? "text-amber-400" : "text-white/80"}`}>
                {output.spikeDetected ? "Yes" : "No"}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Sentiment Breakdown</p>
              <p className="text-sm text-white/90">
                Positive {output.sentimentBreakdown.positive}% · Negative {output.sentimentBreakdown.negative}% · Neutral {output.sentimentBreakdown.neutral}%
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Sentiment Score</p>
              <p className="text-lg font-semibold text-white">
                {output.sentimentScore >= 0 ? "+" : ""}{output.sentimentScore.toFixed(2)} (range -1 to +1)
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Auto-generated Summary</p>
            <p className="text-sm text-white/90 leading-relaxed">
              {output.summary}
            </p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2 mb-10">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-sm font-medium text-white/80 mb-4">
              Discussion volume (Day 1 → Day 5)
            </h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeDataWithHighlight} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.7)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.7)" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                    {volumeDataWithHighlight.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.isSpike ? "#a855f7" : "rgba(99, 102, 241, 0.8)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-white/50 mt-2">
              Spike indicator highlighted in purple when selected scenario has a spike.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-sm font-medium text-white/80 mb-4">
              Sentiment distribution (selected scenario)
            </h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={false}
                  >
                    {sentimentPieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <p className="text-xs text-white/50">
          Demo / Replay mode — pre-stored sample data. Same analysis logic runs on selection. Not predictive; for informational awareness only.
        </p>
      </main>
    </div>
  );
}
