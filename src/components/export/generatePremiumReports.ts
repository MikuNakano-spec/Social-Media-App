import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PremiumUserExportData {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  createdAt: string;
  plan: string;
  status: string;
  renewalDate: string;
}

export function generatePremiumExcelReport(users: PremiumUserExportData[]) {
  const workbook = XLSX.utils.book_new();
  
  const excelData = [
    ["ID", "Username", "Email", "Plan", "Status", "Renewal Date", "Join Date"],
    ...users.map(user => [
      user.id,
      user.username,
      user.email || "—",
      user.plan,
      user.status,
      user.renewalDate,
      new Date(user.createdAt).toLocaleDateString()
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Premium Users");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "socialapp-premium-users.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export function generatePremiumPdfReport(users: PremiumUserExportData[]) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  doc.setFontSize(16);
  doc.setTextColor(33, 37, 41);
  doc.setFont("helvetica", "bold");
  doc.text("Premium Users Report", margin, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 28);
  doc.text(`Total Premium Users: ${users.length}`, pageWidth - margin, 28, { align: "right" });
  
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);
  
  const tableData = users.map(user => [
    user.username,
    user.email || "—",
    user.plan,
    user.status,
    user.renewalDate,
    new Date(user.createdAt).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: 40,
    head: [["Username", "Email", "Plan", "Status", "Renewal", "Join Date"]],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
      halign: "center"
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 25, halign: "left" },
      1: { cellWidth: 40, halign: "left" },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 }
    },
    didDrawPage: function (data) {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
      doc.text(
        "Confidential - SocialApp Premium Data",
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  });
  
  doc.save(`socialapp-premium-users-${new Date().toISOString().slice(0,10)}.pdf`);
}