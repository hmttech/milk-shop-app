import React from 'react';
import { currency } from '../../utils/helpers.js';

function Bills({ state }) {
  return (
    <div>
      <h2>Bills</h2>
      {state.bills.length === 0 ? (
        <div className="muted">No bills yet.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.bills.map(b => (
              <tr key={b.id}>
                <td>{b.invoiceNo}</td>
                <td>{b.customer?.name || "-"}</td>
                <td>{currency(b.total)}</td>
                <td>{b.status}</td>
                <td>{new Date(b.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="primary"
                    onClick={() => {
                      const invoiceLink = `${window.location.origin}/invoice/${b.invoiceNo}`;
                      const msg = [
                        `Invoice ${b.invoiceNo}`,
                        `Customer: ${b.customer?.name || "-"}${b.customer?.phone ? " (" + b.customer.phone + ")" : ""}`,
                        `Total: ${currency(b.total)}`,
                        `Status: ${b.status}${b.status === "Pending" && b.dueDate ? " (Due: " + new Date(b.dueDate).toLocaleDateString() + ")" : ""}`,
                        "Items:",
                        ...b.items.map(i => `- ${i.name} x ${i.qty} = ${currency(i.qty * i.price)}`),
                        "",
                        `View Invoice: ${invoiceLink}`,
                        "Note: Attach the downloaded PDF when sending."
                      ].join("\n");
                      const waLink = `https://wa.me/${(b.customer?.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
                      window.open(waLink, "_blank");
                    }}
                  >
                    Send to WhatsApp
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Bills;