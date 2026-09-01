const PDFDocument = require("pdfkit");
const Expense = require("../models/Expense");

const downloadPDFReport = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;

    const expenses = await Expense.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    if (!expenses || expenses.length === 0) {
      return res.status(404).json({
        message: "No expenses found to generate a report.",
      });
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Expense_Report.pdf"'
    );

    doc.pipe(res);

    // --- COLOR PALETTE ---
    const PRIMARY_COLOR = "#1E293B"; // Dark Slate
    const ACCENT_COLOR = "#2563EB";  // Blue
    const TEXT_MUTED = "#64748B";    // Gray
    const BG_LIGHT = "#F8FAFC";      // Very Light Gray
    const BORDER_COLOR = "#E2E8F0";  // Divider Line

    // --- 1. HEADER SECTION ---
    doc
      .fillColor(PRIMARY_COLOR)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("EXPENSE REPORT", 50, 45);

    doc
      .fillColor(TEXT_MUTED)
      .fontSize(9)
      .font("Helvetica")
      .text(`Generated on: ${new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}`, 50, 72);

    doc
      .moveTo(50, 90)
      .lineTo(545, 90)
      .lineWidth(2)
      .strokeColor(ACCENT_COLOR)
      .stroke();

    // --- 2. SUMMARY KPI CARD ---
    const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    doc
      .roundedRect(50, 105, 495, 50, 6)
      .fillColor(BG_LIGHT)
      .fillAndStroke(BG_LIGHT, BORDER_COLOR);

    doc
      .fillColor(TEXT_MUTED)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("TOTAL TRANSACTIONS", 70, 116)
      .text("TOTAL EXPENSE SPENT", 350, 116);

    doc
      .fillColor(PRIMARY_COLOR)
      .fontSize(13)
      .font("Helvetica-Bold")
      .text(`${expenses.length} Records`, 70, 130)
      .fillColor(ACCENT_COLOR)
      .text(`INR ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 350, 130);

    // --- 3. REUSABLE TABLE HEADER FUNCTION ---
    let currentY = 175;

    const drawTableHeader = (y) => {
      doc
        .rect(50, y, 495, 24)
        .fillColor(PRIMARY_COLOR)
        .fill();

      doc
        .fillColor("#FFFFFF")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("DATE", 60, y + 7, { width: 85 })
        .text("CATEGORY", 150, y + 7, { width: 95 })
        .text("DESCRIPTION", 250, y + 7, { width: 175 })
        .text("AMOUNT", 435, y + 7, { width: 100, align: "right" });

      return y + 24;
    };

    currentY = drawTableHeader(currentY);

    // --- 4. DATA ROWS (WITH PAGE OVERFLOW & DYNAMIC HEIGHT) ---
    doc.font("Helvetica").fontSize(9);

    expenses.forEach((expense, index) => {
      const descriptionText = expense.description || "-";
      
      // Calculate row height based on description text length
      const descriptionHeight = doc.heightOfString(descriptionText, { width: 175 });
      const rowHeight = Math.max(descriptionHeight + 12, 22);

      // Auto Page Break Check
      if (currentY + rowHeight > 750) {
        doc.addPage();
        currentY = 50;
        currentY = drawTableHeader(currentY);
        doc.font("Helvetica").fontSize(9);
      }

      // Alternating Row Background
      if (index % 2 === 0) {
        doc
          .rect(50, currentY, 495, rowHeight)
          .fillColor(BG_LIGHT)
          .fill();
      }

      const formattedDate = expense.createdAt
        ? new Date(expense.createdAt).toLocaleDateString("en-IN")
        : "N/A";
      const formattedAmount = `INR ${Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

      // Render Text Cells
      doc.fillColor(PRIMARY_COLOR);
      doc.text(formattedDate, 60, currentY + 6, { width: 85 });
      doc.text(expense.category || "General", 150, currentY + 6, { width: 95 });
      doc.text(descriptionText, 250, currentY + 6, { width: 175 });
      doc.text(formattedAmount, 435, currentY + 6, { width: 100, align: "right" });

      // Row Separator Line
      doc
        .moveTo(50, currentY + rowHeight)
        .lineTo(545, currentY + rowHeight)
        .lineWidth(0.5)
        .strokeColor(BORDER_COLOR)
        .stroke();

      currentY += rowHeight;
    });

    // --- 5. GRAND TOTAL FOOTER BLOCK ---
    if (currentY + 30 > 750) {
      doc.addPage();
      currentY = 50;
    }

    currentY += 12;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(PRIMARY_COLOR)
      .text("Grand Total:", 320, currentY, { width: 100, align: "right" })
      .fillColor(ACCENT_COLOR)
      .text(`INR ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 435, currentY, { width: 100, align: "right" });

    doc.end();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error while generating PDF" });
  }
};

module.exports = { downloadPDFReport };