import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { SiteLayout } from "@/components/SiteLayout";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Setlist",
  description:
    "Find upcoming concerts near you and create playlists of the artists' music on Spotify and Apple Music.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={barlowCondensed.variable}>
        <AppProvider>
          <SiteLayout>{children}</SiteLayout>
        </AppProvider>
      </body>
    </html>
  );
}
