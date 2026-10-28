"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

const defaultData = [
  { date: "01 Set", value: 1200 },
  { date: "05 Set", value: 2100 },
  { date: "10 Set", value: 1800 },
  { date: "15 Set", value: 3800 },
  { date: "20 Set", value: 2900 },
  { date: "25 Set", value: 4500 },
  { date: "30 Set", value: 4200 },
];

interface InteractiveLineGraphProps {
  customData?: { date: string; value: number }[];
  isCurrency?: boolean;
}

export default function InteractiveLineGraph({ customData, isCurrency = true }: InteractiveLineGraphProps) {
  const chartData = (customData && customData.length >= 2) ? customData : defaultData;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Motor de física para a linha vertical acompanhar o rato de forma fluida
  const mouseX = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 500, damping: 30 });

  const width = 800;
  const height = 250;
  const paddingY = 40;
  const paddingX = 20;

  const rawMax = Math.max(...chartData.map((d) => d.value));
  const maxValue = rawMax > 0 ? rawMax : 100;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i * (width - paddingX * 2)) / (chartData.length - 1);
    const y = height - paddingY - (d.value / maxValue) * (height - paddingY * 2);
    return { ...d, x, y };
  });

  const getSmoothPath = () => {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const xMid = (p0.x + p1.x) / 2;
      d += ` C ${xMid} ${p0.y}, ${xMid} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const getAreaPath = () => {
    if (points.length < 2) return "";
    const smooth = getSmoothPath();
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${smooth} L ${lastPoint.x} ${height - 20} L ${firstPoint.x} ${height - 20} Z`;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    
    // Atualiza a posição exata para a linha vertical
    mouseX.set(clientX);

    const scaleX = width / rect.width;
    const svgMouseX = clientX * scaleX;

    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, i) => {
      const diff = Math.abs(p.x - svgMouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    setHoveredIndex(closestIdx);
  };

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  // Lógica dinâmica para impedir que o Tooltip corte nas extremidades da tela
  const getTooltipOffset = (x: number) => {
    if (x < 60) return 0;          // Se estiver no primeiro ponto, alinha à esquerda
    if (x > width - 60) return -90; // Se estiver no último ponto, alinha à direita
    return -45;                     // Nos pontos centrais, fica centralizado
  };

  return (
    <div 
      className="relative w-full h-52 sm:h-64 select-none cursor-crosshair mt-2"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoveredIndex(null)}
    >
      {/* Container sem overflow-hidden para permitir que o tooltip ultrapasse o limite sem ser cortado */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {activePoint && (
            <>
              {/* Scrubber (Linha Vertical) que segue exatamente o mouse */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ x: springX }}
                className="absolute top-0 bottom-6 w-px bg-primary/40 z-0 origin-left border-r border-dashed border-primary/50"
              />

              {/* Tooltip Animado */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: activePoint.x,
                  y: Math.max(0, activePoint.y - 48)
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute z-20 flex flex-col items-center pointer-events-none"
                style={{ marginLeft: getTooltipOffset(activePoint.x) }}
              >
                <div className="bg-[#18181c] border border-primary/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.6)] whitespace-nowrap flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>
                    {isCurrency 
                      ? `R$ ${activePoint.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : `${activePoint.value.toLocaleString('pt-BR')} ${activePoint.value === 1 ? 'pedido' : 'pedidos'}`}
                  </span>
                  <span className="text-[10px] text-outline font-normal">({activePoint.date})</span>
                </div>
                {/* Triângulo inferior */}
                <div className="w-2 h-2 bg-[#18181c] border-b border-r border-primary/30 rotate-45 -mt-1" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible relative z-10"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradientNeon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a078ff" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#a078ff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#a078ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGlowGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4cd7f6" />
            <stop offset="50%" stopColor="#d0bcff" />
            <stop offset="100%" stopColor="#a078ff" />
          </linearGradient>
          <filter id="neonBlurFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#a078ff" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Linhas de Grade Horizontais */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="0"
            y1={paddingY + (i * (height - paddingY * 2)) / 3}
            x2={width}
            y2={paddingY + (i * (height - paddingY * 2)) / 3}
            stroke="#2e2e33"
            strokeDasharray="4 4"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
        ))}

        {/* Preenchimento de Gradiente */}
        <path
          d={getAreaPath()}
          fill="url(#chartGradientNeon)"
        />

        {/* Linha Spline Neon */}
        <motion.path
          d={getSmoothPath()}
          fill="transparent"
          stroke="url(#lineGlowGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#neonBlurFilter)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {/* Nós nas extremidades e no hover */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === idx ? 6 : (idx === 0 || idx === points.length - 1 ? 4 : 3)}
            fill={hoveredIndex === idx ? "#d0bcff" : "#121317"}
            stroke={hoveredIndex === idx ? "#121317" : "#a078ff"}
            strokeWidth={hoveredIndex === idx ? 2.5 : 2}
            className="transition-all duration-200"
          />
        ))}

        <AnimatePresence>
          {activePoint && (
            <motion.circle
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                cx: activePoint.x,
                cy: activePoint.y
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              r="7"
              fill="#d0bcff"
              stroke="#121317"
              strokeWidth="3"
            />
          )}
        </AnimatePresence>
      </svg>

      <div className="absolute bottom-0 w-full flex justify-between px-5 text-[10px] text-neutral-500 font-medium">
        {chartData.map((d, i) => (
          <span key={i}>{d.date}</span>
        ))}
      </div>
    </div>
  );
}