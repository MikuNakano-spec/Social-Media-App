import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";

interface GrowthData {
  month: string;
  users: number;
  posts: number;
  reports: number;
}

interface AdminStatsSummary {
  totalUsers: number;
  totalPosts: number;
  reportedPosts: number;
  totalRevenue: number;
  activeSubscriptions: number;
  bannedUsers: number;
}

type Color = [number, number, number];
const primaryColor: Color = [33, 37, 41];
const secondaryColor: Color = [59, 130, 246];

const loadImage = async (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
    img.crossOrigin = "Anonymous";
  });
};

export const generatePdfReport = async (
  growthData: GrowthData[],
  summary: AdminStatsSummary,
  trendingTopics: { hashtag: string; count: number }[]
) => {
  const doc = new jsPDF("p", "mm", "a4") as jsPDF & { lastAutoTable?: { finalY: number } };
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  try {
    const logo = await loadImage(`${window.location.origin}/logo.png`);
  
    const maxLogoWidth = 35;
    const aspectRatio = logo.width / logo.height;
    const logoWidth = Math.min(maxLogoWidth, (logo.width * 0.264583));
    const logoHeight = logoWidth / aspectRatio;

    doc.setFillColor(...secondaryColor);
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
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.text("SOCIALAPP ANALYTICS", logoX + logoWidth + 10, logoY + 8);

  } catch (error) {
    console.error("Error loading logo:", error);
    doc.setFontSize(12);
    doc.setTextColor(255);
    doc.text("SOCIALAPP ANALYTICS", margin, 15);
  }

  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text("Admin Dashboard Report", margin, 45);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 53);
  doc.text("Prepared for: Executive Team", pageWidth - margin, 53, { align: "right" });

  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(margin, 60, pageWidth - margin, 60);

  let yPos = 70;
  doc.setFontSize(14);
  doc.setTextColor(...secondaryColor);
  doc.text("Key Performance Indicators", margin, yPos);
  yPos += 10;

  const formatNumber = (num: number): string => num.toLocaleString();
  const formatCurrency = (amount: number): string => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const kpiTable: UserOptions = {
    startY: yPos,
    head: [["Metric", "Value", "YoY Change"]],
    body: [
      ["Total Users", summary.totalUsers.toLocaleString(), "+12.5%"],
      ["Active Subscriptions", summary.activeSubscriptions.toLocaleString(), "+8.2%"],
      ["Total Revenue", formatCurrency(summary.totalRevenue), "+15.3%"],
      ["Reports Received", summary.reportedPosts.toLocaleString(), "-4.1%"],
      ["Banned Users", summary.bannedUsers.toLocaleString(), "+2.8%"],
    ],
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "grid",
    headStyles: { 
      fillColor: secondaryColor,
      textColor: 255,
      cellPadding: 4,
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.45, halign: "left" },
      1: { cellWidth: contentWidth * 0.35, halign: "center" },
      2: { cellWidth: contentWidth * 0.2, halign: "center" }
    },
    styles: { 
      fontSize: 10,
      cellPadding: 4,
      halign: "center",
      overflow: "linebreak"
    }
  };
  autoTable(doc, kpiTable);

  yPos = (doc.lastAutoTable?.finalY || 100) + 15;
  doc.setFontSize(14);
  doc.setTextColor(...secondaryColor);
  doc.text("Growth Metrics", margin, yPos);
  yPos += 6;

  const growthTable: UserOptions = {
    startY: yPos,
    head: [["Month", "New Users", "Content Created", "Reports"]],
    body: growthData.map(entry => [
      entry.month,
      formatNumber(entry.users),
      formatNumber(entry.posts),
      formatNumber(entry.reports),
    ]),
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    alternateRowStyles: { fillColor: [245, 245, 245] },
    headStyles: { 
      fillColor: secondaryColor,
      textColor: 255,
      cellPadding: 4,
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.25, halign: "center" },
      1: { cellWidth: contentWidth * 0.25, halign: "center" },
      2: { cellWidth: contentWidth * 0.25, halign: "center" },
      3: { cellWidth: contentWidth * 0.25, halign: "center" }
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3,
      halign: "center"
    }
  };
  autoTable(doc, growthTable);

  doc.addPage();
  yPos = margin;

  doc.setFontSize(14);
  doc.setTextColor(...secondaryColor);
  doc.text("Trending Content", margin, yPos);
  yPos += 10;

  const trendingTable: UserOptions = {
    startY: yPos,
    head: [["Hashtag", "Engagement"]],
    body: trendingTopics.map(topic => [
      `${topic.hashtag}`,
      formatNumber(topic.count)
    ]),
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    headStyles: { 
      fillColor: secondaryColor,
      textColor: 255,
      cellPadding: 4,
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6, halign: "center" },
      1: { cellWidth: contentWidth * 0.4, halign: "center" }
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3,
      halign: "center"
    }
  };
  autoTable(doc, trendingTable);

  let signatureY = (doc.lastAutoTable?.finalY || 100) + 20;
  if (signatureY > pageHeight - 40) {
    doc.addPage();
    signatureY = margin;
  }

  doc.setFontSize(10);
  doc.setTextColor(100);
  
  doc.text("Approved by:", margin, signatureY);
  doc.line(margin, signatureY + 4, margin + 60, signatureY + 4);
  doc.text("Vo Thanh Nghi, CEO", margin, signatureY + 10);
  doc.text(new Date().toLocaleDateString(), margin, signatureY + 16);

  const preparedX = pageWidth - margin - 60;
  doc.text("Prepared by:", preparedX, signatureY);
  doc.line(preparedX, signatureY + 4, preparedX + 60, signatureY + 4);
  doc.text("Analytics Team", preparedX, signatureY + 10);
  doc.text(new Date().toLocaleDateString(), preparedX, signatureY + 16);

  const footerY = pageHeight - margin;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Confidential - Internal Use Only", margin, footerY);
  doc.text(`Page ${doc.getNumberOfPages()} of ${doc.getNumberOfPages()}`, pageWidth - margin, footerY, { align: "right" });

  doc.save("socialapp-analytics-report.pdf");
};