"use client";

import * as React from "react";
import { useState, useTransition, useRef, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  X,
} from "lucide-react";

interface CSVRow {
  rollNumber: string;
  marksObtained: string;
  isAbsent: boolean;
  error?: string;
}

interface CSVMarkImportProps {
  testId: string;
  students: Array<{ rollNumber: string; fullName: string; userId: string }>;
  onImport: (
    rows: Array<{ rollNumber: string; marksObtained: number | null; isAbsent: boolean }>
  ) => Promise<{ success: boolean; error?: string; count?: number }>;
}

export function CSVMarkImport({ testId, students, onImport }: CSVMarkImportProps) {
  const [isPending, startTransition] = useTransition();
  const [parsedRows, setParsedRows] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const rollMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      map.set(s.rollNumber.toLowerCase().trim(), s.fullName);
    }
    return map;
  }, [students]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      toast.error("CSV must have a header row and at least one data row.");
      return;
    }

    // Skip header
    const dataLines = lines.slice(1);
    const rows: CSVRow[] = [];

    for (const line of dataLines) {
      const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      if (parts.length < 2) continue;

      const rollNumber = parts[0];
      const marksStr = parts[1];
      const absentFlag = parts[2]?.toLowerCase?.() ?? "";

      const isAbsent =
        absentFlag === "yes" ||
        absentFlag === "true" ||
        absentFlag === "1" ||
        absentFlag === "absent" ||
        marksStr.toLowerCase() === "absent" ||
        marksStr === "AB";

      let error: string | undefined;

      if (!rollMap.has(rollNumber.toLowerCase().trim())) {
        error = `Roll "${rollNumber}" not found in batch`;
      } else if (!isAbsent && isNaN(parseFloat(marksStr))) {
        error = `Invalid marks value: "${marksStr}"`;
      }

      rows.push({
        rollNumber,
        marksObtained: isAbsent ? "ABSENT" : marksStr,
        isAbsent,
        error,
      });
    }

    setParsedRows(rows);
  };

  const errorCount = parsedRows.filter((r) => r.error).length;
  const validCount = parsedRows.filter((r) => !r.error).length;

  const handleConfirmImport = () => {
    const validRows = parsedRows
      .filter((r) => !r.error)
      .map((r) => ({
        rollNumber: r.rollNumber,
        marksObtained: r.isAbsent ? null : parseFloat(r.marksObtained),
        isAbsent: r.isAbsent,
      }));

    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }

    startTransition(async () => {
      const res = await onImport(validRows);
      if (res.success) {
        toast.success(`Imported ${res.count ?? validRows.length} mark entries!`);
        setParsedRows([]);
        setFileName(null);
      } else {
        toast.error(res.error ?? "Import failed.");
      }
    });
  };

  const downloadTemplate = () => {
    const header = "roll_number,marks_obtained,is_absent";
    const rows = students.map(
      (s) => `${s.rollNumber},,`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marks_template_${testId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearImport = () => {
    setParsedRows([]);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
          OMR / Excel CSV Score Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {parsedRows.length === 0 ? (
          /* Upload Zone */
          <div className="space-y-3">
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition cursor-pointer"
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">
                Drop CSV file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Columns: <code className="text-indigo-600">roll_number, marks_obtained, is_absent</code>
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="w-full text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV Template ({students.length} students pre-filled)
            </Button>
          </div>
        ) : (
          /* Preview Table */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  📄 {fileName}
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                  {validCount} valid
                </Badge>
                {errorCount > 0 && (
                  <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px]">
                    {errorCount} errors
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearImport}
                className="h-7 text-xs gap-1 text-muted-foreground"
              >
                <X className="h-3 w-3" /> Clear
              </Button>
            </div>

            <div className="rounded-xl border overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Roll No.</TableHead>
                    <TableHead className="text-xs font-semibold">Student Name</TableHead>
                    <TableHead className="text-xs font-semibold">Marks</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, idx) => {
                    const studentName = rollMap.get(row.rollNumber.toLowerCase().trim());
                    return (
                      <TableRow
                        key={idx}
                        className={row.error ? "bg-rose-50/50 dark:bg-rose-950/10" : ""}
                      >
                        <TableCell className="text-xs font-mono">{row.rollNumber}</TableCell>
                        <TableCell className="text-xs">
                          {studentName ?? (
                            <span className="text-rose-600 italic">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {row.isAbsent ? (
                            <span className="text-amber-600">ABSENT</span>
                          ) : (
                            row.marksObtained
                          )}
                        </TableCell>
                        <TableCell>
                          {row.error ? (
                            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[9px] gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {row.error}
                            </Badge>
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Button
              onClick={handleConfirmImport}
              disabled={isPending || validCount === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Confirm Import — {validCount} Students
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
