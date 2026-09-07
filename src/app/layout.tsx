import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "VoltScout — EE Internship & Fellowship Discovery",
  description:
    "Autonomous discovery agent and career portal for global Electrical Engineering internships, research fellowships, and corporate co-ops.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
