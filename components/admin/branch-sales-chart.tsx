"use client";

import { useMemo, useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type TooltipItem
} from "chart.js";
import { Bar } from "react-chartjs-2";

import { formatRupiah } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type BranchSeries = {
  branchId: string;
  branchName: string;
  totalAmount: number;
  transactionCount: number;
};

export function BranchSalesChart({ data }: { data: BranchSeries[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(data.map((item) => item.branchId));

  const filtered = useMemo(
    () => data.filter((item) => selectedIds.includes(item.branchId)),
    [data, selectedIds]
  );

  const chartData = useMemo(
    () => ({
      labels: filtered.map((item) => item.branchName),
      datasets: [
        {
          label: "Total Penjualan",
          data: filtered.map((item) => item.totalAmount),
          borderRadius: 10,
          backgroundColor: "rgba(44, 108, 128, 0.78)",
          borderColor: "rgba(31, 79, 99, 1)",
          borderWidth: 1.2
        }
      ]
    }),
    [filtered]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<"bar">) => formatRupiah(Number(ctx.parsed.y ?? 0))
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

  function toggleBranch(branchId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(branchId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== branchId);
      }
      return [...prev, branchId];
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => {
          const checked = selectedIds.includes(item.branchId);
          return (
            <label
              key={item.branchId}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 py-2 text-sm"
            >
              <span>{item.branchName}</span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleBranch(item.branchId)}
                className="h-4 w-4"
              />
            </label>
          );
        })}
      </div>

      <div className="h-[320px] rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
