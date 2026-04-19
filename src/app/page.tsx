"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const features = [
  { num: "01", title: "Public rooms", desc: "Join topic-based rooms and talk to everyone at once. Create your own in seconds." },
  { num: "02", title: "Private messaging", desc: "One-on-one encrypted conversations with anyone online." },
  { num: "03", title: "Media sharing", desc: "Images, videos, documents — up to 25MB per file, handled natively." },
  { num: "04", title: "Real-time presence", desc: "See who's online, who's typing, and get instant delivery." },
];

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/chat");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) return (
    <div style={{ background: "#080809", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "32px", height: "32px", border: "1px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <main style={{ background: "#080809", minHeight: "100vh", color: "#e8e4dc", fontFamily: "system-ui,sans-serif" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.4rem clamp(1.5rem,5vw,4rem)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontFamily: "Georgia,serif", fontSize: "1.2rem", color: "#e8e4dc", letterSpacing: "0.02em" }}>
          Whispr
        </span>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link href="/login" style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.78rem", letterSpacing: "0.05em", color: "#6b6860", textDecoration: "none" }}>
            sign in
          </Link>
          <Link href="/register" style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", background: "#e8e4dc", color: "#080809", padding: "0.5rem 1.2rem", textDecoration: "none", fontWeight: 500 }}>
            get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", minHeight: "80vh", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ padding: "clamp(3rem,8vw,6rem) clamp(1.5rem,5vw,4rem)", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6860", marginBottom: "1.5rem" }}>
            real-time messaging
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(2.8rem,6vw,5rem)", fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#e8e4dc", marginBottom: "1.5rem" }}>
            Talk to people.<br />
            <em style={{ color: "rgba(232,228,220,0.4)", fontStyle: "italic" }}>Right now.</em>
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#6b6860", lineHeight: 1.7, maxWidth: "400px", marginBottom: "3rem" }}>
            Public rooms, private conversations, file sharing, and real-time presence — all in one place. No noise. Just communication.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/register" style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", background: "#e8e4dc", color: "#080809", padding: "0.85rem 2.5rem", textDecoration: "none", fontWeight: 500 }}>
              start for free
            </Link>
            <Link href="/login" style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b6860", padding: "0.85rem 2rem", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}>
              sign in →
            </Link>
          </div>
        </div>

        {/* Right side — live preview feel */}
        <div style={{ padding: "clamp(2rem,5vw,4rem)", display: "flex", flexDirection: "column", justifyContent: "center", gap: "1px", background: "rgba(255,255,255,0.02)" }}>
          {[
            { name: "Alex M.", time: "now", text: "just shipped the new feature 🎉", self: false },
            { name: "You", time: "now", text: "nice! sending the file over", self: true },
            { name: "Sam K.", time: "now", text: "is typing...", typing: true, self: false },
          ].map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: msg.self ? "row-reverse" : "row", gap: "0.75rem", alignItems: "flex-end", padding: "0.5rem 0" }}>
              {!msg.self && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "#6b6860", flexShrink: 0 }}>
                  {msg.name[0]}
                </div>
              )}
              <div style={{ maxWidth: "70%" }}>
                {!msg.self && <div style={{ fontSize: "0.65rem", color: "#6b6860", marginBottom: "0.2rem", letterSpacing: "0.04em" }}>{msg.name}</div>}
                <div style={{
                  padding: "0.6rem 0.9rem",
                  background: msg.self ? "#e8e4dc" : "rgba(255,255,255,0.06)",
                  color: msg.self ? "#080809" : msg.typing ? "#6b6860" : "#e8e4dc",
                  fontSize: "0.82rem", lineHeight: 1.5,
                  fontStyle: msg.typing ? "italic" : "normal",
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: "2rem", padding: "0.8rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ flex: 1, fontSize: "0.78rem", color: "#3a3835" }}>type a message...</div>
            <div style={{ width: "28px", height: "28px", background: "#e8e4dc", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#080809"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {features.map((f, i) => (
          <div key={i} style={{ padding: "2.5rem clamp(1.5rem,3vw,2.5rem)", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.62rem", color: "#6b6860", letterSpacing: "0.1em", marginBottom: "1.2rem" }}>{f.num}</div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: "1rem", color: "#e8e4dc", marginBottom: "0.6rem" }}>{f.title}</div>
            <div style={{ fontSize: "0.78rem", color: "#6b6860", lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2rem clamp(1.5rem,5vw,4rem)", flexWrap: "wrap", gap: "1rem" }}>
        <p style={{ fontSize: "0.85rem", color: "#6b6860", fontFamily: "Georgia,serif", fontStyle: "italic" }}>
          "The fastest way to get a message across."
        </p>
        <Link href="/register" style={{ fontFamily: "system-ui,sans-serif", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8e4dc", textDecoration: "none" }}>
          join now →
        </Link>
      </div>
    </main>
  );
}