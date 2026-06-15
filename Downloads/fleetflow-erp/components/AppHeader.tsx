"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/session";
import { Bell, LogOut, ChevronDown, X, CheckCheck, Info, AlertCircle, MessageSquare, Mail } from "lucide-react";

type Props = { session: SessionPayload };

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  in_app: <Info size={13} color="#2563eb" />,
  sms: <MessageSquare size={13} color="#16a34a" />,
  email: <Mail size={13} color="#7c3aed" />,
  whatsapp: <MessageSquare size={13} color="#25D366" />,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AppHeader({ session }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  // Load notification count on mount
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const initials = session.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header style={{ height: 52, background: "#fff", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 20px", gap: 14, flexShrink: 0, position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ flex: 1 }} />

      {/* Notification Bell */}
      <div ref={bellRef} style={{ position: "relative" }}>
        <button
          onClick={() => { setBellOpen(v => !v); if (!bellOpen) fetchNotifications(); }}
          style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", borderRadius: 8, position: "relative" }}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: 3, right: 3, minWidth: 16, height: 16, borderRadius: 99, background: "var(--danger)", border: "2px solid #fff", fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {bellOpen && (
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", width: 340, zIndex: 100, overflow: "hidden" }}>
            {/* Bell header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Notifications</span>
                {unreadCount > 0 && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: "var(--danger)", color: "#fff", borderRadius: 99, padding: "1px 6px" }}>{unreadCount} new</span>}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
                <button onClick={() => setBellOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, borderRadius: 4 }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {loadingNotifs ? (
                <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Loading…</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: "32px 14px", textAlign: "center" }}>
                  <Bell size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                  <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0 }}>No notifications yet</p>
                </div>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                  style={{ display: "flex", gap: 10, padding: "10px 14px", borderBottom: "1px solid #f1f5f9", background: n.isRead ? "#fff" : "#f0f7ff", cursor: n.isRead ? "default" : "pointer", transition: "background 0.15s" }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: n.isRead ? "#f1f5f9" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {TYPE_ICON[n.type] ?? <AlertCircle size={13} color="#64748b" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                      <p style={{ fontSize: 12.5, fontWeight: n.isRead ? 500 : 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>{n.title}</p>
                      {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: 3 }} />}
                    </div>
                    <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "2px 0 0", lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.body}</p>
                    <p style={{ fontSize: 10.5, color: "#94a3b8", margin: "4px 0 0" }}>{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 12.5 }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
            {initials}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>{session.name}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{session.email}</div>
          </div>
          <ChevronDown size={13} color="var(--text-muted)" />
        </button>

        {menuOpen && (
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 180, zIndex: 100 }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>{session.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{session.email}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: "var(--danger)", textAlign: "left" }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
