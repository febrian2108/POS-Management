"use client";

import { useMemo, useState } from "react";
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

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type BranchOption = {
  id: string;
  name: string;
};

type WorkerOption = {
  id: string;
  fullName: string;
};

type SaleRow = {
  id: string;
  createdAt: string;
  branchId: string;
  branchName: string;
  workerId: string;
  workerName: string;
  totalAmount: number;
  profitAmount: number;
  itemCount: number;
};

type DateFilter = "all" | "today" | "7d" | "30d" | "custom";
type ChartMode = "daily" | "weekly" | "monthly" | "yearly";

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

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function weekStart(date: Date) {
  const value = startOfDay(date);
  const mondayOffset = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - mondayOffset);
  return value;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function yearKey(date: Date) {
  return String(date.getFullYear());
}

export function SalesAnalyticsPanel({
  sales,
  branches,
  workers
}: {
  sales: SaleRow[];
  branches: BranchOption[];
  workers: WorkerOption[];
}) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [workerId, setWorkerId] = useState("all");
  const [chartMode, setChartMode] = useState<ChartMode>("daily");

  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const day7Start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
    const day30Start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
    const customStart = dateFrom ? startOfDay(new Date(dateFrom)) : null;
    const customEnd = dateTo ? endOfDay(new Date(dateTo)) : null;

    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);

      if (dateFilter === "today" && saleDate < todayStart) return false;
      if (dateFilter === "7d" && saleDate < day7Start) return false;
      if (dateFilter === "30d" && saleDate < day30Start) return false;
      if (dateFilter === "custom") {
        if (customStart && saleDate < customStart) return false;
        if (customEnd && saleDate > customEnd) return false;
      }

      if (branchId !== "all" && sale.branchId !== branchId) return false;
      if (workerId !== "all" && sale.workerId !== workerId) return false;

      return true;
    });
  }, [sales, dateFilter, dateFrom, dateTo, branchId, workerId]);

  const summaryRows = useMemo(() => {
    const map = new Map(
      branches.map((branch) => [
        branch.id,
        {
          branchId: branch.id,
          branchName: branch.name,
          totalAmount: 0,
          totalProfit: 0,
          transactionCount: 0
        }
      ])
    );

    for (const sale of filteredSales) {
      const summary = map.get(sale.branchId);
      if (!summary) continue;
      summary.totalAmount += sale.totalAmount;
      summary.totalProfit += sale.profitAmount;
      summary.transactionCount += 1;
    }

    return [...map.values()].sort((a, b) => b.totalAmount - a.totalAmount);
  }, [branches, filteredSales]);

  const totalAmount = useMemo(
    () => filteredSales.reduce((acc, row) => acc + row.totalAmount, 0),
    [filteredSales]
  );

  const totalProfit = useMemo(
    () => filteredSales.reduce((acc, row) => acc + row.profitAmount, 0),
    [filteredSales]
  );

  const totalItems = useMemo(
    () => filteredSales.reduce((acc, row) => acc + row.itemCount, 0),
    [filteredSales]
  );

  const chartTrend = useMemo(() => {
    const now = new Date();
    const branchDataMap = new Map(
      branches.map((branch) => [branch.id, [] as number[]])
    );
    const labels: string[] = [];
    const keys: string[] = [];

    if (chartMode === "daily") {
      const formatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" });
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
      for (let i = 0; i < 30; i += 1) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        keys.push(dateKey(d));
        labels.push(formatter.format(d));
      }
    }

    if (chartMode === "weekly") {
      const formatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" });
      const start = weekStart(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 77));
      for (let i = 0; i < 12; i += 1) {
        const d = new Date(start);
        d.setDate(start.getDate() + i * 7);
        keys.push(dateKey(d));
        labels.push(`Minggu ${formatter.format(d)}`);
      }
    }

    if (chartMode === "monthly") {
      const formatter = new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" });
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      for (let i = 0; i < 12; i += 1) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        keys.push(monthKey(d));
        labels.push(formatter.format(d));
      }
    }

    if (chartMode === "yearly") {
      const startYear = now.getFullYear() - 5;
      for (let i = 0; i < 6; i += 1) {
        const year = startYear + i;
        keys.push(String(year));
        labels.push(String(year));
      }
    }

    for (const values of branchDataMap.values()) {
      values.push(...new Array<number>(keys.length).fill(0));
    }

    const keyIndexMap = new Map(keys.map((key, index) => [key, index]));

    for (const sale of filteredSales) {
      const saleDate = new Date(sale.createdAt);

      let key = "";
      if (chartMode === "daily") key = dateKey(startOfDay(saleDate));
      if (chartMode === "weekly") key = dateKey(weekStart(saleDate));
      if (chartMode === "monthly") key = monthKey(saleDate);
      if (chartMode === "yearly") key = yearKey(saleDate);

      const index = keyIndexMap.get(key);
      const branchValues = branchDataMap.get(sale.branchId);
      if (index === undefined || !branchValues) continue;

      branchValues[index] += sale.profitAmount;
    }

    return {
      labels,
      series: branches.map((branch) => ({
        branchId: branch.id,
        branchName: branch.name,
        data: branchDataMap.get(branch.id) ?? new Array<number>(labels.length).fill(0)
      }))
    };
  }, [branches, filteredSales, chartMode]);

  const chartData = useMemo(
    () => ({
      labels: chartTrend.labels,
      datasets: chartTrend.series.map((series, idx) => {
        const color = LINE_COLORS[idx % LINE_COLORS.length];
        return {
          label: series.branchName,
          data: series.data,
          borderColor: color,
          backgroundColor: `${color}22`,
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 2.5,
          pointHoverRadius: 4
        };
      })
    }),
    [chartTrend]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
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

  function downloadRecapCsv() {
    const header = [
      "waktu",
      "cabang",
      "worker",
      "total_penjualan",
      "total_keuntungan",
      "jumlah_item"
    ];

    const rows = filteredSales.map((sale) => [
      new Date(sale.createdAt).toLocaleString("id-ID"),
      sale.branchName,
      sale.workerName,
      sale.totalAmount,
      sale.profitAmount,
      sale.itemCount
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-penjualan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const topBranch = summaryRows[0];

  return (
    <div className="space-y-6">
      <Card className="animate-fade-in">
        <h2 className="font-semibold">Filter Penjualan</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          <div>
            <p className="mb-1 text-sm text-[var(--muted)]">Waktu</p>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="custom">Rentang Tanggal</option>
            </select>
          </div>

          <div>
            <p className="mb-1 text-sm text-[var(--muted)]">Dari Tanggal</p>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={dateFilter !== "custom"}
            />
          </div>

          <div>
            <p className="mb-1 text-sm text-[var(--muted)]">Sampai Tanggal</p>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={dateFilter !== "custom"}
            />
          </div>

          <div>
            <p className="mb-1 text-sm text-[var(--muted)]">Cabang</p>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
            >
              <option value="all">Semua Cabang</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-sm text-[var(--muted)]">Worker</p>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
            >
              <option value="all">Semua Worker</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <Button variant="outline" onClick={downloadRecapCsv}>
            Download Rekap (CSV)
          </Button>
        </div>
      </Card>

      <Card className="animate-fade-in">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Grafik Garis Keuntungan Penjualan per Cabang</h2>
          <select
            value={chartMode}
            onChange={(e) => setChartMode(e.target.value as ChartMode)}
            className="h-9 rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
          >
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="yearly">Tahunan</option>
          </select>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Menampilkan total keuntungan per cabang berdasarkan mode periode yang dipilih.
        </p>
        <div className="mt-4 h-[340px] rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3">
          <Line data={chartData} options={chartOptions} />
        </div>
      </Card>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Ringkasan Per Cabang</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Diurutkan dari total penjualan terbanyak. Cabang tanpa transaksi tetap ditampilkan.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {summaryRows.map((summary) => (
            <div
              key={summary.branchId}
              className="rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3"
            >
              <p className="text-sm text-[var(--muted)]">{summary.branchName}</p>
              <p className="text-lg font-semibold">{formatRupiah(summary.totalAmount)}</p>
              <p className="text-xs text-[var(--muted)]">
                Profit: {formatRupiah(summary.totalProfit)} | {summary.transactionCount} transaksi
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Total Penjualan (Filter Aktif)</p>
          <p className="mt-1 text-2xl font-semibold">{formatRupiah(totalAmount)}</p>
        </Card>
        <Card className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Total Keuntungan (Filter Aktif)</p>
          <p className="mt-1 text-2xl font-semibold">{formatRupiah(totalProfit)}</p>
        </Card>
        <Card className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Cabang Teratas</p>
          <p className="mt-1 text-base font-semibold">{topBranch?.branchName ?? "-"}</p>
          <p className="text-xs text-[var(--muted)]">
            {topBranch ? formatRupiah(topBranch.totalAmount) : formatRupiah(0)} | {totalItems} item terjual
          </p>
        </Card>
      </div>

      <Card className="animate-fade-in">
        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Waktu</TH>
                <TH>Cabang</TH>
                <TH>Worker</TH>
                <TH>Total</TH>
                <TH>Profit</TH>
                <TH>Item</TH>
              </TR>
            </THead>
            <TBody>
              {filteredSales.map((sale) => (
                <TR key={sale.id}>
                  <TD>{new Date(sale.createdAt).toLocaleString("id-ID")}</TD>
                  <TD>{sale.branchName}</TD>
                  <TD>{sale.workerName}</TD>
                  <TD>{formatRupiah(sale.totalAmount)}</TD>
                  <TD>{formatRupiah(sale.profitAmount)}</TD>
                  <TD>{sale.itemCount}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
