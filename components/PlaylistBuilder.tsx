"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Music,
} from "lucide-react";
import {
  initiateSpotifyAuth,
  getStoredTokens,
  buildSpotifyPlaylist,
} from "@/lib/spotify";
import { buildAppleMusicPlaylist } from "@/lib/apple-music";
import type { MusicService, PlaylistResult, PlaylistStep } from "@/types";
import type { ArtistWithConcerts } from "@/lib/ticketmaster";
import { format } from "date-fns";

interface PlaylistBuilderProps {
  service: MusicService;
  artists: ArtistWithConcerts[];
}

function StepIndicator({
  step,
  message,
}: {
  step: PlaylistStep;
  message: string;
}) {
  if (step === "done" || step === "error" || step === "idle") return null;
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}

export function PlaylistBuilder({ service, artists }: PlaylistBuilderProps) {
  const [step, setStep] = useState<PlaylistStep>("idle");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<PlaylistResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSpotifyToken, setHasSpotifyToken] = useState(false);

  // Check if we already have a Spotify token (e.g. returned from OAuth callback)
  useEffect(() => {
    if (service === "spotify") {
      const tokens = getStoredTokens();
      setHasSpotifyToken(!!tokens);

      // If tokens are present and step is still idle, that means we just returned
      // from OAuth — auto-start the playlist build
      if (tokens) {
        const pendingBuild = sessionStorage.getItem("spotify_pending_build");
        if (pendingBuild === "true") {
          sessionStorage.removeItem("spotify_pending_build");
          void startSpotifyBuild(tokens.accessToken);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const playlistName = `Concerts Near Me – ${format(new Date(), "MMMM yyyy")}`;
  const artistNames = artists.map((a) => a.name);

  async function startSpotifyBuild(accessToken: string) {
    setStep("searching-tracks");
    setError(null);
    try {
      const { playlistId, trackCount, url, manualTracks } = await buildSpotifyPlaylist({
        accessToken,
        artistNames,
        playlistName,
        onProgress: setProgress,
      });
      setResult({
        id: playlistId,
        name: playlistName,
        url,
        trackCount,
        service: "spotify",
        manualTracks,
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playlist creation failed");
      setStep("error");
    }
  }

  async function handleSpotify() {
    const existing = getStoredTokens();
    if (existing) {
      await startSpotifyBuild(existing.accessToken);
      return;
    }
    // Mark that we want to build after auth completes
    sessionStorage.setItem("spotify_pending_build", "true");
    // Store artist names so the callback page can restore context
    sessionStorage.setItem(
      "spotify_pending_artists",
      JSON.stringify(artistNames)
    );
    sessionStorage.setItem("spotify_return_to", window.location.pathname + window.location.search);
    setStep("authenticating");
    try {
      await initiateSpotifyAuth(); // redirects away
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
      setStep("error");
    }
  }

  async function handleAppleMusic() {
    setStep("authenticating");
    setError(null);
    try {
      const { playlistId, trackCount } = await buildAppleMusicPlaylist({
        artistNames,
        playlistName,
        onProgress: (msg) => {
          setProgress(msg);
          if (msg.includes("Authoriz")) setStep("authenticating");
          else if (msg.includes("track") || msg.includes("playlist"))
            setStep("searching-tracks");
          else if (msg.includes("Adding")) setStep("building-playlist");
        },
      });
      setResult({
        id: playlistId,
        name: playlistName,
        url: `https://music.apple.com/library/playlist/${playlistId}`,
        trackCount,
        service: "apple-music",
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playlist creation failed");
      setStep("error");
    }
  }

  const serviceLabel =
    service === "spotify" ? "Spotify" : service === "apple-music" ? "Apple Music" : "Qobuz";

  if (result) {
    // Fallback: playlist created but tracks couldn't be added automatically
    if (result.manualTracks) {
      return (
        <div className="space-y-4">
          <a
            href={result.url ?? "https://open.spotify.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold w-full"
          >
            Open Spotify
            <ExternalLink className="h-4 w-4" />
          </a>

          <p className="text-xs text-muted-foreground leading-relaxed">
            We&apos;re still working on full Spotify connectivity — here are your concert
            playlist tracks in the meantime.
          </p>

          <div className="border border-brand-gray-light divide-y divide-brand-gray-light max-h-72 overflow-y-auto">
            {result.manualTracks.map((track) => (
              <a
                key={track.uri}
                href={`https://open.spotify.com/track/${track.uri.replace("spotify:track:", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 gap-3 hover:bg-brand-gray-light/30 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-white truncate">{track.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-brand-gray-light group-hover:text-brand-red transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>
      );
    }

    // Happy path: tracks were added successfully
    return (
      <Card className="border-green-700 bg-green-950">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-green-400">Playlist Created!</h3>
              <p className="text-sm text-green-400">
                Added <strong>{result.trackCount} tracks</strong> to &quot;
                {result.name}&quot; on {serviceLabel}.
              </p>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-400 underline hover:text-green-300"
              >
                Open playlist
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {step === "idle" && (
        <Button
          size="lg"
          className="w-full"
          onClick={service === "spotify" ? handleSpotify : handleAppleMusic}
          disabled={artists.length === 0}
        >
          <Music className="h-5 w-5 mr-2" />
          Create Playlist on {serviceLabel}
        </Button>
      )}

      {step !== "idle" && step !== "done" && step !== "error" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <StepIndicator step={step} message={progress || "Working…"} />
            <div className="space-y-2">
              {[
                { key: "authenticating", label: "Authenticating" },
                { key: "fetching-artists", label: "Fetching artists" },
                { key: "searching-tracks", label: "Searching tracks" },
                { key: "building-playlist", label: "Building playlist" },
              ].map(({ key, label }) => {
                const steps: PlaylistStep[] = [
                  "authenticating",
                  "fetching-artists",
                  "searching-tracks",
                  "building-playlist",
                ];
                const currentIdx = steps.indexOf(step);
                const thisIdx = steps.indexOf(key as PlaylistStep);
                const isDone = thisIdx < currentIdx;
                const isCurrent = thisIdx === currentIdx;

                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-sm border-2 border-muted-foreground/30" />
                    )}
                    <span
                      className={
                        isDone
                          ? "text-muted-foreground line-through"
                          : isCurrent
                          ? "font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "error" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            We&apos;re still working on full Spotify connectivity. Try connecting again below.
          </p>
          <a
            href="https://open.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold w-full"
          >
            Open Spotify
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => {
              setStep("idle");
              setError(null);
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {hasSpotifyToken && step === "idle" && service === "spotify" && (
        <p className="text-xs text-muted-foreground text-center">
          Already connected to Spotify
        </p>
      )}
    </div>
  );
}
