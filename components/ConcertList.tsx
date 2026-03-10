"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Music2, ThumbsUp, ThumbsDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { ArtistWithConcerts } from "@/lib/ticketmaster";
import { getSupabase, getPreferenceOwnerId } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";

interface ConcertListProps {
  artists: ArtistWithConcerts[];
  onPreferenceChange?: (artistId: string, preference: Preference | undefined) => void;
}

type Preference = "like" | "dislike";

const BANNER_DISMISSED_KEY = "setlist_auth_banner_dismissed";

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function ConcertList({ artists, onPreferenceChange }: ConcertListProps) {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<Map<string, Preference>>(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  // Whether the user has interacted with at least one preference button this session
  const [hasInteracted, setHasInteracted] = useState(false);
  // Whether the auth prompt banner has been dismissed
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(BANNER_DISMISSED_KEY) === "1";
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Show the banner when: user has interacted, is not logged in, and hasn't dismissed
  const showBanner = hasInteracted && !user && !bannerDismissed;

  // Load saved preferences once auth state is known
  useEffect(() => {
    // Wait until Supabase auth has resolved — avoids fetching by anonymous
    // session_id when the user is actually logged in
    if (authLoading) return;

    const ownerId = getPreferenceOwnerId(user?.id);
    if (!ownerId) return;

    const db = getSupabase();
    if (!db) return;

    db.from("user_artist_preferences")
      .select("artist_id, preference")
      .eq("session_id", ownerId)
      .then(({ data }) => {
        if (!data) return;
        const map = new Map<string, Preference>();
        for (const row of data) {
          if (row.preference === "like" || row.preference === "dislike") {
            map.set(row.artist_id, row.preference as Preference);
          }
        }
        setPreferences(map);
      });
  }, [authLoading, user?.id]);

  async function handlePreference(artist: ArtistWithConcerts, value: Preference) {
    const ownerId = getPreferenceOwnerId(user?.id);
    const db = getSupabase();
    if (!ownerId || !db || loadingIds.has(artist.id)) return;

    // Show auth banner after first interaction if not logged in
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    const current = preferences.get(artist.id);
    // Clicking the active button toggles it off; otherwise switch to the new value
    const next: Preference | undefined = current === value ? undefined : value;

    // Optimistic update
    setPreferences((prev) => {
      const map = new Map(prev);
      if (next === undefined) map.delete(artist.id);
      else map.set(artist.id, next);
      return map;
    });
    setLoadingIds((prev) => new Set(prev).add(artist.id));

    // Notify parent so it can exclude disliked artists from playlist generation
    onPreferenceChange?.(artist.id, next);

    try {
      if (next === undefined) {
        await db
          .from("user_artist_preferences")
          .delete()
          .eq("session_id", ownerId)
          .eq("artist_id", artist.id);
      } else {
        await db.from("user_artist_preferences").upsert(
          {
            session_id: ownerId,
            artist_id: artist.id,
            artist_name: artist.name,
            genre: artist.genreIds[0] ?? null,
            subgenre: artist.subGenreIds[0] ?? null,
            preference: next,
          },
          { onConflict: "session_id,artist_id" }
        );
      }
    } catch {
      // Revert optimistic update
      setPreferences((prev) => {
        const map = new Map(prev);
        if (current === undefined) map.delete(artist.id);
        else map.set(artist.id, current);
        return map;
      });
    } finally {
      setLoadingIds((prev) => {
        const s = new Set(prev);
        s.delete(artist.id);
        return s;
      });
    }
  }

  function handleDismissBanner() {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, "1");
    setBannerDismissed(true);
  }

  if (artists.length === 0) {
    return (
      <div className="text-center py-16">
        <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No concerts found</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Try expanding your search radius or adjusting your date range to find
          more concerts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Found{" "}
        <span className="font-semibold text-foreground">{artists.length}</span>{" "}
        artists with upcoming concerts in your area
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {artists.filter((a) => preferences.get(a.id) !== "dislike").map((artist) => {
          const pref = preferences.get(artist.id);
          const isLoading = loadingIds.has(artist.id);

          return (
            <Card
              key={artist.id}
              className="hover:shadow-md transition-shadow overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-sm bg-brand-gray-light flex items-center justify-center shrink-0 overflow-hidden">
                    {artist.imageUrl ? (
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music2 className="h-5 w-5 text-white" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Name + like/dislike buttons */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-w-0">
                        {artist.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handlePreference(artist, "like")}
                          disabled={isLoading}
                          aria-label="Like"
                          className={cn(
                            "flex items-center justify-center w-6 h-6 border transition-colors disabled:opacity-40",
                            pref === "like"
                              ? "bg-brand-red border-brand-red text-white"
                              : "border-brand-gray-light text-muted-foreground hover:border-brand-red/60 hover:text-brand-red"
                          )}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handlePreference(artist, "dislike")}
                          disabled={isLoading}
                          aria-label="Dislike"
                          className={cn(
                            "flex items-center justify-center w-6 h-6 border transition-colors disabled:opacity-40",
                            pref === "dislike"
                              ? "bg-brand-gray-light border-brand-gray-light text-brand-white"
                              : "border-brand-gray-light text-muted-foreground hover:border-brand-white/30 hover:text-brand-white"
                          )}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {artist.concertCount > 1 && (
                      <Badge variant="secondary" className="shrink-0 text-xs mb-2">
                        {artist.concertCount} shows
                      </Badge>
                    )}

                    <div className="space-y-1">
                      {artist.dates.slice(0, 3).map((d, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {formatDate(d.localDate)}
                            </span>
                            {d.localTime && (
                              <span className="ml-1">
                                · {d.localTime.slice(0, 5)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {artist.dates[0]?.venueName && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {artist.dates[0].venueName}
                            {artist.dates[0].venueCity && (
                              <span className="ml-1">
                                · {artist.dates[0].venueCity}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {artist.dates.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{artist.dates.length - 3} more date
                          {artist.dates.length - 3 > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Auth prompt banner — shown once after first preference interaction */}
      {showBanner && (
        <div className="border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 rounded-[0.125rem]">
          <p className="text-sm text-[#F5F5F5] flex-1">
            Save your music preferences across devices — sign in or create a free account
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3 py-1.5 bg-brand-red text-white text-xs font-semibold uppercase tracking-wide rounded-[0.125rem] hover:bg-[#990000] transition-colors"
            >
              Sign Up
            </button>
            <button
              onClick={handleDismissBanner}
              className="px-3 py-1.5 text-xs text-[#8c8c8c] hover:text-[#F5F5F5] transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="sign-up"
      />
    </div>
  );
}
