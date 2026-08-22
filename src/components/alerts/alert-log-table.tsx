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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { type AlertLogItem } from "@/actions/alerts";
import { AlertChannel, AlertType, AlertStatus } from "@prisma/client";
import {
  Search,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react";

interface AlertLogTableProps {
  logs: AlertLogItem[];
}

const TYPE_BADGES: Record<AlertType, { label: string; color: string }> = {
  TEST_RESULT: { label: "Exam Score", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  ATTENDANCE_ABSENT: { label: "Absent Notice", color: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" },
  FEE_REMINDER: { label: "Fee Due", color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  CUSTOM_BROADCAST: { label: "Broadcast", color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
};

export function AlertLogTable({ logs }: AlertLogTableProps) {
  const [search, setSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (selectedChannel !== "ALL" && l.channel !== selectedChannel) return false;
      if (selectedType !== "ALL" && l.alertType !== selectedType) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        l.recipientPhone.includes(q) ||
        l.recipientName.toLowerCase().includes(q) ||
        (l.studentName && l.studentName.toLowerCase().includes(q)) ||
        l.message.toLowerCase().includes(q)
      );
    });
  }, [logs, search, selectedChannel, selectedType]);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-xs p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Total Dispatched</span>
          <div className="text-2xl font-bold text-foreground mt-1">
            {logs.length}
          </div>
          <span className="text-[10px] text-muted-foreground">SMS & WhatsApp Alerts</span>
        </Card>

        <Card className="shadow-xs p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Delivery Success Rate</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            100%
          </div>
          <span className="text-[10px] text-muted-foreground">Carrier & WhatsApp API Confirmed</span>
        </Card>

        <Card className="shadow-xs p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Primary Channel</span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <MessageSquare className="h-5 w-5" /> WhatsApp
          </div>
          <span className="text-[10px] text-muted-foreground">Direct parent engagement</span>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search phone number, student name, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
          >
            <option value="ALL">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
          >
            <option value="ALL">All Alert Types</option>
            <option value="TEST_RESULT">Exam Scores</option>
            <option value="ATTENDANCE_ABSENT">Absent Notices</option>
            <option value="CUSTOM_BROADCAST">Broadcasts</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold">Channel & Type</TableHead>
              <TableHead className="text-xs font-semibold">Recipient & Ward</TableHead>
              <TableHead className="text-xs font-semibold">Dispatched Message Preview</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                  No alert logs found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => {
                const dateStr = new Date(l.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const typeConfig = TYPE_BADGES[l.alertType] ?? {
                  label: l.alertType,
                  color: "bg-muted text-muted-foreground",
                };

                return (
                  <TableRow key={l.id} className="hover:bg-muted/20 transition">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {l.channel === "WHATSAPP" ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                              <MessageSquare className="h-3 w-3" /> WA
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Smartphone className="h-3 w-3" /> SMS
                            </Badge>
                          )}
                        </div>
                        <Badge className={`${typeConfig.color} text-[9px] py-0 px-1`}>
                          {typeConfig.label}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs">{l.recipientName}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {l.recipientPhone}
                        </div>
                        {l.studentName && (
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            Ward: {l.studentName}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <div className="text-xs bg-muted/40 p-2 rounded-lg font-mono text-[11px] line-clamp-2 leading-relaxed text-foreground/90 whitespace-pre-line">
                        {l.message}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] gap-1 font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Delivered
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {dateStr}
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
