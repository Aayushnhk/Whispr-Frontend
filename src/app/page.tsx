"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const features = [
  { icon: "⚡", title: "Instant messaging", desc: "WebSocket-powered real-time chat. Zero delay, zero polling." },
  { icon: "🏠", title: "Public rooms", desc: "Create topic rooms anyone can join. Or keep it private." },
  { icon: "🔒", title: "Private DMs", desc: "One-on-one conversations with end-to-end delivery." },
  { icon: "📎", title: "File sharing", desc: "Images, videos, documents up to 25MB — inline in chat." },
  { icon: "👁", title: "Live presence", desc: "See who's online and who's typing in real time." },
  { icon: "🛡", title: "Admin controls", desc: "Full moderation — ban users, manage rooms, control access." },
];

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/chat");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "32px", height: "32px", border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)", fontFamily: "inherit" }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.2rem clamp(1.5rem,5vw,4rem)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(13,15,26,0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", background: "var(--accent)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth="2" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--text)" }}>
            Whispr
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: "0.85rem", color: "var(--muted)", textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "8px", transition: "color 0.2s" }}>
            Sign in
          </Link>
          <Link href="/register" style={{
            fontSize: "0.85rem", fontWeight: 600,
            background: "var(--accent)", color: "#fff",
            textDecoration: "none", padding: "0.5rem 1.2rem",
            borderRadius: "8px", transition: "opacity 0.2s",
          }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "6rem clamp(1.5rem,5vw,4rem) 4rem", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "var(--accent-glow)", border: "1px solid var(--border)",
          borderRadius: "100px", padding: "0.3rem 0.9rem",
          fontSize: "0.72rem", color: "var(--accent-light)",
          letterSpacing: "0.04em", marginBottom: "2rem",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "pulse 2s infinite" }} />
          Live — real-time WebSocket messaging
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>

        <h1 style={{
          fontSize: "clamp(2.8rem,6vw,5.5rem)", fontWeight: 800,
          lineHeight: 1.05, letterSpacing: "-0.03em",
          color: "var(--text)", marginBottom: "1.5rem",
        }}>
          Chat rooms for<br />
          <span style={{ color: "var(--accent-light)" }}>real conversations</span>
        </h1>

        <p style={{ fontSize: "clamp(1rem,2vw,1.2rem)", color: "var(--muted)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 3rem" }}>
          Public rooms, private messages, file sharing, and live presence. Built with WebSockets for zero-latency communication.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{
            fontWeight: 600, fontSize: "0.95rem",
            background: "var(--accent)", color: "#fff",
            textDecoration: "none", padding: "0.85rem 2.5rem",
            borderRadius: "10px", boxShadow: "0 0 24px rgba(99,102,241,0.35)",
          }}>
            Start chatting — it's free
          </Link>
          <Link href="/login" style={{
            fontWeight: 500, fontSize: "0.95rem",
            color: "var(--muted)", textDecoration: "none",
            padding: "0.85rem 2rem", borderRadius: "10px",
            border: "1px solid var(--border-subtle)",
          }}>
            Sign in →
          </Link>
        </div>
      </section>

      {/* Chat preview */}
      <section style={{ maxWidth: "800px", margin: "0 auto 5rem", padding: "0 clamp(1.5rem,5vw,4rem)" }}>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "16px", overflow: "hidden",
          boxShadow: "0 0 60px rgba(99,102,241,0.08)",
        }}>
          {/* Header */}
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--green)" }} />
            <span style={{ fontWeight: 600, fontSize: "0.88rem" }}># general</span>
            <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--muted)" }}>247 online</span>
          </div>
          {/* Messages */}
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { user: "Alex M.", avatar: "A", text: "just pushed the websocket changes, latency is now under 50ms 🚀", time: "2:41 PM", self: false },
              { user: "You", avatar: "Y", text: "incredible, testing it now", time: "2:42 PM", self: true },
              { user: "Sam K.", avatar: "S", text: "is typing...", time: "", typing: true, self: false },
            ].map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", flexDirection: msg.self ? "row-reverse" : "row" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                  background: msg.self ? "var(--accent)" : "var(--surface2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.72rem", fontWeight: 700, color: msg.self ? "#fff" : "var(--muted)",
                }}>
                  {msg.avatar}
                </div>
                <div style={{ maxWidth: "70%" }}>
                  {!msg.self && <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginBottom: "0.3rem", fontWeight: 500 }}>{msg.user}</div>}
                  <div style={{
                    padding: "0.65rem 0.9rem", borderRadius: msg.self ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    background: msg.self ? "var(--accent)" : "var(--surface2)",
                    fontSize: "0.85rem", lineHeight: 1.5,
                    color: msg.typing ? "var(--muted)" : (msg.self ? "#fff" : "var(--text)"),
                    fontStyle: msg.typing ? "italic" : "normal",
                  }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Input */}
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ flex: 1, background: "var(--surface2)", borderRadius: "8px", padding: "0.65rem 1rem", fontSize: "0.85rem", color: "var(--muted)", border: "1px solid var(--border-subtle)" }}>
              Message #general...
            </div>
            <div style={{ width: "36px", height: "36px", background: "var(--accent)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: "1100px", margin: "0 auto 5rem", padding: "0 clamp(1.5rem,5vw,4rem)" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
            Everything you need
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>Built for real-time communication from the ground up.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: "var(--surface)", border: "1px solid var(--border-subtle)",
              borderRadius: "12px", padding: "1.5rem",
              transition: "border-color 0.2s",
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.4rem" }}>{f.title}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: "1100px", margin: "0 auto 5rem", padding: "0 clamp(1.5rem,5vw,4rem)" }}>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "4rem 2rem", textAlign: "center",
          boxShadow: "0 0 60px rgba(99,102,241,0.06)",
        }}>
          <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Ready to start chatting?
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.95rem" }}>
            Free forever. No credit card required.
          </p>
          <Link href="/register" style={{
            fontWeight: 600, fontSize: "0.95rem",
            background: "var(--accent)", color: "#fff",
            textDecoration: "none", padding: "0.85rem 2.5rem",
            borderRadius: "10px", boxShadow: "0 0 24px rgba(99,102,241,0.3)",
          }}>
            Create your account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "2rem clamp(1.5rem,5vw,4rem)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "20px", background: "var(--accent)", borderRadius: "5px" }} />
          <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>Whispr</span>
        </div>
        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Real-time chat · Built with Next.js & WebSockets</span>
      </footer>
    </main>
  );
}