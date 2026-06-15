"use client";
import React from "react";

export default function PageHeader({ title, breadcrumb, children }: { title: string; breadcrumb?: string[]; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{title}</h1>
        {breadcrumb && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
            {breadcrumb.map((b, i) => (
              <span key={i} style={{ color: i === breadcrumb.length - 1 ? "var(--accent)" : "var(--text-muted)" }}>{b}</span>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
