"use client";

import { MusicServiceProvider } from "@/contexts/MusicServiceContext";
import type { ReactNode } from "react";

export function AppProvider({ children }: { children: ReactNode }) {
  return <MusicServiceProvider>{children}</MusicServiceProvider>;
}
