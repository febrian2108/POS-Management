"use client";

import { useMemo, useState } from "react";

import { BranchSalesChart } from "@/components/admin/branch-sales-chart";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils";

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
  itemCount: number;
};

type DateFilter = "all" | "today" | "7d" | "30d" | "custom";

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
          transactionCount: 0
        }
      ])
    );

    for (const sale of filteredSales) {
      const summary = map.get(sale.branchId);
      if (!summary) continue;
      summary.totalAmount += sale.totalAmount;
      summary.transactionCount += 1;
    }

    return [...map.values()].sort((a, b) => b.totalAmount - a.totalAmount);
  }, [branches, filteredSales]);

  const totalAmount = useMemo(
    () => filteredSales.reduce((acc, row) => acc + row.totalAmount, 0),
    [filteredSales]
  );

  const totalItems = useMemo(
    () => filteredSales.reduce((acc, row) => acc + row.itemCount, 0),
    [filteredSales]
  );

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
      </Card>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Grafik Penjualan Cabang</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Ringkasan cabang tetap tampil walaupun belum ada transaksi.
        </p>
        <div className="mt-4">
          <BranchSalesChart data={summaryRows} />
        </div>
      </Card>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Ringkasan Per Cabang</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Diurutkan dari total penjualan terbanyak.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {summaryRows.map((summary) => (
            <div
              key={summary.branchId}
              className="rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3"
            >
              <p className="text-sm text-[var(--muted)]">{summary.branchName}</p>
              <p className="text-lg font-semibold">{formatRupiah(summary.totalAmount)}</p>
              <p className="text-xs text-[var(--muted)]">{summary.transactionCount} transaksi</p>
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
          <p className="text-sm text-[var(--muted)]">Jumlah Transaksi</p>
          <p className="mt-1 text-2xl font-semibold">{filteredSales.length}</p>
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
