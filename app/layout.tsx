import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";

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
        <div className="min-h-screen bg-brand-black">
          <header className="border-b border-brand-gray-light bg-brand-gray sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center gap-3">
              <span className="logo-title text-2xl">Setlist</span>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t border-brand-gray-light bg-brand-gray mt-16">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
              <p>
                Concert data via{" "}
                <a
                  href="https://developer.ticketmaster.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-white"
                >
                  Ticketmaster
                </a>{" "}
                · Built with Next.js
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
