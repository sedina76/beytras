"use client";
import React from "react";

const colors: Record<string, string> = {
  active: "#16a34a",
  inactive: "#6b7280",
  pending: "#f59e0b",
  assigned: "#06b6d4",
  "in-transit": "#2563eb",
  delivered: "#10b981",
  cancelled: "#ef4444",
  paid: "#10b981",
  unpaid: "#ef4444",
  overdue: "#b91c1c",
};

export default function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, "-");
  const bg = colors[key] || "#6b7280";
  return (
    <span style={{ background: `${bg}22`, color: bg, padding: "6px 8px", borderRadius: 999, fontSize: 12, fontWeight: 700, display: "inline-block" }}>{status}</span>
  );
}
