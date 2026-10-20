import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/instrument-serif/400.css";
import { AuthProvider } from "@/components/layout/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ripple",
    template: "%s · Ripple",
  },
  description:
    "Ripple simulates how a change in one part of a system affects everything connected to it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
