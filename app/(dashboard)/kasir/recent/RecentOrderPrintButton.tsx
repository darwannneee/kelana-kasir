"use client";
import { Printer } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

type PrintableOrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  note?: string | null;
};

type PrintableOrder = {
  order_number: string;
  total_amount: number;
  payment_method: string;
  payment_amount: number;
  change_amount: number;
  created_at: string;
  cashier?: { full_name: string } | null;
  order_items?: PrintableOrderItem[];
};

const paymentLabels: Record<string, string> = {
  cash: "Cash",
  qris: "QRIS",
  transfer: "Transfer",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatReceiptDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentOrderPrintButton({ order }: { order: PrintableOrder }) {
  function printOrder() {
    const items = order.order_items || [];
    const receiptDate = formatReceiptDate(order.created_at);
    const cashierName = order.cashier?.full_name || "-";
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const customerRows = items
      .map((item) => {
        const note = item.note?.trim();

        return `
          <div class="item">
            <div class="item-main">
              <div>
                <div class="item-name">${escapeHtml(item.product_name)}</div>
                <div class="muted">${item.quantity} x ${formatRupiah(item.unit_price)}</div>
              </div>
              <div class="price">${formatRupiah(item.subtotal)}</div>
            </div>
            ${note ? `<div class="note">Note: ${escapeHtml(note)}</div>` : ""}
          </div>
        `;
      })
      .join("");

    const kitchenRows = items
      .map((item) => {
        const note = item.note?.trim();

        return `
          <div class="kitchen-item">
            <div class="qty">${item.quantity}x</div>
            <div>
              <div class="kitchen-name">${escapeHtml(item.product_name)}</div>
              ${note ? `<div class="kitchen-note">Note: ${escapeHtml(note)}</div>` : ""}
            </div>
          </div>
        `;
      })
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title> </title>
          <style>
            @page { size: 58mm 210mm; margin: 0; }
            * { box-sizing: border-box; }
            html, body {
              width: 58mm;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
              font-size: 9px;
              line-height: 1.35;
            }
            .receipt { width: 58mm; padding: 3mm; background: #fff; }
            .receipt + .receipt { break-before: page; page-break-before: always; }
            .center { text-align: center; }
            .brand { font-size: 15px; font-weight: 800; }
            .copy-label {
              display: inline-block;
              margin-top: 4px;
              padding: 2px 6px;
              border: 1px solid #000;
              border-radius: 999px;
              font-size: 8px;
              font-weight: 800;
            }
            .muted { color: #333; }
            .divider { border: 0; border-top: 1px dashed #000; margin: 8px 0; }
            .row, .item-main, .total-row { display: flex; justify-content: space-between; gap: 8px; }
            .item { margin-bottom: 7px; }
            .item-name { font-weight: 800; }
            .price { flex-shrink: 0; font-weight: 800; text-align: right; }
            .note { margin-top: 2px; padding-left: 8px; color: #111; font-size: 9px; }
            .total-row { font-size: 11px; font-weight: 900; }
            .footer { margin-top: 10px; text-align: center; font-size: 9px; }
            .kitchen-title { font-size: 16px; font-weight: 900; }
            .kitchen-item {
              display: grid;
              grid-template-columns: 20px 1fr;
              gap: 6px;
              padding: 8px 0;
              border-bottom: 1px dashed #000;
            }
            .qty { font-size: 14px; font-weight: 900; }
            .kitchen-name { font-size: 12px; font-weight: 900; }
            .kitchen-note { margin-top: 3px; font-size: 10px; font-weight: 700; }
          </style>
        </head>
        <body>
          <section class="receipt">
            <div class="center">
              <div class="brand">KelanaRasa</div>
              <div class="muted">Struk Pembayaran</div>
              <div class="copy-label">CUSTOMER COPY</div>
            </div>
            <hr class="divider" />
            <div class="row"><span>No Order</span><strong>${escapeHtml(order.order_number)}</strong></div>
            <div class="row"><span>Tanggal</span><strong>${receiptDate}</strong></div>
            <div class="row"><span>Kasir</span><strong>${escapeHtml(cashierName)}</strong></div>
            <div class="row"><span>Metode</span><strong>${paymentLabels[order.payment_method] || order.payment_method}</strong></div>
            <div class="row"><span>Total Item</span><strong>${itemCount}</strong></div>
            <hr class="divider" />
            ${customerRows}
            <hr class="divider" />
            <div class="total-row"><span>Total</span><span>${formatRupiah(order.total_amount)}</span></div>
            <div class="row"><span>Bayar</span><strong>${formatRupiah(order.payment_amount)}</strong></div>
            ${order.payment_method === "cash" ? `<div class="row"><span>Kembali</span><strong>${formatRupiah(order.change_amount)}</strong></div>` : ""}
            <hr class="divider" />
            <div class="footer">Terima kasih sudah berbelanja.<br />Barang yang sudah dibeli tidak dapat dikembalikan.</div>
          </section>

          <section class="receipt">
            <div class="center">
              <div class="brand">KelanaRasa</div>
              <div class="kitchen-title">ORDER DAPUR</div>
              <div class="copy-label">KITCHEN COPY</div>
            </div>
            <hr class="divider" />
            <div class="row"><span>No Order</span><strong>${escapeHtml(order.order_number)}</strong></div>
            <div class="row"><span>Waktu</span><strong>${receiptDate}</strong></div>
            <div class="row"><span>Kasir</span><strong>${escapeHtml(cashierName)}</strong></div>
            <div class="row"><span>Total Item</span><strong>${itemCount}</strong></div>
            <hr class="divider" />
            ${kitchenRows}
            <div class="footer">Cek note sebelum proses pesanan.</div>
          </section>
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDocument = iframe.contentDocument || frameWindow?.document;
    if (!frameWindow || !frameDocument) {
      iframe.remove();
      return;
    }

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    window.setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
      window.setTimeout(() => iframe.remove(), 1000);
    }, 100);
  }

  return (
    <button
      type="button"
      onClick={printOrder}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-bold text-zinc-700 transition hover:border-emerald-200 hover:text-emerald-700"
    >
      <Printer className="h-3.5 w-3.5" />
      Print
    </button>
  );
}
