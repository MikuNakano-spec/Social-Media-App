import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface UserExportData {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: string;
  isBanned: boolean;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
}

type Color = [number, number, number];
const primaryColor: Color = [33, 37, 41]; 
const secondaryColor: Color = [59, 130, 246]; 
const accentColor: Color = [239, 68, 68];
const whiteColor: Color = [255, 255, 255];
const grayColor: Color = [200, 200, 200];

const loadImage = async (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
    img.crossOrigin = "Anonymous";
  });
};

export function generateUsersExcelReport(users: UserExportData[]) {
  const workbook = XLSX.utils.book_new();
  
  const excelData = [
    ["ID", "Username", "Display Name", "Email", "Role", "Status", "Created At", "Subscription Plan", "Subscription Status"],
    ...users.map(user => [
      user.id,
      user.username,
      user.displayName,
      user.email,
      user.role,
      user.isBanned ? "Banned" : "Active",
      new Date(user.createdAt).toLocaleDateString(),
      user.subscription?.plan || "None",
      user.subscription?.status || "None"
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "socialapp-users.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export const generateUsersPdfReport = async (users: UserExportData[]) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  try {
    const logo = await loadImage(`${window.location.origin}/logo.png`);
  
    const maxLogoWidth = 35;
    const aspectRatio = logo.width / logo.height;
    const logoWidth = Math.min(maxLogoWidth, (logo.width * 0.264583));
    const logoHeight = logoWidth / aspectRatio;

    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 0, pageWidth, 25, "F");

    const logoX = margin;
    const logoY = 5; 
    doc.addImage(
      logo,
      "PNG",
      logoX,
      logoY,
      logoWidth,
      logoHeight
    );

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("SOCIALAPP USER REPORT", logoX + logoWidth + 10, logoY + 8);

  } catch (error) {
    console.error("Error loading logo:", error);
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("SOCIALAPP USER REPORT", margin, 15);
  }

  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("User Management Report", margin, 45);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 53);
  
  const totalUsersText = `Total Users: ${users.length}`;
  doc.text(totalUsersText, pageWidth - margin - 50, 53);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 60, pageWidth - margin, 60);

  let yPos = 70;
  doc.setFontSize(14);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("User Details", margin, yPos);
  yPos += 10;

  const head = [["Username", "Display Name", "Email", "Role", "Status", "Joined", "Subscription", "Status"]];
  
  const body = users.map(user => [
    user.username,
    user.displayName,
    user.email || "N/A",
    user.role,
    user.isBanned ? "BANNED" : "Active",
    new Date(user.createdAt).toLocaleDateString(),
    user.subscription?.plan || "None",
    user.subscription?.status || "None"
  ]);

  autoTable(doc, {
    startY: yPos,
    head: head,
    body: body,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    showHead: "everyPage",
    theme: "grid",
    headStyles: {
      fillColor: [secondaryColor[0], secondaryColor[1], secondaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.15, halign: 'left' },
      1: { cellWidth: contentWidth * 0.15, halign: 'left' },
      2: { cellWidth: contentWidth * 0.2, halign: 'left' },
      3: { cellWidth: contentWidth * 0.1 },
      4: { cellWidth: contentWidth * 0.08 },
      5: { cellWidth: contentWidth * 0.12 },
      6: { cellWidth: contentWidth * 0.1 },
      7: { cellWidth: contentWidth * 0.1 }
    },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.cell.raw === "BANNED") {
        data.cell.styles.textColor = [accentColor[0], accentColor[1], accentColor[2]];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    willDrawCell: (data) => {
      if ([0, 1, 2].includes(data.column.index)) {
        data.cell.styles.halign = 'left';
      }
    },
    didDrawPage: function (data) {
      const pageCount = doc.getNumberOfPages();
      const currentPage = data.pageNumber;
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      
      const pageText = `Page ${currentPage} of ${pageCount}`;
      doc.text(pageText, pageWidth - margin - 20, pageHeight - 10);
      
      doc.text(
        "Confidential - SocialApp User Data",
        margin,
        pageHeight - 10
      );
    }
  });

  let signatureY = (doc as any).lastAutoTable?.finalY || 80;
  signatureY += 15;
  
  if (signatureY > pageHeight - 40) {
    doc.addPage();
    signatureY = margin;
  }

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  
  doc.text("Approved by:", margin, signatureY);
  doc.line(margin, signatureY + 4, margin + 60, signatureY + 4);
  doc.text("Administration Team", margin, signatureY + 10);
  doc.text(new Date().toLocaleDateString(), margin, signatureY + 16);

  const preparedX = pageWidth - margin - 60;
  doc.text("Prepared by:", preparedX, signatureY);
  doc.line(preparedX, signatureY + 4, preparedX + 60, signatureY + 4);
  doc.text("User Management System", preparedX, signatureY + 10);
  doc.text(new Date().toLocaleDateString(), preparedX, signatureY + 16);

  doc.save(`socialapp-users-${new Date().toISOString().slice(0,10)}.pdf`);
};