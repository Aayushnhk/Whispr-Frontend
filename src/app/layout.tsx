// src/app/layout.tsx
"use client";

import "./globals.css";
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
      <body className={`${inter.className} bg-gray-900`}>
        <AuthProvider>
          <GlobalSocketManager>{children}</GlobalSocketManager>
        </AuthProvider>
      </body>
    </html>
  );
}