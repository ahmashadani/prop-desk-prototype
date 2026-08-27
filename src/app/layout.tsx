import type { Metadata } from "next";
import "./globals.css";
import { PropDeskProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Prop Firm Desk — Prototype",
  description: "Clickable Prop Firm Desk MVP prototype · Midfleet decision engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PropDeskProvider>{children}</PropDeskProvider>
      </body>
    </html>
  );
}
