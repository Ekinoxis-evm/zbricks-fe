import React from "react";
import { IconCheck, IconX, IconInfo } from "./Icons";

export type Toast = {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  detail?: string;
};

type ToastNotificationProps = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

export default function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: "rgba(0,0,0,0.92)",
            border: `1px solid ${
              toast.type === "success"
                ? "#2DD4D4"
                : toast.type === "error"
                ? "#FF5A5A"
                : "rgba(255,255,255,0.2)"
            }`,
            borderRadius: 12,
            padding: "14px 18px",
            boxShadow: "0 12px 50px rgba(0,0,0,0.7)",
            backdropFilter: "blur(12px)",
            minWidth: 280,
            maxWidth: 400,
            pointerEvents: "auto",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flexShrink: 0, paddingTop: 2 }}>
              {toast.type === "success" && <IconCheck className="w-5 h-5 text-[#2DD4D4]" />}
              {toast.type === "error" && <IconX className="w-5 h-5 text-[#FF5A5A]" />}
              {toast.type === "info" && <IconInfo className="w-5 h-5 text-white/70" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color:
                    toast.type === "success"
                      ? "#2DD4D4"
                      : toast.type === "error"
                      ? "#FF5A5A"
                      : "#fff",
                  marginBottom: toast.detail ? 4 : 0,
                }}
              >
                {toast.title}
              </div>
              {toast.detail && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                  {toast.detail}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export const useToast = () => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const pushToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
};
