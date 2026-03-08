"use client";

import { useMemo } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type TooltipItem
} from "chart.js";
import { Line } from "react-chartjs-2";

import { formatRupiah } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type TrendSeries = {
  branchId: string;
  branchName: string;
  data: number[];
};

type TrendData = {
  labels: string[];
  series: TrendSeries[];
};

const LINE_COLORS = [
  "#1f4f63",
  "#1b6f64",
  "#8c5e26",
  "#7d3f50",
  "#3949ab",
  "#6d4c41",
  "#2a7ea7",
  "#537d2d"
];

export function DashboardBranchLineChart({ trend }: { trend: TrendData }) {
  const hasData = trend.series.some((series) => series.data.some((value) => value > 0));

  const data = useMemo(
    () => ({
      labels: trend.labels,
      datasets: trend.series.map((series, idx) => {
        const color = LINE_COLORS[idx % LINE_COLORS.length];
        return {
          label: series.branchName,
          data: series.data,
          borderColor: color,
          backgroundColor: `${color}33`,
          borderWidth: 2,
          tension: 0.32,
          fill: false,
          pointRadius: 2.5,
          pointHoverRadius: 4
        };
      })
    }),
    [trend]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 650
      },
      plugins: {
        legend: {
          position: "top" as const
        },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<"line">) =>
              `${ctx.dataset.label ?? "Cabang"}: ${formatRupiah(Number(ctx.parsed.y ?? 0))}`
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: string | number) => formatRupiah(Number(value))
          }
        }
      }
    }),
    []
  );

  return (
    <div className="space-y-2">
      {!hasData ? (
        <p className="text-sm text-[var(--muted)]">Belum ada transaksi untuk membentuk grafik garis.</p>
      ) : null}
      <div className="h-[320px] rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
