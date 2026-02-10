"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDisconnect, useAccount } from "wagmi";
import Header from "../components/Header";
import Card, { CardHeader, CardTitle, CardContent } from "../components/Card";
import Button from "../components/Button";
import AccountHoldings from "../components/AccountHoldings";
import TransferUSDC from "../components/TransferUSDC";
import ReceiveModal from "../components/ReceiveModal";

export default function AccountPage() {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    disconnect();
    router.push("/auctions");
  };

  return (
    <div className="min-h-screen text-white bg-[#07090A]">
      <Header />

      {/* Gradient Background */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(45,212,212,0.10),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(255,255,255,0.05),transparent_55%),radial-gradient(circle_at_20%_70%,rgba(45,212,212,0.06),transparent_60%)]" />
      </div>

      {/* Main Content */}
      <div className="relative mx-auto max-w-3xl px-4 py-10">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Account</h1>
          </div>
          <Button
            variant="secondary"
            onClick={handleLogout}
          >
            Disconnect
          </Button>
        </div>

        {/* Not Connected State */}
        {!mounted || !isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Wallet Not Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 mb-4">Please connect your wallet to view your account details.</p>
              <Button onClick={() => router.push("/")} variant="primary">
                Go Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Holdings */}
            <div>
              <AccountHoldings />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="primary"
                fullWidth
                onClick={() => setShowReceiveModal(true)}
              >
                Receive
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setShowSendForm(!showSendForm)}
              >
                Send
              </Button>
            </div>

            {/* Send Form - Conditional */}
            {showSendForm && (
              <TransferUSDC onClose={() => setShowSendForm(false)} />
            )}
          </div>
        )}
      </div>

      {/* Receive Modal */}
      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
      />
    </div>
  );
}
