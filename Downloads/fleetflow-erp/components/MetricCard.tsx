"use client";
import React from "react";

export default function MetricCard({ title, value, delta }: { title: string; value: string; delta?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: 12, minWidth: 160, boxShadow: "0 1px 2px rgba(16,24,40,0.03)" }}>
      <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, color: "var(--text-primary)" }}>{value}</div>
      {delta && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{delta}</div>}
    </div>
  );
}
