"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  bulkImportStudentsAction,
  type BulkStudentRow,
  type BulkImportResult,
} from "@/actions/students";
import { type BatchItem } from "@/actions/batches";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  XCircle,
  Sparkles,
} from "lucide-react";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: BatchItem[];
  onSuccess?: () => void;
}

const SAMPLE_CSV = `Full Name,Roll Number,Phone,Email,Target Exam,Parent Name,Parent Phone,Relationship
Ramesh Solanki,PSI-2026-010,9876543201,ramesh@example.com,PSI,Dinesh Solanki,9876543202,Father
Pooja Varma,PSI-2026-011,9876543203,pooja@example.com,PSI,Sunita Varma,9876543204,Mother
Karan Dave,PSI-2026-012,9876543205,,PSI,Mukesh Dave,9876543206,Father
Sanjay Rathod,PSI-2026-013,9876543207,sanjay@example.com,PSI,,,`;

export function BulkImportModal({
  isOpen,
  onClose,
  batches,
  onSuccess,
}: BulkImportModalProps) {
  const [isPending, startTransition] = useTransition();

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [rawCsvText, setRawCsvText] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<BulkStudentRow[]>([]);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "preview" | "result">("input");

  React.useEffect(() => {
    if (isOpen) {
      if (batches.length > 0 && !selectedBatchId) {
        setSelectedBatchId(batches[0].id);
      }
      setImportResult(null);
      setActiveTab("input");
    }
  }, [isOpen, batches, selectedBatchId]);

  // Parse CSV string into structured rows
  const parseCSV = (csvText: string): BulkStudentRow[] => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return [];

    // Header index mapping (handles varying column order)
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(",").map((h) => h.trim().replace(/["']/g, ""));

    const findCol = (keys: string[]) =>
      headers.findIndex((h) => keys.some((k) => h.includes(k)));

    const nameIdx = findCol(["full name", "fullname", "name", "student name"]);
    const rollIdx = findCol(["roll", "roll number", "rollno", "id", "reg"]);
    const phoneIdx = findCol(["phone", "mobile", "contact"]);
    const emailIdx = findCol(["email", "mail"]);
    const examIdx = findCol(["exam", "target exam", "course"]);
    const pNameIdx = findCol(["parent name", "father name", "guardian"]);
    const pPhoneIdx = findCol(["parent phone", "parent mobile", "father phone"]);
    const pRelIdx = findCol(["relationship", "relation"]);

    const rows: BulkStudentRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length === 0 || parts.every((p) => p === "")) continue;

      const fullName = nameIdx >= 0 ? parts[nameIdx] : parts[0];
      const rollNumber = rollIdx >= 0 ? parts[rollIdx] : parts[1] || `ROL-${i}`;

      if (fullName && rollNumber) {
        rows.push({
          fullName,
          rollNumber,
          phone: phoneIdx >= 0 ? parts[phoneIdx] : undefined,
          email: emailIdx >= 0 ? parts[emailIdx] : undefined,
          targetExam: examIdx >= 0 ? parts[examIdx] : undefined,
          parentName: pNameIdx >= 0 ? parts[pNameIdx] : undefined,
          parentPhone: pPhoneIdx >= 0 ? parts[pPhoneIdx] : undefined,
          parentRelationship: pRelIdx >= 0 ? parts[pRelIdx] : "Guardian",
        });
      }
    }

    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawCsvText(text);
      const parsed = parseCSV(text);
      setParsedRows(parsed);
      if (parsed.length > 0) {
        setActiveTab("preview");
        toast.info(`Parsed ${parsed.length} student rows from file`);
      } else {
        toast.error("Could not parse valid student rows from CSV file");
      }
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setRawCsvText(text);
    const parsed = parseCSV(text);
    setParsedRows(parsed);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "instituteops_student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample template downloaded!");
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) {
      toast.error("No valid students to import");
      return;
    }

    startTransition(async () => {
      const res = await bulkImportStudentsAction(parsedRows, selectedBatchId || undefined);

      if (res.success) {
        setImportResult(res.data);
        setActiveTab("result");
        toast.success(
          `Imported ${res.data.successCount} of ${res.data.totalProcessed} students!`
        );
        onSuccess?.();
      } else {
        toast.error(res.error || "Bulk import failed");
      }
    });
  };

  const handleLoadSampleData = () => {
    setRawCsvText(SAMPLE_CSV);
    const parsed = parseCSV(SAMPLE_CSV);
    setParsedRows(parsed);
    setActiveTab("preview");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span>Bulk CSV Student Import</span>
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSample}
              className="text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Download Template
            </Button>
          </div>
          <DialogDescription>
            Import multiple students at once into a batch. Creates student accounts, roll numbers, and linked parent profiles automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Step Tabs Navigation */}
        <div className="flex items-center gap-2 pt-2 border-b pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("input")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
              activeTab === "input"
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            1. Paste or Upload CSV
          </button>
          <button
            type="button"
            onClick={() => {
              if (parsedRows.length > 0) setActiveTab("preview");
            }}
            disabled={parsedRows.length === 0}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-40 ${
              activeTab === "preview"
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            2. Preview & Validation ({parsedRows.length})
          </button>
          {importResult && (
            <button
              type="button"
              onClick={() => setActiveTab("result")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                activeTab === "result"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              3. Import Results
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* TAB 1: Input / File Upload */}
          {activeTab === "input" && (
            <div className="space-y-4">
              {/* Batch Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="targetBatch" className="text-xs font-semibold">
                  Assign All Imported Students to Batch <span className="text-destructive">*</span>
                </Label>
                <select
                  id="targetBatch"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                >
                  <option value="">-- No specific batch / Infer from CSV --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.targetExam} • {b.branch.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag and drop upload box */}
              <div className="p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-500/50 transition">
                <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Choose a CSV file or drag & drop</p>
                  <p className="text-xs text-muted-foreground">
                    .CSV files up to 5MB (Comma Separated Values)
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={(e) => {
                      (e.currentTarget.previousElementSibling as HTMLElement)?.click();
                    }}
                  >
                    Select CSV File
                  </Button>
                </label>
              </div>

              {/* Or paste directly */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="csvText" className="text-xs font-semibold">
                    Or Paste CSV Data Directly
                  </Label>
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="h-3 w-3" /> Fill with Sample Data
                  </button>
                </div>
                <Textarea
                  id="csvText"
                  rows={6}
                  placeholder="Paste CSV rows here with columns: Full Name, Roll Number, Phone, Email, Target Exam, Parent Name, Parent Phone, Relationship"
                  value={rawCsvText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              {parsedRows.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>
                      {parsedRows.length} valid student rows detected and ready for review.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveTab("preview")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                  >
                    View Preview Table →
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Table Preview & Validation */}
          {activeTab === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Found <strong className="text-foreground">{parsedRows.length}</strong> students ready to import
                </span>
                <span className="text-[11px]">
                  Default password for new accounts: <code className="bg-muted px-1 rounded">password123</code>
                </span>
              </div>

              <div className="border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Roll No</TableHead>
                      <TableHead className="text-xs">Student Name</TableHead>
                      <TableHead className="text-xs">Contact</TableHead>
                      <TableHead className="text-xs">Exam</TableHead>
                      <TableHead className="text-xs">Linked Parent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-xs font-bold font-mono">
                          {row.rollNumber}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {row.fullName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>{row.phone || "—"}</div>
                          <div className="text-[10px] truncate max-w-28">{row.email || "—"}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px]">
                            {row.targetExam || "PSI"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.parentName ? (
                            <div>
                              <span className="font-medium">{row.parentName}</span>
                              <span className="text-[10px] text-muted-foreground block">
                                {row.parentRelationship} ({row.parentPhone || "No phone"})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* TAB 3: Results Summary */}
          {activeTab === "result" && importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border">
                  <div className="text-xs text-muted-foreground">Total Rows</div>
                  <div className="text-2xl font-bold">{importResult.totalProcessed}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                  <div className="text-xs">Successfully Created</div>
                  <div className="text-2xl font-bold">{importResult.successCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                  <div className="text-xs">Failed</div>
                  <div className="text-2xl font-bold">{importResult.failedCount}</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Errors & Skipped Rows
                  </div>
                  <div className="border border-destructive/30 rounded-lg p-3 bg-destructive/5 space-y-1.5 max-h-40 overflow-y-auto text-xs">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="font-bold">Row {err.rowNumber} ({err.rollNumber}):</span>
                        <span className="text-destructive">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            {activeTab === "result" ? "Close" : "Cancel"}
          </Button>

          {activeTab === "input" && (
            <Button
              type="button"
              disabled={parsedRows.length === 0}
              onClick={() => setActiveTab("preview")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Review {parsedRows.length} Rows →
            </Button>
          )}

          {activeTab === "preview" && (
            <Button
              type="button"
              disabled={isPending || parsedRows.length === 0}
              onClick={handleExecuteImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Import {parsedRows.length} Students Now
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
