"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TankerTruckIcon from "@/components/TankerTruckIcon";

export default function CreateDispatchJobButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handle() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/dispatch`, { method: "POST" });
    const data = await res.json();
    if (res.ok || res.status === 409) {
      router.refresh();
    } else {
      setError(data.error ?? "Failed to create dispatch job");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handle}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", background: "#2563eb", color: "#fff",
          border: "none", borderRadius: 8, cursor: loading ? "default" : "pointer",
          fontSize: 13, fontWeight: 600, opacity: loading ? 0.7 : 1,
        }}
      >
        <TankerTruckIcon size={13} />
        {loading ? "Sending…" : "Send to Dispatch"}
      </button>
      {error && <p style={{ color: "#dc2626", fontSize: 12, margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}
