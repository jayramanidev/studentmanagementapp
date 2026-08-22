import { NextRequest, NextResponse } from "next/server";
import { getStudentPerformanceAction } from "@/actions/performance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const res = await getStudentPerformanceAction(studentId);

  if (!res.success || !res.data) {
    return new NextResponse("Student report not found", { status: 404 });
  }

  const { student, overallStats, attendance, testHistory } = res.data;
  const printDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Scorecard - ${student.fullName} (${student.rollNumber})</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand { font-size: 20px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; }
    .subbrand { font-size: 11px; color: #64748b; }
    .badge {
      display: inline-block;
      background: #e0e7ff;
      color: #3730a3;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .grid-info {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .stat-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
      text-align: center;
    }
    .stat-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      background: #fff;
    }
    .stat-val { font-size: 18px; font-weight: 800; color: #4f46e5; margin: 4px 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px;
      text-align: left;
    }
    th { background: #f1f5f9; font-weight: 700; font-size: 11px; }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .sig-line { border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px; }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">InstituteOps Coaching Academy</div>
      <div class="subbrand">Excellence in Police & Competitive Exams (PSI • Constable • GPSC)</div>
    </div>
    <div style="text-align: right;">
      <div class="badge">Official Scorecard</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Issued: ${printDate}</div>
    </div>
  </div>

  <div class="grid-info">
    <div>
      <span style="font-size: 10px; color: #64748b; display: block;">Student Name</span>
      <strong>${student.fullName}</strong>
    </div>
    <div>
      <span style="font-size: 10px; color: #64748b; display: block;">Roll Number</span>
      <strong style="color: #4f46e5;">${student.rollNumber}</strong>
    </div>
    <div>
      <span style="font-size: 10px; color: #64748b; display: block;">Target Exam</span>
      <strong>${student.targetExam}</strong>
    </div>
    <div>
      <span style="font-size: 10px; color: #64748b; display: block;">Batch</span>
      <strong>${student.batchName}</strong>
    </div>
  </div>

  <div class="stat-cards">
    <div class="stat-card">
      <div style="font-size: 10px; color: #64748b;">Cumulative Score</div>
      <div class="stat-val">${overallStats.overallAveragePercentage ?? "—"}%</div>
      <div style="font-size: 9px; color: #64748b;">Across ${overallStats.totalTestsAttempted} Tests</div>
    </div>
    <div class="stat-card">
      <div style="font-size: 10px; color: #64748b;">Best Rank</div>
      <div class="stat-val" style="color: #d97706;">#${overallStats.latestRank ?? "—"}</div>
      <div style="font-size: 9px; color: #64748b;">Out of ${overallStats.totalStudentsInBatch} in Batch</div>
    </div>
    <div class="stat-card">
      <div style="font-size: 10px; color: #64748b;">Attendance Rate</div>
      <div class="stat-val" style="color: #059669;">${attendance.attendancePercentage}%</div>
      <div style="font-size: 9px; color: #64748b;">${attendance.presentDays} / ${attendance.totalClasses} Days</div>
    </div>
    <div class="stat-card">
      <div style="font-size: 10px; color: #64748b;">Academic Standing</div>
      <div class="stat-val" style="font-size: 13px; color: #1e293b; margin: 8px 0;">
        ${attendance.attendancePercentage >= 75 ? "GOOD STANDING" : "ATTENDANCE REVIEW"}
      </div>
      <div style="font-size: 9px; color: #64748b;">Academy Benchmark</div>
    </div>
  </div>

  <h3 style="font-size: 12px; margin-bottom: 8px; text-transform: uppercase; color: #1e293b;">
    Offline Examination Record
  </h3>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Exam Title</th>
        <th>Subject</th>
        <th style="text-align: center;">Score</th>
        <th style="text-align: center;">%</th>
        <th style="text-align: center;">Rank</th>
        <th style="text-align: center;">Batch Avg</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${
        testHistory.length === 0
          ? '<tr><td colspan="8" style="text-align: center;">No test records recorded.</td></tr>'
          : testHistory
              .map(
                (t) => `
          <tr>
            <td>${new Date(t.testDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}</td>
            <td><strong>${t.testTitle}</strong></td>
            <td>${t.subjectName}</td>
            <td style="text-align: center; font-weight: bold;">${
              t.isAbsent ? "ABSENT" : `${t.marksObtained} / ${t.totalMarks}`
            }</td>
            <td style="text-align: center;">${t.percentage !== null ? `${t.percentage}%` : "—"}</td>
            <td style="text-align: center; font-weight: bold; color: #4f46e5;">${
              t.calculatedRank ? `#${t.calculatedRank}` : "—"
            }</td>
            <td style="text-align: center;">${t.batchAverage ?? "—"}</td>
            <td style="font-style: italic; font-size: 11px;">${t.remarks || "—"}</td>
          </tr>
        `
              )
              .join("")
      }
    </tbody>
  </table>

  <div class="signatures">
    <div>
      <div class="sig-line"></div>
      <strong>Class Instructor</strong>
      <div style="font-size: 10px; color: #64748b;">Teacher Signature</div>
    </div>
    <div>
      <div class="sig-line"></div>
      <strong>Director of Academics</strong>
      <div style="font-size: 10px; color: #64748b;">Academy Seal</div>
    </div>
    <div>
      <div class="sig-line"></div>
      <strong>Parent / Guardian</strong>
      <div style="font-size: 10px; color: #64748b;">Acknowledgement Signature</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
