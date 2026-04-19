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
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div style={{ background: "#080809", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "28px", height: "28px", border: "1px solid rgba(255,255,255,0.15)", borderTopColor: "#e8e4dc", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (isAuthenticated) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0f0f10",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "0.85rem 1rem", color: "#e8e4dc",
    fontFamily: "system-ui,sans-serif", fontSize: "0.88rem",
    outline: "none", boxSizing: "border-box",
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
            welcome back
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 400, marginBottom: "2.5rem", lineHeight: 1.15 }}>
            Sign in to<br />your account
          </h1>

          {error && (
            <div style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.78rem", color: "#f87171", marginBottom: "1.2rem", paddingLeft: "1rem", borderLeft: "2px solid #f87171" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6860", display: "block", marginBottom: "0.4rem" }}>email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} placeholder="your@email.com" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6860", display: "block", marginBottom: "0.4rem" }}>password</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} placeholder="••••••••" style={{ ...inputStyle, paddingRight: "3rem" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b6860", cursor: "pointer", fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                  {showPassword ? "hide" : "show"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              background: "#e8e4dc", color: "#080809",
              fontFamily: "system-ui,sans-serif", fontSize: "0.75rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              fontWeight: 500, padding: "0.9rem",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1, marginTop: "0.5rem",
            }}>
              {loading ? "signing in..." : "sign in"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link href="/register" style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.78rem", color: "#6b6860", textDecoration: "none" }}>
              don't have an account? sign up →
            </Link>
          </div>
        </div>
      </div>

      {/* Right — feature list */}
      <div style={{ padding: "clamp(3rem,8vw,6rem) clamp(1.5rem,5vw,4rem)", display: "flex", flexDirection: "column", justifyContent: "center", gap: "2rem" }} className="login-right">
        {[
          { title: "Public & private rooms", desc: "Jump into topic rooms or start a private conversation with anyone online." },
          { title: "Real-time everything", desc: "Messages, typing indicators, presence, file uploads — all instant." },
          { title: "Media & file sharing", desc: "Send images, videos, documents up to 25MB directly in chat." },
        ].map((f, i) => (
          <div key={i} style={{ paddingLeft: "1.5rem", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: "0.95rem", color: "#e8e4dc", marginBottom: "0.4rem" }}>{f.title}</div>
            <div style={{ fontSize: "0.78rem", color: "#6b6860", lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) { .login-right { display: none !important; } }
      `}</style>
    </main>
  );
}