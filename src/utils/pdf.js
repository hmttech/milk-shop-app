import { jsPDF } from 'jspdf';
import { currency } from './helpers.js';

export function genPDF(bill, shop) {
  const doc = new jsPDF();
  const lineHeight = 7;
  let y = 14;

  doc.setFontSize(16);
  doc.text(shop.name, 14, y);
  y += lineHeight;
  doc.setFontSize(10);
  doc.text(`${shop.addr}`, 14, y);
  y += lineHeight;
  doc.text(`Phone: ${shop.phone}`, 14, y);
  y += lineHeight + 2;

  doc.setFontSize(12);
  doc.text(`Invoice: ${bill.invoiceNo}`, 14, y);
  doc.text(`Date: ${new Date(bill.createdAt).toLocaleString()}`, 140, y, { align: 'left' });
  y += lineHeight;
  doc.text(`Customer: ${bill.customer?.name || '-'}`, 14, y);
  doc.text(
    `Status: ${bill.status}${bill.status === 'Pending' && bill.dueDate ? ' (Due: ' + new Date(bill.dueDate).toLocaleDateString() + ')' : ''}`,
    140,
    y,
    { align: 'left' }
  );
  y += lineHeight + 2;

  // table header
  doc.setFontSize(11);
  doc.text('Item', 14, y);
  doc.text('Qty', 120, y);
  doc.text('Price', 140, y);
  doc.text('Total', 170, y);
  y += 2;
  doc.line(14, y, 195, y);
  y += 6;

  bill.items.forEach((it) => {
    const line = 6;
    doc.text(it.name, 14, y);
    doc.text(String(it.qty), 120, y, { align: 'left' });
    doc.text(currency(it.price), 140, y, { align: 'left' });
    doc.text(currency(it.qty * it.price), 170, y, { align: 'left' });
    y += line;
  });

  y += 2;
  doc.line(120, y, 195, y);
  y += 6;
  doc.setFontSize(12);
  doc.text('Subtotal:', 140, y);
  doc.text(currency(bill.subtotal), 170, y);
  y += lineHeight;
  doc.text('Discount:', 140, y);
  doc.text(currency(bill.discount), 170, y);
  y += lineHeight;
  doc.text('Grand Total:', 140, y);
  doc.text(currency(bill.total), 170, y);
  y += lineHeight + 2;

  doc.setFontSize(10);
  doc.text('Thank you for your purchase!', 14, y);

  return doc.output('blob');
}
