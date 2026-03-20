"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import Header from "../components/Header";
import Card, { CardHeader, CardTitle, CardContent } from "../components/Card";
import Button from "../components/Button";
import AccountHoldings from "../components/AccountHoldings";
import TransferUSDC from "../components/TransferUSDC";
import ReceiveModal from "../components/ReceiveModal";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { INVESTMENT_RANGES, COUNTRY_CODES, type UserProfile } from "@/types/user";

const IN = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#2DD4D4]/40 focus:outline-none transition";
const SEL = "w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:border-[#2DD4D4]/40 focus:outline-none transition";

export default function AccountPage() {
  const router = useRouter();
  const { logout, user } = usePrivy();
  const { isConnected } = useAccount();

  const walletAddress = user?.wallet?.address ?? "";
  const { profile, isLoading, saveProfile } = useUserProfile(walletAddress || undefined);

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/auctions");
  };

  return (
    <div className="min-h-screen text-white bg-[#07090A]">
      <Header />

      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(45,212,212,0.10),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(255,255,255,0.05),transparent_55%),radial-gradient(circle_at_20%_70%,rgba(45,212,212,0.06),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">Mi Cuenta</h1>
          <Button variant="secondary" onClick={handleLogout}>Desconectar</Button>
        </div>

        {!isConnected ? (
          <Card>
            <CardHeader><CardTitle>Billetera No Conectada</CardTitle></CardHeader>
            <CardContent>
              <p className="text-white/70 mb-4">Por favor conecta tu billetera para ver los detalles de tu cuenta.</p>
              <Button onClick={() => router.push("/")} variant="primary">Ir al Inicio</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <AccountHoldings />

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="primary" fullWidth onClick={() => setShowReceiveModal(true)}>Recibir</Button>
              <Button variant="primary" fullWidth onClick={() => setShowSendForm(!showSendForm)}>Enviar</Button>
            </div>

            {showSendForm && <TransferUSDC onClose={() => setShowSendForm(false)} />}

            {/* Profile Section */}
            {isLoading ? (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-center text-sm text-white/30">
                Cargando perfil…
              </div>
            ) : editing ? (
              <ProfileEditForm
                profile={profile}
                walletAddress={walletAddress}
                privyUserId={user?.id ?? ""}
                defaultEmail={user?.email?.address ?? user?.google?.email ?? ""}
                saveProfile={saveProfile}
                onDone={() => setEditing(false)}
              />
            ) : (
              <ProfileCard profile={profile} onEdit={() => setEditing(true)} />
            )}
          </div>
        )}
      </div>

      <ReceiveModal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} />
    </div>
  );
}

// ─── Profile Display ──────────────────────────────────────────────────────────

function ProfileCard({ profile, onEdit }: { profile: UserProfile | null; onEdit: () => void }) {
  if (!profile) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Perfil incompleto</p>
          <p className="text-xs text-white/40 mt-0.5">Completa tu perfil para acceder a todas las funciones.</p>
        </div>
        <button onClick={onEdit} className="rounded-lg bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 px-3 py-1.5 text-xs font-semibold text-[#2DD4D4] hover:bg-[#2DD4D4]/20 transition">
          Completar
        </button>
      </div>
    );
  }

  const rows: [string, string][] = [
    ["Nombre Completo", `${profile.name} ${profile.lastName}`],
    ["Correo", profile.email],
    ["Teléfono", `${profile.phoneCountryCode} ${profile.phoneNumber}`],
    ["Rango de Inversión", profile.expectedInvestment],
    ["Miembro Desde", new Date(profile.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })],
  ];

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#2DD4D4]/15 border border-[#2DD4D4]/20 flex items-center justify-center text-sm font-bold text-[#2DD4D4]">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{profile.name} {profile.lastName}</p>
            <p className="text-xs text-white/40">Perfil de Inversor</p>
          </div>
        </div>
        <button onClick={onEdit} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white transition">
          Editar
        </button>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-5 py-3">
            <span className="text-xs text-white/40">{label}</span>
            <span className="text-sm text-white font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile Edit Form ────────────────────────────────────────────────────────

function ProfileEditForm({
  profile,
  walletAddress,
  privyUserId,
  defaultEmail,
  saveProfile,
  onDone,
}: {
  profile: UserProfile | null;
  walletAddress: string;
  privyUserId: string;
  defaultEmail: string;
  saveProfile: (data: Omit<UserProfile, "onboardingCompleted" | "createdAt">) => Promise<UserProfile>;
  onDone: () => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [email, setEmail] = useState(profile?.email ?? defaultEmail);
  const [phoneCountryCode, setPhoneCountryCode] = useState(profile?.phoneCountryCode ?? "+1");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? "");
  const [expectedInvestment, setExpectedInvestment] = useState(profile?.expectedInvestment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const valid = name.trim().length >= 2 && lastName.trim().length >= 2 && email.includes("@") && !!expectedInvestment;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setError("");
    try {
      await saveProfile({ walletAddress, privyUserId, name: name.trim(), lastName: lastName.trim(), email: email.trim(), phoneCountryCode, phoneNumber: phoneNumber.trim(), expectedInvestment });
      onDone();
    } catch {
      setError("Error al guardar. Por favor intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Editar Perfil</p>
        <button onClick={onDone} className="text-xs text-white/30 hover:text-white/60 transition">✕ Cancelar</button>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan" className={IN} />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Apellido</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="García" className={IN} />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Correo</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@ejemplo.com" className={IN} />
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Teléfono</label>
          <div className="flex gap-2">
            <select value={phoneCountryCode} onChange={(e) => setPhoneCountryCode(e.target.value)} className={`${SEL} w-auto flex-shrink-0`}>
              {COUNTRY_CODES.map((c) => (
                <option key={c.code + c.country} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="555 0100" type="tel" className={IN} />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Rango de Inversión</label>
          <div className="grid grid-cols-1 gap-1.5">
            {INVESTMENT_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setExpectedInvestment(range)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition ${
                  expectedInvestment === range
                    ? "border-[#2DD4D4]/40 bg-[#2DD4D4]/10 text-[#2DD4D4] font-semibold"
                    : "border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}


        <button
          onClick={submit}
          disabled={!valid || saving}
          className="w-full rounded-lg bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 px-4 py-2.5 text-sm font-semibold text-[#2DD4D4] hover:bg-[#2DD4D4]/20 disabled:opacity-40 transition"
        >
          {saving ? "Guardando…" : "Guardar Perfil"}
        </button>
      </div>
    </div>
  );
}
