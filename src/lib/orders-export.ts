// ============================================================
// ORDER EXPORT HELPERS (client-side)
// Purpose: CSV / Excel / PDF / Print exports of the rows already
//          loaded in the admin order table.
// Security: Exports only re-use rows the signed-in account was
//          already permitted to read — no extra data is fetched.
// ============================================================
import { formatBDT } from "@/lib/format";
import type { AdminOrderListRow } from "@/lib/orders.functions";
import { deliveryZoneLabel, paymentMethodLabel, statusLabel } from "@/lib/orders.shared";

const HEADER = [
  "Invoice",
  "Date",
  "Customer",
  "Phone",
  "Address",
  "City",
  "Zone",
  "Products",
  "Subtotal",
  "Discount",
  "Shipping",
  "Advance",
  "Due",
  "Total",
  "Payment method",
  "Payment status",
  "Transaction ID",
  "Order status",
  "Courier",
  "Consignment",
  "Courier status",
  "Source",
  "Created by",
  "Assigned",
];

const due = (row: AdminOrderListRow) =>
  Math.max(Number(row.total) - Number(row.advance_paid ?? 0), 0);

const toCells = (row: AdminOrderListRow): (string | number)[] => [
  row.invoice_no,
  new Date(row.created_at).toLocaleString("en-GB"),
  row.customer_name,
  row.customer_phone,
  row.address_line,
  row.city,
  deliveryZoneLabel(row.delivery_zone),
  row.order_items.map((item) => `${item.product_name} x${item.quantity}`).join(" | "),
  row.subtotal,
  row.discount,
  row.shipping,
  row.advance_paid ?? 0,
  due(row),
  row.total,
  paymentMethodLabel(row.payment_method),
  statusLabel(row.payment_status),
  row.transaction_id ?? "",
  statusLabel(row.status),
  row.courier_name ?? "",
  row.consignment_id ?? "",
  statusLabel(row.courier_status),
  statusLabel(row.order_source),
  row.created_by_label ?? "",
  row.assigned_to_label ?? "N/A",
];

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char,
  );

// ------------------------------------------------------------
// XLSX EXPORT (reference-format: one row per order)
// Columns mirror the operations sheet used by the team.
// ------------------------------------------------------------
const XLSX_HEADER = [
  "Invoice No",
  "Date",
  "Customer Name",
  "Phone",
  "Full Address",
  "Products",
  "Subtotal",
  "Shipping",
  "Discount",
  "Total Amount",
  "Payment Method",
  "Payment Status",
  "Order Status",
  "Courier",
  "Tracking ID",
  "Created By",
] as const;

/** Column widths (characters) tuned for readability in Excel. */
const XLSX_WIDTHS = [14, 12, 22, 16, 42, 40, 11, 10, 10, 13, 15, 14, 14, 14, 18, 16];

/** Full address = street + city + zone, joined for a single readable cell. */
const fullAddress = (row: AdminOrderListRow) =>
  [row.address_line, row.city, deliveryZoneLabel(row.delivery_zone)]
    .map((part) => (part ?? "").toString().trim())
    .filter(Boolean)
    .join(", ");

const productsCell = (row: AdminOrderListRow) =>
  row.order_items
    .map((item) =>
      [item.product_name, item.variant ? `[${item.variant}]` : "", `(x${item.quantity})`]
        .filter(Boolean)
        .join(" "),
    )
    .join("\n");

const toXlsxRow = (row: AdminOrderListRow) => [
  row.invoice_no,
  new Date(row.created_at).toLocaleDateString("en-GB"),
  row.customer_name,
  row.customer_phone,
  fullAddress(row),
  productsCell(row),
  Number(row.subtotal),
  Number(row.shipping),
  Number(row.discount),
  Number(row.total),
  paymentMethodLabel(row.payment_method),
  statusLabel(row.payment_status),
  statusLabel(row.status),
  row.courier_name || "N/A",
  row.consignment_id || row.courier_tracking_id || "N/A",
  row.created_by_label || "N/A",
];

/**
 * Real .xlsx export (SheetJS) — works for a single selected order or many.
 * Money columns stay numeric so Excel can sum/filter them.
 */
export const exportOrdersXlsx = async (rows: AdminOrderListRow[], name = "czp-orders") => {
  const XLSX = await import("xlsx");
  const data = [[...XLSX_HEADER], ...rows.map(toXlsxRow)];
  const sheet = XLSX.utils.aoa_to_sheet(data);

  sheet["!cols"] = XLSX_WIDTHS.map((wch) => ({ wch }));
  sheet["!rows"] = data.map((_, index) => (index === 0 ? { hpt: 22 } : { hpt: 18 }));
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(rows.length, 1), c: XLSX_HEADER.length - 1 },
    }),
  };
  sheet["!freeze"] = { xSplit: "0", ySplit: "1" };

  // Header styling + numeric formats for the money columns (6..9).
  for (let c = 0; c < XLSX_HEADER.length; c += 1) {
    const headerCell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
    if (headerCell) {
      headerCell.s = {
        font: { bold: true, name: "Arial", sz: 11 },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
      };
    }
  }
  for (let r = 1; r <= rows.length; r += 1) {
    for (const c of [6, 7, 8, 9]) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell) cell.z = "#,##0.00";
    }
    const addressCell = sheet[XLSX.utils.encode_cell({ r, c: 4 })];
    if (addressCell) addressCell.s = { alignment: { wrapText: true, vertical: "top" } };
    const products = sheet[XLSX.utils.encode_cell({ r, c: 5 })];
    if (products) products.s = { alignment: { wrapText: true, vertical: "top" } };
  }

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Orders");
  const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
  download(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${name}.xlsx`,
  );
};

/** CSV export. */
export const exportOrdersCsv = (rows: AdminOrderListRow[], name = "czp-orders") => {
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const body = rows.map((row) => toCells(row).map(cell).join(","));
  download(
    new Blob([[HEADER.map(cell).join(","), ...body].join("\n")], {
      type: "text/csv;charset=utf-8;",
    }),
    `${name}.csv`,
  );
};

/** Excel export — an HTML table Excel opens natively (no extra dependency). */
export const exportOrdersExcel = (rows: AdminOrderListRow[], name = "czp-orders") => {
  const html = `<table><thead><tr>${HEADER.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr>${toCells(row)
          .map((value) => `<td>${escapeHtml(String(value))}</td>`)
          .join("")}</tr>`,
    )
    .join("")}</tbody></table>`;
  download(
    new Blob([`<html><head><meta charset="utf-8" /></head><body>${html}</body></html>`], {
      type: "application/vnd.ms-excel",
    }),
    `${name}.xls`,
  );
};

/**
 * Print / PDF export — opens a clean printable sheet in a new window.
 * The browser print dialog provides "Save as PDF".
 */
export const printOrders = (rows: AdminOrderListRow[], title = "Orders") => {
  const win = window.open("", "_blank", "width=1200,height=800");
  if (!win) return;
  const body = rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.invoice_no)}</td>
        <td>${escapeHtml(new Date(row.created_at).toLocaleString("en-GB"))}</td>
        <td>${escapeHtml(row.customer_name)}<br /><small>${escapeHtml(row.customer_phone)}</small></td>
        <td>${escapeHtml(row.order_items.map((i) => `${i.product_name} x${i.quantity}`).join(", "))}</td>
        <td>${escapeHtml(statusLabel(row.status))}</td>
        <td style="text-align:right">${escapeHtml(formatBDT(Number(row.total)))}</td>
        <td style="text-align:right">${escapeHtml(formatBDT(due(row)))}</td>
      </tr>`,
    )
    .join("");
  win.document
    .write(`<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title>
    <style>
      body{font-family:system-ui,Arial,sans-serif;padding:24px;color:#111}
      h1{font-size:18px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f4f4f5;text-transform:uppercase;font-size:10px;letter-spacing:.05em}
    </style></head><body>
      <h1>CUSTOMZ PARADISE BD — ${escapeHtml(title)}</h1>
      <table><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Products</th><th>Status</th><th>Total</th><th>Due</th></tr></thead>
      <tbody>${body}</tbody></table>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
};
