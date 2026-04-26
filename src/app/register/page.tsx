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
    width: "100%", background: "var(--surface2)",
    border: "1px solid var(--border-subtle)",
    padding: "0.75rem 1rem", color: "var(--text)",
    fontFamily: "inherit", fontSize: "0.9rem",
    outline: "none", borderRadius: "8px", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.78rem", fontWeight: 500,
    color: "var(--muted)", display: "block", marginBottom: "0.4rem",
  };

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", marginBottom: "2.5rem", justifyContent: "center" }}>
          <div style={{ width: "32px", height: "32px", background: "var(--accent)", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text)" }}>Whispr</span>
        </Link>

        {/* Card */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "2rem" }}>
          <h1 style={{ fontWeight: 700, fontSize: "1.5rem", letterSpacing: "-0.02em", marginBottom: "0.4rem" }}>
            Create your account
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "1.8rem" }}>
            Join Whispr and start chatting instantly
          </p>

          {error && (
            <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#f87171", marginBottom: "1.2rem" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#10b981", marginBottom: "1.2rem" }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={labelStyle}>First name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={loading} placeholder="Aayush" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required disabled={loading} placeholder="Sharma" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} placeholder="you@example.com" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} placeholder="Min 8 chars, uppercase, number, symbol" style={{ ...inputStyle, paddingRight: "3.5rem" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500 }}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {password && !validatePassword(password) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                  {[
                    { label: "8+ chars", ok: password.length >= 8 },
                    { label: "Uppercase", ok: /[A-Z]/.test(password) },
                    { label: "Number", ok: /[0-9]/.test(password) },
                    { label: "Symbol", ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
                  ].map(r => (
                    <span key={r.label} style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: r.ok ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)", color: r.ok ? "#10b981" : "#f87171", border: `1px solid ${r.ok ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}` }}>
                      {r.ok ? "✓" : "✗"} {r.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", background: "var(--accent)", color: "#fff",
              fontWeight: 600, fontSize: "0.9rem",
              padding: "0.8rem", borderRadius: "8px",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, marginTop: "0.5rem",
              boxShadow: "0 0 20px rgba(99,102,241,0.25)",
            }}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent-light)", textDecoration: "none", fontWeight: 500 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}