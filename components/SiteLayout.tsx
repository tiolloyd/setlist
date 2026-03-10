"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const { user, signOut } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  async function handleSignOut() {
    setDropdownOpen(false);
    await signOut();
  }

  return (
    <div className="min-h-screen bg-brand-black">
      {!isLanding && (
        <header className="border-b border-brand-gray-light bg-brand-gray sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/">
              <span className="logo-title text-2xl cursor-pointer">Setlist</span>
            </Link>

            {/* Account icon */}
            <div className="relative" ref={dropdownRef}>
              <button
                aria-label={user ? "Account menu" : "Sign in"}
                onClick={() => {
                  if (user) {
                    setDropdownOpen((prev) => !prev);
                  } else {
                    setAuthModalOpen(true);
                  }
                }}
                className="flex items-center justify-center w-8 h-8 text-[#8c8c8c] hover:text-[#F5F5F5] transition-colors"
              >
                <User
                  className="h-5 w-5"
                  fill={user ? "currentColor" : "none"}
                  strokeWidth={user ? 0 : 1.5}
                />
              </button>

              {/* Dropdown */}
              {dropdownOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[0.125rem] py-1 shadow-lg z-[100]">
                  <div className="px-3 py-2 border-b border-[#2a2a2a]">
                    <p className="text-xs text-[#8c8c8c] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-sm text-[#F5F5F5] hover:bg-[#222] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      <main>{children}</main>
      {!isLanding && (
        <footer className="border-t border-brand-gray-light bg-brand-gray mt-16">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground space-y-2">
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
            <p>
              <Link href="/privacy" className="underline hover:text-brand-white">
                Privacy Policy
              </Link>
              {" · "}
              <Link href="/terms" className="underline hover:text-brand-white">
                Terms of Service
              </Link>
            </p>
          </div>
        </footer>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="sign-in"
      />
    </div>
  );
}
