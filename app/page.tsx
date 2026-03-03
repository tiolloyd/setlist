"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMusicService } from "@/contexts/MusicServiceContext";
import type { MusicService } from "@/types";

type Provider =
  | {
      id: MusicService;
      name: string;
      description: string;
      iconBg: string;
      iconLabel: string;
      iconTextColor: string;
      comingSoon?: false;
    }
  | {
      id: null;
      name: string;
      description: string;
      iconBg: string;
      iconLabel: string;
      iconTextColor: string;
      comingSoon: true;
    };

const PROVIDERS: Provider[] = [
  {
    id: "spotify",
    name: "Spotify",
    description: "OAuth PKCE",
    iconBg: "#1DB954",
    iconLabel: "S",
    iconTextColor: "#000",
  },
  {
    id: "apple-music",
    name: "Apple Music",
    description: "MusicKit JS",
    iconBg: "linear-gradient(135deg, #FA233B 0%, #FB5C74 100%)",
    iconLabel: "♪",
    iconTextColor: "#fff",
  },
  {
    id: null,
    name: "Tidal",
    description: "Hi-fi streaming",
    iconBg: "#00FFFF",
    iconLabel: "T",
    iconTextColor: "#000",
    comingSoon: true,
  },
  {
    id: null,
    name: "Qobuz",
    description: "Studio quality audio",
    iconBg: "#002CB3",
    iconLabel: "Q",
    iconTextColor: "#fff",
    comingSoon: true,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { selectedService, setSelectedService } = useMusicService();

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-4 py-16">

      {/* Wordmark */}
      <div className="text-center mb-16">
        <h1 className="logo-title mb-4">Setlist</h1>
        <p className="logo-tagline">find concerts, make Playlists</p>
      </div>

      {/* Provider selection */}
      <div className="w-full max-w-2xl mb-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-5 text-center">
          Choose your music service
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PROVIDERS.map((provider) => {
            const isSelected =
              !provider.comingSoon && selectedService === provider.id;

            return (
              <button
                key={provider.name}
                type="button"
                disabled={!!provider.comingSoon}
                onClick={() => {
                  if (!provider.comingSoon && provider.id) {
                    setSelectedService(provider.id);
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center text-center p-6 border-2 transition-colors",
                  provider.comingSoon
                    ? "opacity-40 cursor-not-allowed border-brand-gray-light bg-brand-gray"
                    : isSelected
                    ? "border-brand-red bg-[rgba(204,0,0,0.06)]"
                    : "border-brand-gray-light bg-brand-gray hover:border-brand-red/50"
                )}
              >
                {/* Coming soon badge */}
                {provider.comingSoon && (
                  <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider bg-brand-gray-light text-muted-foreground px-1.5 py-0.5 font-semibold">
                    Soon
                  </span>
                )}

                {/* Selected indicator dot */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-red" />
                )}

                {/* Service icon */}
                <div
                  className="w-14 h-14 flex items-center justify-center mb-4 text-2xl font-bold shrink-0"
                  style={{
                    background: provider.iconBg,
                    color: provider.iconTextColor,
                  }}
                >
                  {provider.iconLabel}
                </div>

                <p className="font-bold text-sm text-brand-white leading-tight mb-1">
                  {provider.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {provider.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Get Started */}
      <button
        type="button"
        disabled={!selectedService}
        onClick={() => {
          if (selectedService) router.push("/search");
        }}
        className={cn(
          "btn-primary px-10 py-3 text-sm font-bold tracking-widest uppercase transition-all",
          selectedService
            ? "glow-red"
            : "opacity-40 cursor-not-allowed"
        )}
      >
        Get Started →
      </button>

      {!selectedService && (
        <p className="text-xs text-muted-foreground mt-4">
          Select a service above to continue
        </p>
      )}
    </div>
  );
}
