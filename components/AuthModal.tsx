"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "sign-in" | "sign-up";
}

function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials") || message.includes("invalid_credentials")) {
    return "Invalid email or password.";
  }
  if (message.includes("User already registered") || message.includes("already been registered") || message.includes("already exists")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (message.includes("Email not confirmed")) {
    return "Please check your email and confirm your account before signing in.";
  }
  if (message.includes("Password should be at least")) {
    return "Password must be at least 6 characters.";
  }
  if (message.includes("Unable to validate email")) {
    return "Please enter a valid email address.";
  }
  return "Something went wrong — please try again.";
}

export function AuthModal({ isOpen, onClose, initialTab = "sign-in" }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<"sign-in" | "sign-up">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tab === "sign-in") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong — please try again.";
      setError(mapAuthError(message));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      // Page will redirect for OAuth — no need to close modal
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong — please try again.";
      setError(mapAuthError(message));
      setSubmitting(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  const inputClass =
    "w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-[#F5F5F5] text-sm placeholder:text-[#8c8c8c] focus:outline-none focus:ring-2 focus:ring-brand-red rounded-[0.125rem]";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-sm mx-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[0.125rem] p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-[#8c8c8c] hover:text-[#F5F5F5] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-[#2a2a2a] mb-5">
          <button
            onClick={() => { setTab("sign-in"); setError(null); }}
            className={cn(
              "pb-2 mr-5 text-sm font-semibold tracking-wide border-b-2 transition-colors",
              tab === "sign-in"
                ? "border-brand-red text-[#F5F5F5]"
                : "border-transparent text-[#8c8c8c] hover:text-[#F5F5F5]"
            )}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("sign-up"); setError(null); }}
            className={cn(
              "pb-2 text-sm font-semibold tracking-wide border-b-2 transition-colors",
              tab === "sign-up"
                ? "border-brand-red text-[#F5F5F5]"
                : "border-transparent text-[#8c8c8c] hover:text-[#F5F5F5]"
            )}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="auth-email" className="block text-xs text-[#8c8c8c] mb-1 uppercase tracking-wide">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-xs text-[#8c8c8c] mb-1 uppercase tracking-wide">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={tab === "sign-in" ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "sign-up" ? "At least 6 characters" : "••••••••"}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 pt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-brand-red text-white text-sm font-semibold uppercase tracking-wide rounded-[0.125rem] transition-colors hover:bg-[#990000] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? tab === "sign-in" ? "Signing in..." : "Creating account..."
              : tab === "sign-in" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[#2a2a2a]" />
          <span className="text-xs text-[#8c8c8c]">or</span>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full py-2 bg-transparent border border-[#2a2a2a] text-[#F5F5F5] text-sm font-semibold rounded-[0.125rem] transition-colors hover:border-[#3a3a3a] hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
