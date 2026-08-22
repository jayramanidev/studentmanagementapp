import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const payment = await db.feePayment.findUnique({
    where: { id: paymentId },
    include: {
      student: {
        include: {
          studentProfile: true,
        },
      },
      batch: {
        include: {
          branch: true,
        },
      },
      recorder: {
        select: { fullName: true },
      },
    },
  });

  if (!payment) {
    return new NextResponse("Payment receipt not found", { status: 404 });
  }

  const dateStr = new Date(payment.paymentDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const amountNumber = Number(payment.amountPaid);
  const totalFeeNumber = Number(payment.totalCourseFee);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fee Receipt - ${payment.receiptNumber}</title>
  <style>
    @page { size: A5 landscape; margin: 10mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 10px;
      font-size: 12px;
      background: #fff;
    }
    .container {
      border: 2px solid #312e81;
      border-radius: 12px;
      padding: 18px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand { font-size: 18px; font-weight: 900; color: #312e81; text-transform: uppercase; }
    .subbrand { font-size: 10px; color: #64748b; }
    .receipt-badge {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #6ee7b7;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 11px;
      text-align: right;
    }
    .grid-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 12px;
      font-size: 11px;
    }
    .info-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #e2e8f0; }
    .info-label { color: #64748b; }
    .info-val { font-weight: bold; color: #0f172a; }
    .amount-box {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 12px 0;
    }
    .amount-val { font-size: 20px; font-weight: 900; color: #059669; }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 25px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      text-align: center;
    }
    .sig-line { border-bottom: 1px dashed #94a3b8; width: 140px; margin-bottom: 4px; }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand">InstituteOps Coaching Academy</div>
        <div class="subbrand">Police & Competitive Examinations Center (PSI • Constable • GPSC)</div>
        <div class="subbrand" style="margin-top: 2px;">Campus: ${payment.batch.branch.name} (${payment.batch.branch.city})</div>
      </div>
      <div>
        <div class="receipt-badge">FEE RECEIPT VOUCHER</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px; text-align: right;">
          No: <strong>${payment.receiptNumber}</strong>
        </div>
      </div>
    </div>

    <div class="grid-info">
      <div class="info-row">
        <span class="info-label">Candidate Name:</span>
        <span class="info-val">${payment.student.fullName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Date:</span>
        <span class="info-val">${dateStr}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Roll Number:</span>
        <span class="info-val" style="color: #4f46e5;">${payment.student.studentProfile?.rollNumber ?? "N/A"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Mode:</span>
        <span class="info-val">${payment.paymentMode} ${payment.transactionRef ? `(${payment.transactionRef})` : ""}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Enrolled Batch:</span>
        <span class="info-val">${payment.batch.name} (${payment.batch.targetExam})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Installment:</span>
        <span class="info-val">Installment #${payment.installmentNo}</span>
      </div>
    </div>

    <div class="amount-box">
      <div>
        <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Amount Received in Words / INR</div>
        <div style="font-size: 11px; color: #334155; margin-top: 2px;">
          ${payment.remarks ? `Remarks: ${payment.remarks}` : "Tuition Fee Installment for Coaching & Exam Materials"}
        </div>
      </div>
      <div class="amount-val">₹${amountNumber.toLocaleString("en-IN")}</div>
    </div>

    <div class="signatures">
      <div>
        <div class="sig-line"></div>
        <div>Candidate / Depositor Signature</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div>Cashier / Accounts Officer</div>
        <div style="color: #64748b; font-size: 9px;">${payment.recorder?.fullName ?? "Authorized Signatory"}</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div>Academy Director / Stamp</div>
      </div>
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
