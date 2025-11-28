"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";
import { clsx } from "clsx";

interface TxDataPoint {
  date: string;
  substrate: number;
  evm: number;
}

// Deterministic mock transaction history data to avoid hydration mismatch
const mockTxData: TxDataPoint[] = [
  { date: "Nov 13", substrate: 4521, evm: 2134 },
  { date: "Nov 14", substrate: 3892, evm: 1876 },
  { date: "Nov 15", substrate: 5234, evm: 2567 },
  { date: "Nov 16", substrate: 4123, evm: 2234 },
  { date: "Nov 17", substrate: 6012, evm: 3012 },
  { date: "Nov 18", substrate: 5567, evm: 2789 },
  { date: "Nov 19", substrate: 4789, evm: 2456 },
  { date: "Nov 20", substrate: 3456, evm: 1678 },
  { date: "Nov 21", substrate: 4234, evm: 2123 },
  { date: "Nov 22", substrate: 5678, evm: 2890 },
  { date: "Nov 23", substrate: 6234, evm: 3234 },
  { date: "Nov 24", substrate: 5123, evm: 2567 },
  { date: "Nov 25", substrate: 4567, evm: 2345 },
  { date: "Nov 26", substrate: 5890, evm: 2901 },
  { date: "Nov 27", substrate: 4345, evm: 2123 },
];

export function TransactionHistory() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [txData] = useState<TxDataPoint[]>(mockTxData);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const totalSubstrate = txData.reduce((acc, d) => acc + d.substrate, 0);
  const totalEvm = txData.reduce((acc, d) => acc + d.evm, 0);
  const averageDaily = Math.floor((totalSubstrate + totalEvm) / txData.length);

  useEffect(() => {
    if (!isClient) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    const maxValue = Math.max(...txData.map((d) => d.substrate + d.evm));
    const barWidth = (chartWidth / txData.length) * 0.7;
    const barGap = (chartWidth / txData.length) * 0.3;

    // Draw grid lines
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      const value = maxValue - (maxValue / 4) * i;
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(
        value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString(),
        padding.left - 8,
        y + 4
      );
    }

    // Draw bars
    txData.forEach((data, index) => {
      const x = padding.left + index * (barWidth + barGap) + barGap / 2;
      const substrateHeight = (data.substrate / maxValue) * chartHeight;
      const evmHeight = (data.evm / maxValue) * chartHeight;

      // Substrate bar (bottom)
      const substrateY = padding.top + chartHeight - substrateHeight;
      ctx.fillStyle = hoveredBar === index ? "#a855f7" : "#8b5cf6";
      ctx.beginPath();
      ctx.roundRect(x, substrateY, barWidth, substrateHeight, [4, 4, 0, 0]);
      ctx.fill();

      // EVM bar (top)
      const evmY = substrateY - evmHeight;
      ctx.fillStyle = hoveredBar === index ? "#fb923c" : "#f97316";
      ctx.beginPath();
      ctx.roundRect(x, evmY, barWidth, evmHeight, [4, 4, 0, 0]);
      ctx.fill();

      // X-axis labels
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(data.date, x + barWidth / 2, padding.top + chartHeight + 20);
    });
  }, [txData, hoveredBar, isClient]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 50, right: 20 };
    const chartWidth = rect.width - padding.left - padding.right;
    const barWidth = (chartWidth / txData.length) * 0.7;
    const barGap = (chartWidth / txData.length) * 0.3;

    const index = Math.floor((x - padding.left) / (barWidth + barGap));
    if (index >= 0 && index < txData.length) {
      setHoveredBar(index);
    } else {
      setHoveredBar(null);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-selendra-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Transaction History (14 Days)
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-purple-500" />
            <span className="text-sm text-foreground-secondary">Substrate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-orange-500" />
            <span className="text-sm text-foreground-secondary">EVM</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-8 mb-4">
        <div>
          <span className="text-xs text-foreground-secondary">Total Transactions</span>
          <p className="text-lg font-semibold text-foreground">
            {(totalSubstrate + totalEvm).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-xs text-foreground-secondary">Substrate Txns</span>
          <p className="text-lg font-semibold text-purple-400">
            {totalSubstrate.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-xs text-foreground-secondary">EVM Txns</span>
          <p className="text-lg font-semibold text-orange-400">
            {totalEvm.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-xs text-foreground-secondary">Avg Daily</span>
          <p className="text-lg font-semibold text-foreground">
            {averageDaily.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ width: "100%", height: "100%" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredBar(null)}
        />

        {/* Tooltip */}
        {hoveredBar !== null && txData[hoveredBar] && (
          <div
            className="absolute pointer-events-none bg-background-card border border-border rounded-lg p-3 shadow-lg z-10"
            style={{
              left: `${(hoveredBar / txData.length) * 100}%`,
              top: "20%",
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-xs text-foreground-secondary mb-1">{txData[hoveredBar].date}</p>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded bg-purple-500" />
              <span className="text-sm text-foreground">
                {txData[hoveredBar].substrate.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded bg-orange-500" />
              <span className="text-sm text-foreground">
                {txData[hoveredBar].evm.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
