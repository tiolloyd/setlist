import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Concert Playlist App",
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
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
          <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-white text-sm">♪</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  Concert Playlist
                </h1>
                <p className="text-xs text-gray-500">
                  Discover local concerts, build playlists
                </p>
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t bg-white/60 mt-16">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
              <p>
                Concert data via{" "}
                <a
                  href="https://developer.ticketmaster.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-700"
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
