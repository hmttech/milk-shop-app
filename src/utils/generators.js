export function genInvoiceNumber(bills) {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const seq = String((bills?.length ?? 0) + 1).padStart(4, "0");
  return `GD-${y}${m}-${seq}`;
}