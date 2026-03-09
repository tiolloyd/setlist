"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Music2, ThumbsUp, ThumbsDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { ArtistWithConcerts } from "@/lib/ticketmaster";
import { getSupabase, getSessionId } from "@/lib/supabase";

interface ConcertListProps {
  artists: ArtistWithConcerts[];
}

type Preference = "like" | "dislike";

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function ConcertList({ artists }: ConcertListProps) {
  const [preferences, setPreferences] = useState<Map<string, Preference>>(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // Load saved preferences for this session on mount
  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const db = getSupabase();
    if (!db) return;

    db.from("user_artist_preferences")
      .select("artist_id, preference")
      .eq("session_id", sessionId)
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
  }, []);

  async function handlePreference(artist: ArtistWithConcerts, value: Preference) {
    const sessionId = getSessionId();
    const db = getSupabase();
    if (!sessionId || !db || loadingIds.has(artist.id)) return;

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

    try {
      if (next === undefined) {
        await db
          .from("user_artist_preferences")
          .delete()
          .eq("session_id", sessionId)
          .eq("artist_id", artist.id);
      } else {
        await db.from("user_artist_preferences").upsert(
          {
            session_id: sessionId,
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
        {artists.map((artist) => {
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
    </div>
  );
}
