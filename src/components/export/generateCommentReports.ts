import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface CommentExportData {
  id: string;
  username: string;
  content: string;
  createdAt: string;
  postContent: string;
  postId: string;
}

export function generateCommentsExcelReport(comments: CommentExportData[]) {
  const workbook = XLSX.utils.book_new();
  
  const excelData = [
    ["ID", "Author", "Content", "Created At", "Post ID", "Post Content"],
    ...comments.map(comment => [
      comment.id,
      comment.username,
      comment.content,
      new Date(comment.createdAt).toLocaleString(),
      comment.postId,
      comment.postContent
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Comments");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "socialapp-comments.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export function generateCommentsPdfReport(comments: CommentExportData[]) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  // Header
  doc.setFontSize(16);
  doc.setTextColor(33, 37, 41);
  doc.setFont("helvetica", "bold");
  doc.text("SocialApp Comments Report", margin, 20);
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 28);
  doc.text(`Total Comments: ${comments.length}`, pageWidth - margin, 28, { align: "right" });
  
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);
  
  // Table data
  const tableData = comments.map(comment => [
    comment.username,
    comment.content.length > 100 ? comment.content.substring(0, 100) + "..." : comment.content,
    new Date(comment.createdAt).toLocaleDateString(),
    comment.postId,
    comment.postContent.length > 50 ? comment.postContent.substring(0, 50) + "..." : comment.postContent
  ]);
  
  autoTable(doc, {
    startY: 40,
    head: [["Author", "Content", "Created At", "Post ID", "Post Content"]],
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
      1: { cellWidth: 50, halign: "left" },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 40, halign: "left" }
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
        "Confidential - SocialApp Comments Data",
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  });
  
  doc.save(`socialapp-comments-${new Date().toISOString().slice(0,10)}.pdf`);
}