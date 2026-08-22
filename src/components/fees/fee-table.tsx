"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { type FeePaymentListItem } from "@/actions/fees";
import { type BatchItem } from "@/actions/batches";
import {
  Search,
  Receipt,
  Download,
  Printer,
  Layers,
  IndianRupee,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

interface FeeTableProps {
  records: FeePaymentListItem[];
  batches: BatchItem[];
}

export function FeeTable({ records, batches }: FeeTableProps) {
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [selectedMode, setSelectedMode] = useState("ALL");

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (selectedBatch !== "ALL" && r.batch.id !== selectedBatch) return false;
      if (selectedMode !== "ALL" && r.paymentMode !== selectedMode) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        r.receiptNumber.toLowerCase().includes(q) ||
        r.student.fullName.toLowerCase().includes(q) ||
        (r.student.studentProfile?.rollNumber &&
          r.student.studentProfile.rollNumber.toLowerCase().includes(q)) ||
        (r.transactionRef && r.transactionRef.toLowerCase().includes(q))
      );
    });
  }, [records, search, selectedBatch, selectedMode]);

  // Aggregate Metrics
  const totalCollections = useMemo(() => {
    return records.reduce((sum, r) => sum + r.amountPaid, 0);
  }, [records]);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-xs p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Total Fee Collections</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{totalCollections.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground">Across all batches</span>
        </Card>

        <Card className="shadow-xs p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Receipts Issued</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {records.length}
          </div>
          <span className="text-[10px] text-muted-foreground">Official payment vouchers</span>
        </Card>

        <Card className="shadow-xs p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Average Installment</span>
          <div className="text-2xl font-bold text-foreground mt-1">
            ₹{records.length > 0 ? Math.round(totalCollections / records.length).toLocaleString("en-IN") : 0}
          </div>
          <span className="text-[10px] text-muted-foreground">Per payment receipt</span>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search receipt #, student name, roll number, txn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
          >
            <option value="ALL">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="NET_BANKING">Net Banking</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
      </div>

      {/* Fee Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold">Receipt #</TableHead>
              <TableHead className="text-xs font-semibold">Student & Roll No</TableHead>
              <TableHead className="text-xs font-semibold">Batch</TableHead>
              <TableHead className="text-xs font-semibold">Amount Paid</TableHead>
              <TableHead className="text-xs font-semibold">Payment Mode</TableHead>
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-right text-xs font-semibold">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                  No fee payment records found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const dateStr = new Date(r.paymentDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <TableRow key={r.id} className="hover:bg-muted/20 transition">
                    {/* Receipt Number */}
                    <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {r.receiptNumber}
                    </TableCell>

                    {/* Student */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-sm">{r.student.fullName}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {r.student.studentProfile?.rollNumber ?? "N/A"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Batch */}
                    <TableCell className="text-xs text-muted-foreground">
                      {r.batch.name}
                    </TableCell>

                    {/* Amount Paid */}
                    <TableCell>
                      <div className="text-xs">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ₹{r.amountPaid.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Installment #{r.installmentNo} (of ₹{r.totalCourseFee.toLocaleString("en-IN")})
                        </span>
                      </div>
                    </TableCell>

                    {/* Mode */}
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {r.paymentMode}
                      </Badge>
                      {r.transactionRef && (
                        <span className="text-[10px] text-muted-foreground block font-mono truncate max-w-[100px]">
                          {r.transactionRef}
                        </span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {dateStr}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <a
                        href={`/api/export/receipt/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-indigo-600 hover:text-indigo-700"
                        >
                          <Printer className="h-3 w-3" /> Print
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
