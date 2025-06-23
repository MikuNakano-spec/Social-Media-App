import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReportExportData {
  id: string;
  reportType: string;
  reportedItemId: string;
  content: string;
  username: string;
  status: string;
  createdAt: string;
}

export function generateReportsExcelReport(reports: ReportExportData[]) {
  const workbook = XLSX.utils.book_new();
  
  const excelData = [
    ["Report ID", "Type", "Item ID", "Content", "Reporter", "Status", "Created At"],
    ...reports.map(report => [
      report.id,
      report.reportType,
      report.reportedItemId,
      report.content,
      report.username,
      report.status,
      new Date(report.createdAt).toLocaleString()
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "socialapp-reports.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export function generateReportsPdfReport(reports: ReportExportData[]) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  doc.setFontSize(16);
  doc.setTextColor(33, 37, 41);
  doc.setFont("helvetica", "bold");
  doc.text("SocialApp Reports", margin, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 28);
  doc.text(`Total Reports: ${reports.length}`, pageWidth - margin, 28, { align: "right" });
  
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);
  
  const tableData = reports.map(report => [
    report.id,
    report.reportType,
    report.reportedItemId,
    report.content.length > 50 ? report.content.substring(0, 50) + "..." : report.content,
    report.username,
    report.status,
    new Date(report.createdAt).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: 40,
    head: [["ID", "Type", "Item ID", "Content", "Reporter", "Status", "Created At"]],
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
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 15 },
      2: { cellWidth: 20 },
      3: { cellWidth: 40, halign: "left" },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 }
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
        "Confidential - SocialApp Reports Data",
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  });
  
  doc.save(`socialapp-reports-${new Date().toISOString().slice(0,10)}.pdf`);
}