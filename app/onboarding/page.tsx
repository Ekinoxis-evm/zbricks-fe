"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { INVESTMENT_RANGES, COUNTRY_CODES } from "@/types/user";

const STEPS = ["Personal", "Contact", "Investment"] as const;
type Step = 0 | 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = usePrivy();
  const { saveProfile } = useUserProfile();

  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(
    user?.email?.address ?? user?.google?.email ?? ""
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [expectedInvestment, setExpectedInvestment] = useState("");

  const walletAddress =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address ?? "";
  const privyUserId = user?.id ?? "";

  // Validation per step
  const canProceed =
    step === 0
      ? name.trim().length >= 2 && lastName.trim().length >= 2
      : step === 1
      ? email.trim().includes("@") && phoneNumber.trim().length >= 5
      : expectedInvestment !== "";

  const handleNext = () => {
    if (step < 2) setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => (s - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!canProceed) return;
    setSubmitting(true);
    try {
      saveProfile({
        walletAddress,
        privyUserId,
        name: name.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneCountryCode,
        phoneNumber: phoneNumber.trim(),
        expectedInvestment,
      });
      router.push("/auctions");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030712",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #2DD4D4 0%, #0ea5e9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 22,
              color: "black",
              margin: "0 auto 12px",
            }}
          >
            Z
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            Welcome to <span style={{ color: "#67e8f9", fontWeight: 700 }}>ZBricks</span>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "32px 28px",
          }}
        >
          {/* Step indicator */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
            {STEPS.map((label, i) => (
              <div key={label} style={{ flex: 1 }}>
                <div
                  style={{
                    height: 3,
                    borderRadius: 2,
                    background:
                      i < step
                        ? "#2DD4D4"
                        : i === step
                        ? "#2DD4D4"
                        : "rgba(255,255,255,0.12)",
                    opacity: i === step ? 1 : i < step ? 0.7 : 0.3,
                    marginBottom: 6,
                    transition: "all 300ms ease",
                  }}
                />
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: i === step ? "#67e8f9" : "rgba(255,255,255,0.35)",
                    textAlign: "center",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Step 0 — Personal Info */}
          {step === 0 && (
            <div>
              <h2
                style={{
                  color: "white",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Tell us about yourself
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  marginBottom: 24,
                }}
              >
                This helps us personalize your experience.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="First Name">
                  <Input
                    value={name}
                    onChange={setName}
                    placeholder="John"
                    autoFocus
                  />
                </Field>
                <Field label="Last Name">
                  <Input
                    value={lastName}
                    onChange={setLastName}
                    placeholder="Smith"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Step 1 — Contact */}
          {step === 1 && (
            <div>
              <h2
                style={{
                  color: "white",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Contact info
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  marginBottom: 24,
                }}
              >
                We will notify you about auction updates.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Email">
                  <Input
                    value={email}
                    onChange={setEmail}
                    placeholder="john@example.com"
                    type="email"
                    autoFocus
                  />
                </Field>

                <Field label="Phone Number">
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        color: "white",
                        fontSize: 13,
                        padding: "10px 8px",
                        outline: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option
                          key={c.code + c.country}
                          value={c.code}
                          style={{ background: "#1a1a2e" }}
                        >
                          {c.flag} {c.code} {c.country}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      placeholder="555 0100"
                      type="tel"
                    />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* Step 2 — Investment Profile */}
          {step === 2 && (
            <div>
              <h2
                style={{
                  color: "white",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Investment profile
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  marginBottom: 24,
                }}
              >
                How much are you looking to invest in real estate?
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {INVESTMENT_RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setExpectedInvestment(range)}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 12,
                      border:
                        expectedInvestment === range
                          ? "1px solid rgba(45,212,212,0.6)"
                          : "1px solid rgba(255,255,255,0.10)",
                      background:
                        expectedInvestment === range
                          ? "rgba(45,212,212,0.10)"
                          : "rgba(255,255,255,0.03)",
                      color:
                        expectedInvestment === range
                          ? "#67e8f9"
                          : "rgba(255,255,255,0.7)",
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
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 28,
            }}
          >
            {step > 0 && (
              <button
                onClick={handleBack}
                style={{
                  flex: "0 0 auto",
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            )}

            <button
              onClick={step < 2 ? handleNext : handleSubmit}
              disabled={!canProceed || submitting}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 10,
                background: canProceed ? "#2DD4D4" : "rgba(255,255,255,0.08)",
                color: canProceed ? "#0f172a" : "rgba(255,255,255,0.3)",
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: canProceed ? "pointer" : "not-allowed",
                transition: "all 150ms ease",
              }}
            >
              {submitting
                ? "Saving..."
                : step < 2
                ? "Continue"
                : "Start Exploring"}
            </button>
          </div>
        </div>

        {/* Step count */}
        <div
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 12,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Step {step + 1} of {STEPS.length}
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
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
        padding: "11px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "white",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 150ms ease",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(45,212,212,0.5)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
    />
  );
}
