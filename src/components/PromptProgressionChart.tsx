import React, { useState } from "react";
import * as d3 from "d3";
import { PromptIteration } from "./PromptHistory";
import { Sparkles, HelpCircle, TrendingUp, BarChart2, Award } from "lucide-react";

interface PromptProgressionChartProps {
  history: PromptIteration[];
}

export default function PromptProgressionChart({ history }: PromptProgressionChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Filter and prepare chronological attempts (oldest to newest)
  const evalAttempts = history
    .filter((item) => item.mode === "exercice" && item.score !== null)
    .slice()
    .reverse();

  if (evalAttempts.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center shadow-inner flex flex-col items-center justify-center min-h-[180px] animate-in fade-in duration-300">
        <BarChart2 className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
        <h5 className="text-xs font-bold text-slate-700">Progression en temps réel</h5>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">
          Soumettez vos premiers prompts et faites des tentatives pour générer votre courbe d'apprentissage.
        </p>
      </div>
    );
  }

  // Chart setup
  const width = 500;
  const height = 220;
  const margin = { top: 20, right: 30, bottom: 35, left: 35 };

  // Adjust scales
  const attemptsCount = evalAttempts.length;
  const xDomain = attemptsCount > 1 ? [0, attemptsCount - 1] : [0, 1];
  
  const xScale = d3.scaleLinear()
    .domain(xDomain)
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([height - margin.bottom, margin.top]);

  // Generate lines and areas
  const getX = (i: number) => {
    if (attemptsCount === 1) {
      return xScale(0.5); // Center the single point
    }
    return xScale(i);
  };

  const lineGeneratorClarity = d3.line<any>()
    .x((_, i) => getX(i))
    .y((d) => yScale(d.clarityScore ?? d.score ?? 0))
    .curve(d3.curveMonotoneX);

  const lineGeneratorConciseness = d3.line<any>()
    .x((_, i) => getX(i))
    .y((d) => yScale(d.concisenessScore ?? d.score ?? 0))
    .curve(d3.curveMonotoneX);

  const lineGeneratorGlobal = d3.line<any>()
    .x((_, i) => getX(i))
    .y((d) => yScale(d.score ?? 0))
    .curve(d3.curveMonotoneX);

  const areaGeneratorClarity = d3.area<any>()
    .x((_, i) => getX(i))
    .y0(yScale(0))
    .y1((d) => yScale(d.clarityScore ?? d.score ?? 0))
    .curve(d3.curveMonotoneX);

  const areaGeneratorConciseness = d3.area<any>()
    .x((_, i) => getX(i))
    .y0(yScale(0))
    .y1((d) => yScale(d.concisenessScore ?? d.score ?? 0))
    .curve(d3.curveMonotoneX);

  // Generate paths
  const clarityPath = lineGeneratorClarity(evalAttempts) || "";
  const concisenessPath = lineGeneratorConciseness(evalAttempts) || "";
  const globalPath = lineGeneratorGlobal(evalAttempts) || "";
  const clarityAreaPath = areaGeneratorClarity(evalAttempts) || "";
  const concisenessAreaPath = areaGeneratorConciseness(evalAttempts) || "";

  // Helper values for ticks
  const yTicks = [0, 25, 50, 75, 100];
  const thresholdY = yScale(80);
  const optimalY = yScale(100);

  // Calculate stats
  const latestAttempt = evalAttempts[evalAttempts.length - 1];
  const firstAttempt = evalAttempts[0];

  const clarityProgress = (latestAttempt.clarityScore ?? latestAttempt.score ?? 0) - (firstAttempt.clarityScore ?? firstAttempt.score ?? 0);
  const concisenessProgress = (latestAttempt.concisenessScore ?? latestAttempt.score ?? 0) - (firstAttempt.concisenessScore ?? firstAttempt.score ?? 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-800">Visualisation de Progression</h5>
            <p className="text-[10px] text-slate-500 font-medium">Comparaison par rapport aux exigences optimales (100%)</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider select-none">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-indigo-500 rounded" />
            <span>Clarté</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-purple-500 rounded" />
            <span>Concision</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-emerald-500 rounded" />
            <span>Score</span>
          </div>
        </div>
      </div>

      {/* SVG D3 Chart Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-xl border border-slate-100 p-2 shadow-inner">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          style={{ maxHeight: "210px" }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="clarity-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="conciseness-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines (Y-axis) */}
          {yTicks.map((tick) => (
            <g key={tick} className="opacity-40">
              <line
                x1={margin.left}
                y1={yScale(tick)}
                x2={width - margin.right}
                y2={yScale(tick)}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray={tick === 0 || tick === 100 ? "0" : "3 3"}
              />
              <text
                x={margin.left - 8}
                y={yScale(tick) + 3}
                textAnchor="end"
                className="font-mono text-[9px] font-bold fill-slate-400"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Target Reference Lines */}
          {/* Success limit line (80%) */}
          <line
            x1={margin.left}
            y1={thresholdY}
            x2={width - margin.right}
            y2={thresholdY}
            stroke="#10b981"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            className="opacity-70"
          />
          <text
            x={width - margin.right - 5}
            y={thresholdY - 4}
            textAnchor="end"
            className="text-[8px] font-extrabold fill-emerald-600 bg-white uppercase tracking-wider opacity-90"
          >
            Seuil validation (80%)
          </text>

          {/* Optimal line (100%) */}
          <line
            x1={margin.left}
            y1={optimalY}
            x2={width - margin.right}
            y2={optimalY}
            stroke="#4f46e5"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            className="opacity-40"
          />
          <text
            x={width - margin.right - 5}
            y={optimalY + 10}
            textAnchor="end"
            className="text-[8px] font-extrabold fill-indigo-600 uppercase tracking-wider opacity-80"
          >
            Cible Optimale (100%)
          </text>

          {/* X Axis label ticks */}
          {evalAttempts.map((_, i) => {
            const xVal = getX(i);
            return (
              <g key={i}>
                <line
                  x1={xVal}
                  y1={height - margin.bottom}
                  x2={xVal}
                  y2={height - margin.bottom + 4}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                />
                <text
                  x={xVal}
                  y={height - margin.bottom + 15}
                  textAnchor="middle"
                  className="font-mono text-[8px] font-bold fill-slate-400"
                >
                  #{i + 1}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={clarityAreaPath} fill="url(#clarity-gradient)" />
          <path d={concisenessAreaPath} fill="url(#conciseness-gradient)" />

          {/* Trend Lines */}
          <path
            d={clarityPath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
          <path
            d={concisenessPath}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
          <path
            d={globalPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="3 2"
            className="transition-all duration-300 opacity-85"
          />

          {/* Interactive Data Nodes */}
          {evalAttempts.map((d, i) => {
            const xVal = getX(i);
            const yClarity = yScale(d.clarityScore ?? d.score ?? 0);
            const yConciseness = yScale(d.concisenessScore ?? d.score ?? 0);
            const yGlobal = yScale(d.score ?? 0);
            const isHovered = hoveredIdx === i;

            return (
              <g key={i}>
                {/* Clarity dot */}
                <circle
                  cx={xVal}
                  cy={yClarity}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#ffffff"
                  stroke="#6366f1"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150 cursor-pointer shadow-sm"
                />
                {/* Conciseness dot */}
                <circle
                  cx={xVal}
                  cy={yConciseness}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#ffffff"
                  stroke="#a855f7"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150 cursor-pointer shadow-sm"
                />
                {/* Global score dot */}
                <circle
                  cx={xVal}
                  cy={yGlobal}
                  r={isHovered ? 4.5 : 2.5}
                  fill="#10b981"
                  className="transition-all duration-150 cursor-pointer shadow-sm"
                />

                {/* Vertical helper line on hover */}
                {isHovered && (
                  <line
                    x1={xVal}
                    y1={margin.top}
                    x2={xVal}
                    y2={height - margin.bottom}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="opacity-40 pointer-events-none"
                  />
                )}

                {/* Large Transparent Hover target */}
                <rect
                  x={xVal - (attemptsCount > 1 ? (width - margin.left - margin.right) / (attemptsCount - 1) / 2 : 40)}
                  y={margin.top}
                  width={attemptsCount > 1 ? (width - margin.left - margin.right) / (attemptsCount - 1) : 80}
                  height={height - margin.top - margin.bottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIdx !== null && evalAttempts[hoveredIdx] && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg px-3 py-2 flex items-center gap-3 border border-slate-800 shadow-md text-[10px] z-10 transition-opacity duration-150 animate-in fade-in zoom-in-95 pointer-events-none">
            <span className="font-mono font-bold text-indigo-400">Tentative #{hoveredIdx + 1}</span>
            <div className="h-3 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Clarté:</span>
              <span className="font-mono font-bold text-indigo-300">{evalAttempts[hoveredIdx].clarityScore ?? evalAttempts[hoveredIdx].score ?? 0}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Concision:</span>
              <span className="font-mono font-bold text-purple-300">{evalAttempts[hoveredIdx].concisenessScore ?? evalAttempts[hoveredIdx].score ?? 0}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">Global:</span>
              <span className="font-mono font-bold text-emerald-400">{evalAttempts[hoveredIdx].score}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Comparison and analysis panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Clarity progress summary card */}
        <div className="bg-indigo-50/20 border border-indigo-100 rounded-xl p-3.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-indigo-900 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Analyse Clarté</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {clarityProgress > 0 ? (
              <>
                Votre clarté s'est améliorée de <strong className="text-indigo-600">+{clarityProgress} points</strong> par rapport à votre premier essai ! Vous structurez mieux vos consignes.
              </>
            ) : clarityProgress < 0 ? (
              <>
                La clarté a fléchi de <strong className="text-rose-600">{clarityProgress} points</strong>. Assurez-vous d'utiliser un rôle fort et des balises claires pour formuler vos consignes.
              </>
            ) : (
              <>
                Votre clarté reste stable à <strong className="text-indigo-600">{latestAttempt.clarityScore ?? latestAttempt.score}%</strong>. Tentez d'utiliser des balises XML d'isolation si nécessaire.
              </>
            )}
          </p>
        </div>

        {/* Conciseness progress summary card */}
        <div className="bg-purple-50/20 border border-purple-100 rounded-xl p-3.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-purple-900 font-bold">
            <Award className="w-3.5 h-3.5 text-purple-500" />
            <span>Analyse Concision</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {concisenessProgress > 0 ? (
              <>
                Votre concision a augmenté de <strong className="text-purple-600">+{concisenessProgress} points</strong> ! Vos invites évitent les mots superflus pour aller droit au but.
              </>
            ) : concisenessProgress < 0 ? (
              <>
                La concision a diminué de <strong className="text-rose-600">{concisenessProgress} points</strong>. Essayez de supprimer les phrases d'introduction inutiles ou redondantes.
              </>
            ) : (
              <>
                Votre concision est stable à <strong className="text-purple-600">{latestAttempt.concisenessScore ?? latestAttempt.score}%</strong>. Comparez avec la version optimale suggérée ci-dessous.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
