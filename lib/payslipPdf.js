/**
 * Generate and download a payslip as PDF using a print-friendly HTML template.
 * Uses browser's native print-to-PDF via a hidden iframe.
 */
export function downloadPayslipPDF(payslip, orgName = "Organization") {
  const fmt = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;
  const month = new Date(2025, (payslip.month || 1) - 1).toLocaleDateString("en-US", { month: "long" });
  const year = payslip.year || new Date().getFullYear();

  // Build earnings rows
  const earningsRows = payslip.earnings
    ? Object.entries(payslip.earnings).filter(([, v]) => v !== 0).map(([k, v]) => `
        <tr><td>${k.replace(/_/g, " ")}</td><td class="amount">${k === "lop_deduction" ? `-${fmt(v)}` : fmt(v)}</td></tr>`)
      .join("")
    : "";

  // Build deductions rows
  const SKIP = new Set(["total_deductions"]);
  const deductionRows = payslip.deductions
    ? Object.entries(payslip.deductions).filter(([k]) => !SKIP.has(k)).map(([k, v]) => `
        <tr><td>${k.replace(/_/g, " ")}</td><td class="amount">-${fmt(v)}</td></tr>`)
      .join("")
    : [
        payslip.pf_employee != null && `<tr><td>PF (Employee)</td><td class="amount">-${fmt(payslip.pf_employee)}</td></tr>`,
        payslip.esi_employee != null && `<tr><td>ESI (Employee)</td><td class="amount">-${fmt(payslip.esi_employee)}</td></tr>`,
        payslip.professional_tax != null && `<tr><td>Professional Tax</td><td class="amount">-${fmt(payslip.professional_tax)}</td></tr>`,
      ].filter(Boolean).join("");

  // Employer contributions
  const hasEmployer = payslip.pf_employer || payslip.esi_employer || payslip.employer_contributions;
  let employerRows = "";
  if (payslip.employer_contributions) {
    employerRows = Object.entries(payslip.employer_contributions)
      .filter(([k]) => k !== "total_employer_cost")
      .map(([k, v]) => `<tr><td>${k.replace(/_/g, " ")}</td><td class="amount">${fmt(v)}</td></tr>`)
      .join("");
  } else if (payslip.pf_employer || payslip.esi_employer) {
    if (payslip.pf_employer) employerRows += `<tr><td>Employer PF</td><td class="amount">${fmt(payslip.pf_employer)}</td></tr>`;
    if (payslip.esi_employer) employerRows += `<tr><td>Employer ESI</td><td class="amount">${fmt(payslip.esi_employer)}</td></tr>`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Payslip - ${month} ${year}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
  .container { max-width: 700px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6; }
  .header h1 { font-size: 22px; font-weight: 900; color: #1e3a8a; }
  .header p { font-size: 11px; color: #64748b; margin-top: 2px; }
  .header .right { text-align: right; }
  .header .month { font-size: 16px; font-weight: 700; color: #3b82f6; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  .info-item label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
  .info-item p { font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; }
  .section-title.earnings { background: #ecfdf5; color: #065f46; }
  .section-title.deductions { background: #fef2f2; color: #991b1b; }
  .section-title.employer { background: #eff6ff; color: #1e40af; }
  table { width: 100%; border-collapse: collapse; }
  table td { padding: 7px 12px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
  table td:first-child { text-transform: capitalize; color: #475569; }
  table td.amount { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
  .total-row td { border-top: 2px solid #e2e8f0; font-weight: 800; font-size: 13px; padding-top: 10px; }
  .total-row.earnings td { color: #065f46; }
  .total-row.deductions td { color: #991b1b; }
  .net-pay { margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #eff6ff, #eef2ff); border: 2px solid #3b82f6; border-radius: 12px; text-align: center; }
  .net-pay label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
  .net-pay .amount { font-size: 28px; font-weight: 900; color: #1e40af; margin-top: 4px; }
  .net-pay .status { font-size: 10px; color: #16a34a; font-weight: 700; margin-top: 6px; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
  .days-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .days-box { text-align: center; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .days-box .num { font-size: 18px; font-weight: 900; }
  .days-box .lbl { font-size: 9px; color: #64748b; margin-top: 2px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <h1>${orgName}</h1>
      <p>Payslip for the month of ${month} ${year}</p>
    </div>
    <div class="right">
      <p class="month">${month} ${year}</p>
      <p>Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item"><label>Employee Name</label><p>${payslip.employee_name || "—"}</p></div>
    <div class="info-item"><label>Employee ID</label><p>${payslip.employee_code || payslip.employee_id || "—"}</p></div>
    <div class="info-item"><label>Department</label><p>${payslip.department || "—"}</p></div>
    <div class="info-item"><label>Designation</label><p>${payslip.designation || "—"}</p></div>
  </div>

  <div class="days-grid">
    <div class="days-box"><div class="num">${payslip.working_days || "—"}</div><div class="lbl">Working Days</div></div>
    <div class="days-box" style="border-color:#bbf7d0;"><div class="num" style="color:#16a34a;">${payslip.days_worked || "—"}</div><div class="lbl">Days Worked</div></div>
    <div class="days-box" style="border-color:#fecaca;"><div class="num" style="color:#dc2626;">${payslip.lop_days || 0}</div><div class="lbl">LOP Days</div></div>
  </div>

  <div class="section">
    <div class="section-title earnings">Earnings</div>
    <table>
      ${earningsRows}
      <tr class="total-row earnings"><td>Gross Salary</td><td class="amount">${fmt(payslip.gross_salary || payslip.gross_pay)}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title deductions">Deductions</div>
    <table>
      ${deductionRows}
      <tr class="total-row deductions"><td>Total Deductions</td><td class="amount">-${fmt(payslip.total_deductions)}</td></tr>
    </table>
  </div>

  ${hasEmployer ? `
  <div class="section">
    <div class="section-title employer">Employer Contributions</div>
    <table>${employerRows}</table>
  </div>` : ""}

  <div class="net-pay">
    <label>Net Pay (Take Home)</label>
    <div class="amount">${fmt(payslip.net_pay)}</div>
    ${payslip.status === "paid" ? `<div class="status">✓ Paid${payslip.paid_at ? ` on ${new Date(payslip.paid_at).toLocaleDateString("en-IN")}` : ""}</div>` : ""}
  </div>

  <div class="footer">
    <p>This is a system-generated payslip from ${orgName}. No signature required.</p>
  </div>
</div>
</body>
</html>`;

  // Create a hidden iframe and print it as PDF
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.onafterprint = () => {
    document.body.removeChild(iframe);
  };

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 500);
}
