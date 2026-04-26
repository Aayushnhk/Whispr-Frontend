"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_URL || "";

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace("/chat");
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!BACKEND_URL) { setError("Backend not configured."); setLoading(false); return; }
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        login(data.token, data.refreshToken, {
          id: data.user.id, firstName: data.user.firstName,
          lastName: data.user.lastName, email: data.user.email,
          profilePicture: data.user.profilePicture || "/default-avatar.png",
          role: data.user.role || "user",
        });
        setTimeout(() => router.replace("/chat"), 0);
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "28px", height: "28px", border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (isAuthenticated) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--surface2)",
    border: "1px solid var(--border-subtle)",
    padding: "0.75rem 1rem", color: "var(--text)",
    fontFamily: "inherit", fontSize: "0.9rem",
    outline: "none", borderRadius: "8px", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

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
            Welcome back
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "1.8rem" }}>
            Sign in to continue to Whispr
          </p>

          {error && (
            <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#f87171", marginBottom: "1.2rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--muted)", display: "block", marginBottom: "0.4rem" }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} placeholder="you@example.com" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--muted)", display: "block", marginBottom: "0.4rem" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} placeholder="••••••••" style={{ ...inputStyle, paddingRight: "3.5rem" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500 }}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", background: "var(--accent)", color: "#fff",
              fontWeight: 600, fontSize: "0.9rem",
              padding: "0.8rem", borderRadius: "8px",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, marginTop: "0.5rem",
              boxShadow: "0 0 20px rgba(99,102,241,0.25)",
            }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "var(--accent-light)", textDecoration: "none", fontWeight: 500 }}>
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}