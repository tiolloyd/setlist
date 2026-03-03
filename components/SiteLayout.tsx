"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <div className="min-h-screen bg-brand-black">
      {!isLanding && (
        <header className="border-b border-brand-gray-light bg-brand-gray sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/">
              <span className="logo-title text-2xl cursor-pointer">Setlist</span>
            </Link>
          </div>
        </header>
      )}
      <main>{children}</main>
      {!isLanding && (
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
      )}
    </div>
  );
}
