"use client";

import { MusicServiceProvider } from "@/contexts/MusicServiceContext";
import { ConcertsProvider } from "@/contexts/ConcertsContext";
import type { ReactNode } from "react";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <MusicServiceProvider>
      <ConcertsProvider>{children}</ConcertsProvider>
    </MusicServiceProvider>
  );
}
