import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/index.css";
import { YarnProvider } from "@/lib/yarn-context";

export const metadata: Metadata = {
  title: "YarnMe — If you no understand am, YarnMe go explain am",
  description:
    "YarnMe explains confusing notices, documents, and messages in plain English, Pidgin, or Hausa.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f8f9ff",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-on-surface antialiased">
        <YarnProvider>{children}</YarnProvider>
      </body>
    </html>
  );
}
