"use client";

type ConnectionStatus = {
  status: "connecting" | "disconnected" | "wrong-chain" | "connected";
  message: string;
  canInteract: boolean;
};

type WalletStatusBannerProps = {
  connectionStatus: ConnectionStatus;
  isChainMismatch: boolean;
  chainName: string;
  onSwitchChain: () => void;
  isSwitching?: boolean;
};

export function WalletStatusBanner({
  connectionStatus,
  isChainMismatch,
  chainName,
  onSwitchChain,
  isSwitching = false,
}: WalletStatusBannerProps) {
  if (connectionStatus.status === "connecting") {
    return (
      <div
        style={{
          background: "rgba(14, 165, 233, 0.12)",
          border: "1px solid rgba(14, 165, 233, 0.3)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(14, 165, 233, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 18,
          }}
        >
          ⏳
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#38bdf8", marginBottom: 2 }}>
            Restoring wallet session
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {connectionStatus.message || "Hold tight while we reconnect"}
          </div>
        </div>
      </div>
    );
  }

  // Don't show banner if everything is ok
  if (connectionStatus.status === "connected") {
    return null;
  }

  if (connectionStatus.status === "disconnected") {
    return (
      <div
        style={{
          background: "rgba(251, 191, 36, 0.1)",
          border: "1px solid rgba(251, 191, 36, 0.3)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(251, 191, 36, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 18 }}>⚠️</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#fbbf24", marginBottom: 2 }}>
            Wallet Not Connected
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            Please connect your wallet to access this page
          </div>
        </div>
      </div>
    );
  }

  if (connectionStatus.status === "wrong-chain" && isChainMismatch) {
    return (
      <div
        style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 18 }}>🔗</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#ef4444", marginBottom: 2 }}>
            Wrong Network
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            Please switch to {chainName} to continue
          </div>
        </div>
        <button
          onClick={onSwitchChain}
          disabled={isSwitching}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: "#ef4444",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: isSwitching ? "not-allowed" : "pointer",
            opacity: isSwitching ? 0.6 : 1,
            transition: "all 150ms",
          }}
        >
          {isSwitching ? "Switching..." : "Switch Network"}
        </button>
      </div>
    );
  }

  return null;
}

type ChainIndicatorProps = {
  chainName: string;
  isConnected: boolean;
};

export function ChainIndicator({
  chainName,
  isConnected,
}: ChainIndicatorProps) {
  if (!isConnected) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(45,212,212,0.1)",
        border: "1px solid rgba(45,212,212,0.2)",
        fontSize: 12,
        color: "#67e8f9",
        fontWeight: 600,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#22c55e",
        }}
      />
      {chainName}
    </div>
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid rgba(45,212,212,0.2)",
          borderTopColor: "#2DD4D4",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
        {message}
      </div>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
        }}
      >
        ❌
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "white", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          {title}
        </div>
        {message && (
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            {message}
          </div>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            background: "#2DD4D4",
            color: "#0f172a",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
