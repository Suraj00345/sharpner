const PDFDocument = require("pdfkit");
const Expense = require("../models/Expense");

const downloadPDFReport = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { userId: req.user.id },
    });

    if (!expenses || expenses.length === 0) {
      return res.status(404).json({
        message: "No expenses found to generate a report.",
      });
    }

    // Initialize a new PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Expense_Report.pdf"',
    );

    // Pipe the PDF directly into the response stream
    doc.pipe(res);

    // Title
    doc.fontSize(20).text("Expense Report", { align: "center" });
    doc.moveDown();

    // Top Separator Line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Table Headers
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Date", 50, doc.y, { continued: true });
    doc.text("Category", 150, doc.y, { continued: true });
    doc.text("Description", 250, doc.y, { continued: true });
    doc.text("Amount", 480, doc.y);
    doc.moveDown(0.5);

    // Reset font for data rows
    doc.font("Helvetica");

    let totalAmount = 0;

    // Loop through expenses and print each row
    expenses.forEach((expense) => {
      totalAmount += Number(expense.amount);

      const dateStr = expense.createdAt
        ? new Date(expense.createdAt).toLocaleDateString()
        : "N/A";

      const currentY = doc.y;

      doc.text(dateStr, 50, currentY, { width: 90 });
      doc.text(expense.category || "General", 150, currentY, { width: 90 });
      doc.text(expense.description || "-", 250, currentY, { width: 220 });
      doc.text(`$${expense.amount}`, 480, currentY);

      doc.moveDown(0.5);
    });

    // --- MOVED OUTSIDE THE LOOP ---
    // Bottom Separator Line
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Total Amount
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Total: $${totalAmount}`, 400, doc.y);

    // Finalize the PDF and end the stream
    doc.end();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error while generating PDF" });
  }
};

module.exports = { downloadPDFReport };
