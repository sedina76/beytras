"use client";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
};

type Key = "emailEnabled" | "smsEnabled" | "whatsappEnabled";

export default function NotificationToggles({ emailEnabled, smsEnabled, whatsappEnabled }: Props) {
  const [state, setState] = useState({ emailEnabled, smsEnabled, whatsappEnabled });
  const [saving, setSaving] = useState<Key | null>(null);
  const [saved, setSaved] = useState<Key | null>(null);

  async function toggle(key: Key) {
    const next = !state[key];
    setSaving(key);
    setSaved(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next }),
    });
    setSaving(null);
    if (res.ok) {
      setState(s => ({ ...s, [key]: next }));
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
  }

  const channels: { key: Key; label: string; description: string }[] = [
    { key: "emailEnabled", label: "Email Notifications", description: "Order updates, invoices, alerts via email" },
    { key: "smsEnabled", label: "SMS Notifications", description: "Delivery alerts and driver updates via SMS" },
    { key: "whatsappEnabled", label: "WhatsApp Notifications", description: "Order & delivery updates via WhatsApp" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {channels.map(({ key, label, description }) => {
        const on = state[key];
        const busy = saving === key;
        const justSaved = saved === key;
        return (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{label}</p>
              <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: 0 }}>{description}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {justSaved && <CheckCircle2 size={14} color="#16a34a" />}
              <button
                onClick={() => toggle(key)}
                disabled={busy}
                aria-label={`Toggle ${label}`}
                style={{
                  position: "relative",
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: "none",
                  cursor: busy ? "default" : "pointer",
                  background: on ? "#2563eb" : "#d1d5db",
                  transition: "background 0.2s",
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                {busy ? (
                  <Loader2
                    size={14}
                    color="#fff"
                    style={{
                      animation: "spin 0.8s linear infinite",
                      position: "absolute",
                      top: 5,
                      left: on ? 24 : 6,
                    }}
                  />
                ) : (
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: on ? 23 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
