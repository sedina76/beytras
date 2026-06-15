"use client";
import React from "react";
import StatusBadge from "./StatusBadge";

type Column<T> = { key: string; label: string; format?: "bold" | "badge" | "yesno" | "order-link" | "actions" };

export default function DataTable<T>({ columns, data }: { columns: Column<T>[]; data: T[] }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: 12, boxShadow: "0 1px 2px rgba(16,24,40,0.03)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: "left", padding: "8px 10px", color: "var(--text-muted)", fontWeight: 700 }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
              {columns.map((c) => {
                const value = (row as any)[c.key];
                let cell: React.ReactNode = value as any;
                if (c.format === "bold") cell = <div style={{ fontWeight: 700 }}>{value}</div>;
                if (c.format === "badge") cell = <StatusBadge status={String(value)} />;
                if (c.format === "yesno") cell = value ? "Yes" : "No";
                if (c.format === "order-link") cell = <a href={`/orders/${value}`} style={{ color: "var(--accent)" }}>View</a>;
                if (c.format === "actions") {
                  // Generic actions: view / edit based on common keys
                  const viewHref = (row as any).orderNo ? `/orders/${(row as any).orderNo}` : (row as any).inv ? `/invoices/${(row as any).inv}` : (row as any).name ? `/customers/${encodeURIComponent((row as any).name)}` : "#";
                  cell = (
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={viewHref} style={{ color: "var(--accent)" }}>View</a>
                      <a href="#" style={{ color: "var(--text-muted)" }}>Edit</a>
                    </div>
                  );
                }

                return (
                  <td key={c.key} style={{ padding: "10px", verticalAlign: "middle", color: "var(--text-primary)" }}>{cell}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
