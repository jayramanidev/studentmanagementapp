"use client";

import * as React from "react";
import { useState, useTransition, useMemo } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  getAttendanceSheetAction,
  saveAttendanceSheetAction,
  type AttendanceSheetResponse,
} from "@/actions/attendance";
import { type BatchItem } from "@/actions/batches";
import { AttendanceStatus } from "@prisma/client";
import {
  CalendarCheck,
  Calendar,
  Layers,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Loader2,
  Users,
  Search,
} from "lucide-react";

interface DailyAttendanceSheetProps {
  batches: BatchItem[];
  initialBatchId?: string;
  initialDate?: string;
}

export function DailyAttendanceSheet({
  batches,
  initialBatchId,
  initialDate,
}: DailyAttendanceSheetProps) {
  const [isPending, startTransition] = useTransition();

  const [selectedBatchId, setSelectedBatchId] = useState(
    initialBatchId || batches[0]?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState(
    initialDate || new Date().toISOString().split("T")[0]
  );
  const [search, setSearch] = useState("");

  const [sheetData, setSheetData] = useState<AttendanceSheetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Editable Student Attendance Map: studentUserId -> { status, remarks }
  const [attendanceMap, setAttendanceMap] = useState<
    Map<string, { status: AttendanceStatus; remarks: string }>
  >(new Map());

  // Fetch Attendance Register on Batch or Date change
  const loadRegister = React.useCallback(
    async (batchId: string, date: string) => {
      if (!batchId || !date) return;
      setIsLoading(true);
      const res = await getAttendanceSheetAction(batchId, date);
      setIsLoading(false);

      if (res.success) {
        setSheetData(res.data);
        const map = new Map<string, { status: AttendanceStatus; remarks: string }>();
        for (const s of res.data.students) {
          map.set(s.studentUserId, {
            status: s.status,
            remarks: "",
          });
        }
        setAttendanceMap(map);
      } else {
        toast.error(res.error || "Failed to load attendance register");
      }
    },
    []
  );

  React.useEffect(() => {
    if (selectedBatchId && selectedDate) {
      loadRegister(selectedBatchId, selectedDate);
    }
  }, [selectedBatchId, selectedDate, loadRegister]);

  // Handle Single Student Status Change
  const setStudentStatus = (studentUserId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => {
      const next = new Map(prev);
      const cur = next.get(studentUserId) ?? { status: AttendanceStatus.PRESENT, remarks: "" };
      next.set(studentUserId, { ...cur, status });
      return next;
    });
  };

  // Handle Remarks Change
  const setStudentRemarks = (studentUserId: string, remarks: string) => {
    setAttendanceMap((prev) => {
      const next = new Map(prev);
      const cur = next.get(studentUserId) ?? { status: AttendanceStatus.PRESENT, remarks: "" };
      next.set(studentUserId, { ...cur, remarks });
      return next;
    });
  };

  // Quick Action: Mark All Present
  const handleMarkAll = (status: AttendanceStatus) => {
    if (!sheetData) return;
    setAttendanceMap((prev) => {
      const next = new Map(prev);
      for (const s of sheetData.students) {
        const cur = next.get(s.studentUserId) ?? { status, remarks: "" };
        next.set(s.studentUserId, { ...cur, status });
      }
      return next;
    });
    toast.info(`All students marked ${status.toLowerCase()}`);
  };

  // Live KPI Calculations
  const liveStats = useMemo(() => {
    if (!sheetData) {
      return { total: 0, present: 0, absent: 0, late: 0, pct: 0 };
    }
    let present = 0;
    let absent = 0;
    let late = 0;

    for (const [_, val] of attendanceMap.entries()) {
      if (val.status === AttendanceStatus.PRESENT) present++;
      else if (val.status === AttendanceStatus.ABSENT) absent++;
      else if (val.status === AttendanceStatus.LATE) late++;
    }

    const total = attendanceMap.size;
    const effectivePresent = present + late * 0.5;
    const pct = total > 0 ? Number(((effectivePresent / total) * 100).toFixed(1)) : 100;

    return { total, present, absent, late, pct };
  }, [attendanceMap, sheetData]);

  // Save Attendance Register
  const handleSave = () => {
    if (!sheetData || !selectedBatchId) return;

    startTransition(async () => {
      const entries = Array.from(attendanceMap.entries()).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        remarks: data.remarks.trim() || undefined,
      }));

      const res = await saveAttendanceSheetAction(selectedBatchId, selectedDate, entries);

      if (res.success) {
        toast.success(`Attendance saved for ${sheetData.students.length} students!`);
        loadRegister(selectedBatchId, selectedDate);
      } else {
        toast.error(res.error || "Failed to save attendance");
      }
    });
  };

  const filteredStudents = useMemo(() => {
    if (!sheetData) return [];
    if (!search.trim()) return sheetData.students;
    const q = search.toLowerCase().trim();
    return sheetData.students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q)
    );
  }, [sheetData, search]);

  return (
    <div className="space-y-6">
      {/* Batch & Date Picker Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3" /> Select Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30 font-medium"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.targetExam})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Attendance Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || isLoading || !sheetData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 gap-1.5 shadow-xs"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Attendance
          </Button>
        </div>
      </div>

      {/* Live Attendance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="shadow-xs p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Enrolled Students</span>
          <div className="text-xl font-bold text-foreground mt-0.5">{liveStats.total}</div>
        </Card>
        <Card className="shadow-xs p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Present</span>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{liveStats.present}</div>
        </Card>
        <Card className="shadow-xs p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Absent</span>
          <div className="text-xl font-bold text-rose-600 mt-0.5">{liveStats.absent}</div>
        </Card>
        <Card className="shadow-xs p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Late</span>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{liveStats.late}</div>
        </Card>
        <Card className="shadow-xs p-3 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-muted-foreground">Attendance Rate</span>
          <div className="text-xl font-bold text-indigo-600 mt-0.5">{liveStats.pct}%</div>
        </Card>
      </div>

      {/* Quick Mark Toolbar & Student Search */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <div className="p-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search student or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <span className="text-xs text-muted-foreground font-medium mr-1">Quick Fill:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}
              disabled={isLoading || !sheetData}
              className="h-7 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 border-emerald-200"
            >
              All Present
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}
              disabled={isLoading || !sheetData}
              className="h-7 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 border-rose-200"
            >
              All Absent
            </Button>
          </div>
        </div>

        {/* Student Register Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[60px] text-xs font-semibold">#</TableHead>
              <TableHead className="w-[130px] text-xs font-semibold">Roll No</TableHead>
              <TableHead className="text-xs font-semibold">Student Name</TableHead>
              <TableHead className="w-[280px] text-center text-xs font-semibold">Attendance Status</TableHead>
              <TableHead className="text-xs font-semibold">Remarks (Optional)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-36 text-center text-muted-foreground text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span>Loading class register...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                  No students found in this batch.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student, idx) => {
                const cur = attendanceMap.get(student.studentUserId) ?? {
                  status: AttendanceStatus.PRESENT,
                  remarks: "",
                };

                const initials = student.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <TableRow
                    key={student.studentUserId}
                    className={`transition ${
                      cur.status === AttendanceStatus.ABSENT
                        ? "bg-rose-50/50 dark:bg-rose-950/20"
                        : cur.status === AttendanceStatus.LATE
                        ? "bg-amber-50/50 dark:bg-amber-950/20"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    {/* Index */}
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>

                    {/* Roll No */}
                    <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {student.rollNumber}
                    </TableCell>

                    {/* Student Name */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 text-[10px] font-bold bg-slate-200 dark:bg-slate-800">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-semibold text-sm block leading-none">
                            {student.studentName}
                          </span>
                          {student.phone && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {student.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* 3-State Radio Chips */}
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Present Chip */}
                        <button
                          type="button"
                          onClick={() =>
                            setStudentStatus(student.studentUserId, AttendanceStatus.PRESENT)
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                            cur.status === AttendanceStatus.PRESENT
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Present
                        </button>

                        {/* Late Chip */}
                        <button
                          type="button"
                          onClick={() =>
                            setStudentStatus(student.studentUserId, AttendanceStatus.LATE)
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                            cur.status === AttendanceStatus.LATE
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" /> Late
                        </button>

                        {/* Absent Chip */}
                        <button
                          type="button"
                          onClick={() =>
                            setStudentStatus(student.studentUserId, AttendanceStatus.ABSENT)
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                            cur.status === AttendanceStatus.ABSENT
                              ? "bg-rose-600 text-white shadow-xs"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Absent
                        </button>
                      </div>
                    </TableCell>

                    {/* Remarks Input */}
                    <TableCell>
                      <Input
                        placeholder="e.g. Leave note received"
                        value={cur.remarks}
                        onChange={(e) =>
                          setStudentRemarks(student.studentUserId, e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="p-3 border-t bg-muted/10 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Make sure to click <strong>Save Attendance</strong> to record today's register.
          </span>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending || isLoading || !sheetData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 shadow-xs"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Attendance Register
          </Button>
        </div>
      </div>
    </div>
  );
}
