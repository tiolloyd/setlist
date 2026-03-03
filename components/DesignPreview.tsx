"use client";

import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function DesignPreview() {
  return (
    <div className="p-8 space-y-10 bg-brand-black min-h-screen">

      {/* Logo */}
      <section className="space-y-2">
        <h2 className="logo-title">Setlist</h2>
        <p className="logo-tagline">find concerts, make Playlists</p>
      </section>

      {/* Buttons */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Buttons</p>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary px-5 py-2 text-sm font-semibold">
            Find Concerts
          </button>
          <button className="btn-secondary px-5 py-2 text-sm font-semibold">
            Connect
          </button>
        </div>
      </section>

      {/* Sample Card */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Card</p>
        <div className="card p-4 max-w-xs space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-brand-white">Artist Name</p>
            <span className="badge">2 shows</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>Mar 15, 2026 · 8:00 PM</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>Venue Name · Portland</span>
          </div>
        </div>
      </section>

      {/* Input */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Input</p>
        <Input placeholder="City or ZIP code…" className="max-w-xs" />
      </section>

      {/* Badges */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Badges</p>
        <div className="flex flex-wrap gap-2">
          <span className="badge">Rock</span>
          <span className="badge">Metal</span>
          <span className="badge">Alt</span>
        </div>
      </section>

      {/* Glow demo */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Glow</p>
        <button className="btn-primary glow-red px-5 py-2 text-sm font-semibold">
          Find Concerts
        </button>
      </section>

    </div>
  );
}
