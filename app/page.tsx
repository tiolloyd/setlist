"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, format } from "date-fns";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LocationInput } from "@/components/LocationInput";
import { RadiusSlider } from "@/components/RadiusSlider";
import { DateRangePicker } from "@/components/DateRangePicker";
import { ServiceSelector } from "@/components/ServiceSelector";
import type { AppSettings, MusicService } from "@/types";

const today = format(new Date(), "yyyy-MM-dd");
const nextMonth = format(addMonths(new Date(), 1), "yyyy-MM-dd");

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [settings, setSettings] = useState<AppSettings>(() => {
    const lat = parseFloat(searchParams.get("lat") ?? "");
    const lng = parseFloat(searchParams.get("lng") ?? "");
    const locationName = searchParams.get("locationName") ?? "";
    const radius = parseInt(searchParams.get("radius") ?? "", 10);
    const startDate = searchParams.get("startDate") ?? today;
    const endDate = searchParams.get("endDate") ?? nextMonth;
    const service = (searchParams.get("service") ?? null) as MusicService | null;

    return {
      location:
        !isNaN(lat) && !isNaN(lng) && locationName
          ? { lat, lng, displayName: locationName }
          : null,
      radiusMiles: !isNaN(radius) ? radius : 50,
      startDate,
      endDate,
      service,
    };
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  function patch<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!settings.location) {
      setValidationError("Please select a location before searching.");
      return;
    }
    if (!settings.service) {
      setValidationError("Please select a music service.");
      return;
    }

    const params = new URLSearchParams({
      lat: String(settings.location.lat),
      lng: String(settings.location.lng),
      locationName: settings.location.displayName,
      radius: String(settings.radiusMiles),
      startDate: settings.startDate,
      endDate: settings.endDate,
      service: settings.service,
    });

    router.push(`/results?${params}`);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-10">
        <h2 className="logo-title mb-3">Setlist</h2>
        <p className="logo-tagline max-w-lg mx-auto">
          find concerts, make Playlists
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Settings</CardTitle>
            <CardDescription>
              Tell us where you are and what you&apos;re looking for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Location</p>
              <LocationInput
                value={settings.location}
                onChange={(loc) => patch("location", loc)}
              />
            </div>

            <Separator />

            {/* Radius */}
            <RadiusSlider
              value={settings.radiusMiles}
              onChange={(v) => patch("radiusMiles", v)}
            />

            <Separator />

            {/* Date range */}
            <DateRangePicker
              startDate={settings.startDate}
              endDate={settings.endDate}
              onStartChange={(d) => patch("startDate", d)}
              onEndChange={(d) => patch("endDate", d)}
            />

            <Separator />

            {/* Service */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Music Service</p>
              <ServiceSelector
                value={settings.service}
                onChange={(s) => patch("service", s)}
              />
            </div>

            {validationError && (
              <p className="text-sm text-brand-red bg-brand-gray border border-brand-red px-3 py-2 rounded-sm">
                {validationError}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full">
              <Search className="h-5 w-5 mr-2" />
              Find Concerts
            </Button>
          </CardContent>
        </Card>
      </form>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
        <div>
          <div className="text-2xl font-bold text-foreground mb-1">Free</div>
          <div>No account required to search</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground mb-1">50mi</div>
          <div>Default search radius</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground mb-1">50+</div>
          <div>Concerts per search</div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
