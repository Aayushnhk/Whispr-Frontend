"use client";

import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { GlobalSocketManager } from "@/context/SocketContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            --bg: #0d0f1a;
            --surface: #141628;
            --surface2: #1a1d35;
            --border: rgba(99,102,241,0.15);
            --border-subtle: rgba(255,255,255,0.06);
            --text: #f0f0ff;
            --muted: #6b7280;
            --accent: #6366f1;
            --accent-light: #818cf8;
            --accent-glow: rgba(99,102,241,0.15);
            --green: #10b981;
            --red: #f43f5e;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: var(--bg); color: var(--text); }
          ::selection { background: rgba(99,102,241,0.3); }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 2px; }
        `}</style>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <GlobalSocketManager>{children}</GlobalSocketManager>
        </AuthProvider>
      </body>
    </html>
  );
}