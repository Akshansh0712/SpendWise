// Prepare one value for a CSV cell.
function escapeCsvCell(value) {
  let text = value === null || value === undefined
    ? ""
    : String(value);

  // Reduce spreadsheet formula-injection risk for user-provided text.
  // Spreadsheet programs may interpret these characters as formulas.
  if (/^[\s\x00-\x1f]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  // Escape quotes and wrap every cell in quotes.
  return `"${text.replace(/"/g, '""')}"`;
}

function transactionsToCsv(transactions) {
  const headings = [
    "Title",
    "Amount",
    "Type",
    "Category",
    "Payment Method",
    "Description",
    "Date (UTC)",
  ];

  const rows = transactions.map((transaction) => [
    transaction.title,
    transaction.amount,
    transaction.type,
    transaction.category,
    transaction.paymentMethod,
    transaction.description,
    transaction.date.toISOString().slice(0, 10),
  ]);

  const csvLines = [headings, ...rows].map((row) =>
    row.map(escapeCsvCell).join(",")
  );

  // UTF-8 BOM helps spreadsheet programs recognize Unicode text.
  return "\uFEFF" + csvLines.join("\r\n") + "\r\n";
}

module.exports = { transactionsToCsv };