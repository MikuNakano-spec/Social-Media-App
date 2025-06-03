import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PostExportData {
  id: string;
  username: string;
  content: string;
  createdAt: string;
  attachments: {
    id: string;
    url: string;
    type: "IMAGE" | "VIDEO";
  }[];
}

export function generatePostsExcelReport(posts: PostExportData[]) {
  const workbook = XLSX.utils.book_new();
  
  const excelData = [
    ["ID", "Author", "Content", "Created At", "Attachment Count", "Attachment Types"],
    ...posts.map(post => [
      post.id,
      post.username,
      post.content,
      new Date(post.createdAt).toLocaleString(),
      post.attachments.length,
      post.attachments.map(a => a.type).join(", ") || "None"
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Posts");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "socialapp-posts.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export function generatePostsPdfReport(posts: PostExportData[]) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  // Header
  doc.setFontSize(16);
  doc.setTextColor(33, 37, 41);
  doc.setFont("helvetica", "bold");
  doc.text("SocialApp Posts Report", margin, 20);
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 28);
  doc.text(`Total Posts: ${posts.length}`, pageWidth - margin, 28, { align: "right" });
  
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);
  
  // Table data
  const tableData = posts.map(post => [
    post.username,
    post.content.length > 100 ? post.content.substring(0, 100) + "..." : post.content,
    new Date(post.createdAt).toLocaleDateString(),
    post.attachments.length,
    post.attachments.map(a => a.type).join(", ") || "None"
  ]);
  
  autoTable(doc, {
    startY: 40,
    head: [["Author", "Content", "Created At", "Attachments", "Types"]],
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
      0: { cellWidth: 30, halign: "left" },
      1: { cellWidth: 60, halign: "left" },
      2: { cellWidth: 30 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 }
    },
    didDrawPage: function (data) {
      // Footer
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
        "Confidential - SocialApp Posts Data",
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  });
  
  doc.save(`socialapp-posts-${new Date().toISOString().slice(0,10)}.pdf`);
}