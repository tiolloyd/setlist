"use client";

import { MusicServiceProvider } from "@/contexts/MusicServiceContext";
import { ConcertsProvider } from "@/contexts/ConcertsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MusicServiceProvider>
        <ConcertsProvider>{children}</ConcertsProvider>
      </MusicServiceProvider>
    </AuthProvider>
  );
}
