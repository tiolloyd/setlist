"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import type { MusicService } from "@/types";

interface ServiceSelectorProps {
  value: MusicService | null;
  onChange: (service: MusicService) => void;
}

const SERVICES: Array<{
  id: MusicService;
  name: string;
  description: string;
  color: string;
  icon: string;
  comingSoon?: boolean;
}> = [
  {
    id: "spotify",
    name: "Spotify",
    description: "Create a playlist via OAuth PKCE",
    color: "bg-green-500",
    icon: "🎵",
  },
  {
    id: "apple-music",
    name: "Apple Music",
    description: "Create a playlist via MusicKit JS",
    color: "bg-gradient-to-br from-pink-500 to-red-500",
    icon: "🎼",
  },
  {
    id: "qobuz",
    name: "Qobuz",
    description: "Hi-res audio streaming",
    color: "bg-blue-600",
    icon: "🎶",
    comingSoon: true,
  },
];

export function ServiceSelector({ value, onChange }: ServiceSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SERVICES.map((service) => (
          <button
            key={service.id}
            type="button"
            disabled={service.comingSoon}
            onClick={() => {
              if (service.comingSoon) {
                alert("Qobuz API requires a partner agreement. Stay tuned!");
                return;
              }
              onChange(service.id);
            }}
            className={cn(
              "relative rounded-sm border-2 p-4 text-left transition-all",
              service.comingSoon
                ? "bg-brand-black opacity-40 cursor-not-allowed border-brand-gray-light"
                : value === service.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-brand-gray-light bg-brand-gray hover:border-brand-red/50 hover:shadow-sm"
            )}
          >
            {service.comingSoon && (
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <Badge variant="secondary" className="text-xs px-1.5">
                  <Lock className="h-3 w-3 mr-1" />
                  Coming Soon
                </Badge>
              </div>
            )}
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3",
                service.color
              )}
            >
              {service.icon}
            </div>
            <p className="font-semibold text-sm">{service.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {service.description}
            </p>
            {value === service.id && !service.comingSoon && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-sm bg-primary flex items-center justify-center">
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
