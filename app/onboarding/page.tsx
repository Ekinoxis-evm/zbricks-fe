"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { INVESTMENT_RANGES, COUNTRY_CODES } from "@/types/user";

const STEPS = [
  { label: "Personal", title: "Cuéntanos sobre ti", subtitle: "Esto nos ayuda a personalizar tu experiencia." },
  { label: "Contacto", title: "Información de contacto", subtitle: "Te notificaremos sobre actualizaciones de subastas." },
  { label: "Inversión", title: "Perfil de inversión", subtitle: "¿Cuánto estás buscando invertir en bienes raíces?" },
] as const;

type Step = 0 | 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = usePrivy();

  const walletAddress =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address ?? "";
  const privyUserId = user?.id ?? "";

  const { saveProfile } = useUserProfile(walletAddress || undefined);

  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email?.address ?? user?.google?.email ?? "");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+57");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [expectedInvestment, setExpectedInvestment] = useState("");

  const canProceed =
    step === 0
      ? name.trim().length >= 2 && lastName.trim().length >= 2
      : step === 1
      ? email.trim().includes("@") && phoneNumber.trim().length >= 5
      : expectedInvestment !== "";

  const handleNext = () => { if (step < 2) setStep((s) => (s + 1) as Step); };
  const handleBack = () => { if (step > 0) setStep((s) => (s - 1) as Step); };

  const handleSubmit = async () => {
    if (!canProceed) return;
    setSubmitting(true);
    try {
      await saveProfile({
        walletAddress,
        privyUserId,
        name: name.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneCountryCode,
        phoneNumber: phoneNumber.trim(),
        expectedInvestment,
      });
      router.push("/account");
    } finally {
      setSubmitting(false);
    }
  };

  const currentStep = STEPS[step];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030712",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,212,212,0.07), transparent)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 520, position: "relative" }}>

        {/* Logo + welcome */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "linear-gradient(135deg, #2DD4D4 0%, #0ea5e9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 24,
            color: "#0f172a",
            margin: "0 auto 14px",
            boxShadow: "0 0 40px rgba(45,212,212,0.25)",
          }}>
            Z
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            Bienvenido a{" "}
            <span style={{ color: "#67e8f9", fontWeight: 700 }}>ZBricks</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          overflow: "hidden",
        }}>

          {/* Step progress header */}
          <div style={{
            padding: "24px 32px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {STEPS.map((s, i) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
                  {/* Circle */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    transition: "all 250ms ease",
                    background: i < step
                      ? "#2DD4D4"
                      : i === step
                      ? "rgba(45,212,212,0.15)"
                      : "rgba(255,255,255,0.05)",
                    border: i === step
                      ? "1.5px solid rgba(45,212,212,0.6)"
                      : i < step
                      ? "1.5px solid #2DD4D4"
                      : "1.5px solid rgba(255,255,255,0.12)",
                    color: i < step ? "#0f172a" : i === step ? "#2DD4D4" : "rgba(255,255,255,0.35)",
                  }}>
                    {i < step ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {/* Label */}
                  <span style={{
                    marginLeft: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: i === step ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.28)",
                    transition: "color 250ms ease",
                    whiteSpace: "nowrap",
                  }}>
                    {s.label}
                  </span>
                  {/* Connector */}
                  {i < STEPS.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: 1,
                      margin: "0 12px",
                      background: i < step
                        ? "rgba(45,212,212,0.35)"
                        : "rgba(255,255,255,0.08)",
                      transition: "background 250ms ease",
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div style={{ padding: "32px 32px 28px" }}>
            <h2 style={{
              color: "white",
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 6,
              letterSpacing: -0.3,
            }}>
              {currentStep.title}
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 14,
              marginBottom: 28,
              lineHeight: 1.55,
            }}>
              {currentStep.subtitle}
            </p>

            {/* Step 0 — Personal Info */}
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Field label="Nombre">
                  <Input value={name} onChange={setName} placeholder="Juan" autoFocus />
                </Field>
                <Field label="Apellido">
                  <Input value={lastName} onChange={setLastName} placeholder="García" />
                </Field>
              </div>
            )}

            {/* Step 1 — Contact */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Field label="Correo electrónico">
                  <Input value={email} onChange={setEmail} placeholder="juan@ejemplo.com" type="email" autoFocus />
                </Field>
                <Field label="Número de teléfono">
                  <div style={{ display: "flex", gap: 10 }}>
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        color: "white",
                        fontSize: 13,
                        padding: "11px 10px",
                        outline: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code + c.country} value={c.code} style={{ background: "#0f1a2e" }}>
                          {c.flag} {c.code} {c.country}
                        </option>
                      ))}
                    </select>
                    <Input value={phoneNumber} onChange={setPhoneNumber} placeholder="300 123 4567" type="tel" />
                  </div>
                </Field>
              </div>
            )}

            {/* Step 2 — Investment Profile */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {INVESTMENT_RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setExpectedInvestment(range)}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 12,
                      border: expectedInvestment === range
                        ? "1.5px solid rgba(45,212,212,0.5)"
                        : "1px solid rgba(255,255,255,0.08)",
                      background: expectedInvestment === range
                        ? "rgba(45,212,212,0.08)"
                        : "rgba(255,255,255,0.025)",
                      color: expectedInvestment === range ? "#67e8f9" : "rgba(255,255,255,0.65)",
                      fontSize: 14,
                      fontWeight: expectedInvestment === range ? 600 : 400,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 150ms ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {range}
                    {expectedInvestment === range && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
              {step > 0 && (
                <button
                  onClick={handleBack}
                  style={{
                    padding: "13px 22px",
                    borderRadius: 11,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "transparent",
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "border-color 150ms, color 150ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
                >
                  Atrás
                </button>
              )}
              <button
                onClick={step < 2 ? handleNext : handleSubmit}
                disabled={!canProceed || submitting}
                style={{
                  flex: 1,
                  padding: "13px 22px",
                  borderRadius: 11,
                  background: canProceed && !submitting ? "#2DD4D4" : "rgba(255,255,255,0.07)",
                  color: canProceed && !submitting ? "#0f172a" : "rgba(255,255,255,0.25)",
                  fontSize: 14,
                  fontWeight: 700,
                  border: "none",
                  cursor: canProceed && !submitting ? "pointer" : "not-allowed",
                  transition: "all 150ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {submitting ? (
                  <>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(15,23,42,0.4)", borderTopColor: "#0f172a", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    Guardando...
                  </>
                ) : step < 2 ? (
                  <>
                    Continuar
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                ) : (
                  "Comenzar a Explorar →"
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: "16px 32px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              Paso {step + 1} de {STEPS.length}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i <= step ? "#2DD4D4" : "rgba(255,255,255,0.1)",
                  transition: "all 300ms ease",
                  opacity: i < step ? 0.5 : 1,
                }} />
              ))}
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ---- Sub-components ---- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: "block",
        fontSize: 11,
        fontWeight: 700,
        color: "rgba(255,255,255,0.4)",
        marginBottom: 7,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "white",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 150ms ease",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(45,212,212,0.45)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
    />
  );
}
