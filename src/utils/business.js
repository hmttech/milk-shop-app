import { uid, todayISO, parseNum, currency } from './helpers.js';
import { genInvoiceNumber } from './generators.js';
import { genPDF } from './pdf.js';
import { downloadFile } from './storage.js';

export function addToCart(setState, prod, qty = 1) {
  qty = Math.max(1, Math.min(qty, prod.qty));
  setState(prev => {
    const exists = prev.cart.find(c => c.id === prod.id);
    let cart;
    if (exists) {
      const newQty = Math.min(exists.qty + qty, prod.qty);
      cart = prev.cart.map(c => c.id === prod.id ? { ...c, qty: newQty } : c);
    } else {
      cart = [{ id: prod.id, name: prod.name, price: prod.price, qty }, ...prev.cart];
    }
    return { ...prev, cart };
  });
}

export function updateCartQty(setState, id, qty) {
  qty = Math.max(1, qty);
  setState(prev => ({ ...prev, cart: prev.cart.map(c => c.id === id ? { ...c, qty } : c) }));
}

export function removeFromCart(setState, id) {
  setState(prev => ({ ...prev, cart: prev.cart.filter(c => c.id !== id) }));
}

export function ensureCustomer(setState, state, name, phone, religion, general) {
  const existing = state.customers.find(c => c.phone === phone && phone);
  if (existing) return existing;
  const cust = { id: uid(), name, phone, religion, general, createdAt: todayISO() };
  setState(prev => ({ ...prev, customers: [cust, ...prev.customers] }));
  return cust;
}

export function checkout({ 
  setState, 
  state, 
  setNotif, 
  setTab, 
  customerName, 
  customerPhone, 
  status, 
  dueDate, 
  discount = 0, 
  religion = "", 
  general = true 
}) {
  const cartSubtotal = state.cart.reduce((s, c) => s + (c.price * c.qty), 0);
  
  if (state.cart.length === 0) {
    setNotif("Cart is empty.");
    setTimeout(() => setNotif(""), 1500);
    return;
  }
  
  const cust = ensureCustomer(setState, state, customerName || "Walk-in", (customerPhone || "").trim(), religion, general);
  const items = state.cart.map(c => ({ ...c }));
  const subtotal = cartSubtotal;
  const total = Math.max(0, subtotal - parseNum(discount));
  const invoiceNo = genInvoiceNumber(state.bills);
  const bill = {
    id: uid(),
    invoiceNo,
    createdAt: todayISO(),
    customer: { id: cust.id, name: cust.name, phone: cust.phone, religion: cust.religion, general: cust.general },
    items,
    subtotal,
    discount: parseNum(discount),
    total,
    status: status || "Paid",
    dueDate: status === "Pending" ? (dueDate || todayISO()) : null,
  };

  // decrease stock
  const newProducts = state.products.map(p => {
    const line = items.find(i => i.id === p.id);
    return line ? { ...p, qty: Math.max(0, p.qty - line.qty) } : p;
  });

  // save & reset cart
  setState(prev => ({ ...prev, products: newProducts, bills: [bill, ...prev.bills], cart: [] }));
  setTab("Bills");

  // Generate and download PDF
  const blob = genPDF(bill, state.shop);
  const filename = `${invoiceNo}.pdf`;
  downloadFile(filename, blob, "application/pdf");

  // WhatsApp share link (prefilled text)
  const invoiceLink = `${window.location.origin}/invoice/${invoiceNo}`;
  const msg = [
    `Invoice ${invoiceNo}`,
    `Customer: ${cust.name}${cust.phone ? " (" + cust.phone + ")" : ""}`,
    `Total: ${currency(total)}`,
    `Status: ${bill.status}${bill.status === "Pending" && bill.dueDate ? " (Due: " + new Date(bill.dueDate).toLocaleDateString() + ")" : ""}`,
    `Items:`,
    ...items.map(i => `- ${i.name} x ${i.qty} = ${currency(i.qty * i.price)}`),
    "",
    `View Invoice: ${invoiceLink}`,
    "Note: Attach the downloaded PDF when sending."
  ].join("\n");
  const waLink = `https://wa.me/${(cust.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  
  showToast(`Invoice created: ${invoiceNo}. Click to WhatsApp.`, () => {
    window.open(waLink, "_blank");
  });
}

export function showToast(text, onClick) {
  const el = document.createElement("div");
  el.textContent = text;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    background: "#1b6",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    zIndex: 9999,
    boxShadow: "0 4px 16px rgba(0,0,0,.2)"
  });
  el.onclick = () => {
    onClick && onClick();
    document.body.removeChild(el);
  };
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 8000);
}