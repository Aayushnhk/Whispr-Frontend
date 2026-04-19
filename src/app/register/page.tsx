"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_URL || "";

  const validatePassword = (p: string) =>
    p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[!@#$%^&*(),.?":{}|<>]/.test(p);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!validatePassword(password)) {
      setError("Password must be 8+ chars with uppercase, lowercase, number, and special character.");
      return;
    }
    if (!BACKEND_URL) { setError("Backend not configured."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Account created! Redirecting to sign in...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0f0f10",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "0.85rem 1rem", color: "#e8e4dc",
    fontFamily: "system-ui,sans-serif", fontSize: "0.88rem",
    outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.68rem", letterSpacing: "0.1em",
    textTransform: "uppercase", color: "#6b6860",
    display: "block", marginBottom: "0.4rem",
  };

  return (
    <main style={{ background: "#080809", minHeight: "100vh", color: "#e8e4dc", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>

      {/* Left — form */}
      <div style={{ padding: "clamp(3rem,8vw,6rem) clamp(1.5rem,5vw,4rem)", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" style={{ fontFamily: "Georgia,serif", fontSize: "1.1rem", color: "#e8e4dc", textDecoration: "none", display: "inline-block", marginBottom: "3rem" }}>
          Whispr
        </Link>

        <div style={{ maxWidth: "360px", width: "100%" }}>
          <div style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6860", marginBottom: "0.8rem" }}>
            get started
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 400, marginBottom: "2.5rem", lineHeight: 1.15 }}>
            Create your<br />account
          </h1>

          {error && (
            <div style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.78rem", color: "#f87171", marginBottom: "1.2rem", paddingLeft: "1rem", borderLeft: "2px solid #f87171" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.78rem", color: "#4caf86", marginBottom: "1.2rem", paddingLeft: "1rem", borderLeft: "2px solid #4caf86" }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={labelStyle}>first name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={loading} placeholder="Aayush" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>last name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required disabled={loading} placeholder="Sharma" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} placeholder="your@email.com" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>password</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} placeholder="8+ chars, uppercase, number, symbol" style={{ ...inputStyle, paddingRight: "3rem" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b6860", cursor: "pointer", fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                  {showPassword ? "hide" : "show"}
                </button>
              </div>
              {password && !validatePassword(password) && (
                <div style={{ fontSize: "0.7rem", color: "#f87171", marginTop: "0.4rem" }}>
                  needs uppercase, lowercase, number and special character
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} style={{
              background: "#e8e4dc", color: "#080809",
              fontFamily: "system-ui,sans-serif", fontSize: "0.75rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              fontWeight: 500, padding: "0.9rem",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1, marginTop: "0.5rem",
            }}>
              {loading ? "creating account..." : "create account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link href="/login" style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.78rem", color: "#6b6860", textDecoration: "none" }}>
              already have an account? sign in →
            </Link>
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ padding: "clamp(3rem,8vw,6rem) clamp(1.5rem,5vw,4rem)", display: "flex", flexDirection: "column", justifyContent: "center", gap: "0" }} className="register-right">
        <div style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6860", marginBottom: "2rem" }}>
          what you get
        </div>
        {[
          "Instant public and private messaging",
          "File and media sharing up to 25MB",
          "Real-time typing indicators and presence",
          "Create and manage your own chat rooms",
          "Admin controls and moderation tools",
          "Profile customization with avatar upload",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#e8e4dc", flexShrink: 0 }} />
            <span style={{ fontSize: "0.82rem", color: "#a8a49e" }}>{item}</span>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) { .register-right { display: none !important; } }
      `}</style>
    </main>
  );
}