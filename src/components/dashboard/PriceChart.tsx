"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { clsx } from "clsx";
import { useTokenomics } from "@/lib/hooks/useTokenomics";

interface PricePoint {
  timestamp: number;
  price: number;
}

// Deterministic mock price data to avoid hydration mismatch
const generateMockPriceData = (): PricePoint[] => {
  const data: PricePoint[] = [];
  const basePrice = 0.0245;
  // Use a fixed seed-like approach instead of random
  const variations = [
    0.0012, -0.0008, 0.0015, -0.0003, 0.0009, -0.0011, 0.0007, -0.0005,
    0.0013, -0.0009, 0.0011, -0.0006, 0.0008, -0.0012, 0.0014, -0.0004,
    0.0010, -0.0007, 0.0006, -0.0010, 0.0012, -0.0008, 0.0009, -0.0003,
    0.0015, -0.0005, 0.0011, -0.0009, 0.0013, -0.0006, 0.0016
  ];
  
  for (let i = 30; i >= 0; i--) {
    const variation = variations[30 - i] || 0;
    data.push({
      timestamp: i,
      price: basePrice + variation + (30 - i) * 0.0001,
    });
  }
  
  return data;
};

// Static initial data to ensure SSR/client match
const initialPriceData = generateMockPriceData();

export function PriceChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priceData] = useState<PricePoint[]>(initialPriceData);
  const [timeframe, setTimeframe] = useState<"24H" | "7D" | "30D" | "1Y">("30D");
  const [isClient, setIsClient] = useState(false);
  
  // Fetch real tokenomics data
  const { totalSupply, circulatingSupply, isLoading: supplyLoading } = useTokenomics({
    refreshInterval: 300000, // 5 minutes
  });

  // Mark when we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentPrice = priceData[priceData.length - 1]?.price || 0;
  const previousPrice = priceData[0]?.price || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice !== 0 ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  useEffect(() => {
    if (!isClient) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate bounds
    const prices = priceData.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // Draw grid lines
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      // Draw price labels
      const price = maxPrice - (priceRange / 4) * i;
      ctx.fillStyle = "#6b7280";
      ctx.font = "11px Montserrat, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`$${price.toFixed(4)}`, padding.left - 8, y + 4);
    }

    // Draw line chart
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, isPositive ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    // Draw filled area
    ctx.beginPath();
    priceData.forEach((point, index) => {
      const x = padding.left + (chartWidth / (priceData.length - 1)) * index;
      const y = padding.top + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Complete the fill area
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    priceData.forEach((point, index) => {
      const x = padding.left + (chartWidth / (priceData.length - 1)) * index;
      const y = padding.top + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = isPositive ? "#10b981" : "#ef4444";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw current price dot
    const lastPoint = priceData[priceData.length - 1];
    const lastX = padding.left + chartWidth;
    const lastY = padding.top + chartHeight - ((lastPoint.price - minPrice) / priceRange) * chartHeight;

    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = isPositive ? "#10b981" : "#ef4444";
    ctx.fill();

    // Glow effect
    ctx.beginPath();
    ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
    ctx.fillStyle = isPositive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)";
    ctx.fill();
  }, [priceData, isPositive, isClient]);

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">SEL Price</h2>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground">
              ${currentPrice.toFixed(4)}
            </span>
            <span
              className={clsx(
                "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
                isPositive
                  ? "bg-accent-green/10 text-accent-green"
                  : "bg-accent-red/10 text-accent-red"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {(["24H", "7D", "30D", "1Y"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                timeframe === tf
                  ? "bg-selendra-500/20 text-selendra-400"
                  : "text-foreground-secondary hover:text-foreground hover:bg-background-hover"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-48">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div>
          <span className="text-xs text-foreground-secondary">Market Cap</span>
          <p className="text-sm font-medium text-foreground">$24.5M</p>
        </div>
        <div>
          <span className="text-xs text-foreground-secondary">24h Volume</span>
          <p className="text-sm font-medium text-foreground">$1.2M</p>
        </div>
        <div>
          <span className="text-xs text-foreground-secondary">Circulating Supply</span>
          <p className="text-sm font-medium text-foreground">
            {supplyLoading ? "..." : `${circulatingSupply} SEL`}
          </p>
        </div>
        <div>
          <span className="text-xs text-foreground-secondary">Total Supply</span>
          <p className="text-sm font-medium text-foreground">
            {supplyLoading ? "..." : `${totalSupply} SEL`}
          </p>
        </div>
      </div>
    </div>
  );
}
