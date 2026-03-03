"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { MusicService } from "@/types";

const STORAGE_KEY = "setlist_service";

interface MusicServiceContextValue {
  selectedService: MusicService | null;
  setSelectedService: (service: MusicService | null) => void;
}

const MusicServiceContext = createContext<MusicServiceContextValue>({
  selectedService: null,
  setSelectedService: () => {},
});

export function MusicServiceProvider({ children }: { children: ReactNode }) {
  const [selectedService, setSelectedServiceState] =
    useState<MusicService | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as MusicService | null;
    if (stored) setSelectedServiceState(stored);
  }, []);

  function setSelectedService(service: MusicService | null) {
    setSelectedServiceState(service);
    if (service) {
      localStorage.setItem(STORAGE_KEY, service);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <MusicServiceContext.Provider value={{ selectedService, setSelectedService }}>
      {children}
    </MusicServiceContext.Provider>
  );
}

export function useMusicService() {
  return useContext(MusicServiceContext);
}
