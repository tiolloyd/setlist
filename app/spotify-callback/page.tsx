"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { exchangeCodeForTokens } from "@/lib/spotify";

function redirectWithError(router: ReturnType<typeof useRouter>) {
  try {
    sessionStorage.removeItem("spotify_pending_build");
    const returnTo = sessionStorage.getItem("spotify_return_to") ?? "/results";
    sessionStorage.removeItem("spotify_return_to");
    const url = new URL(returnTo, window.location.origin);
    url.searchParams.set("playlist_error", "true");
    router.replace(url.pathname + url.search);
  } catch {
    router.replace("/results?playlist_error=true");
  }
}

function SpotifyCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success">("loading");

  useEffect(() => {
    try {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error || !code) {
        redirectWithError(router);
        return;
      }

      exchangeCodeForTokens(code)
        .then(() => {
          setStatus("success");
          setTimeout(() => {
            const returnTo = sessionStorage.getItem("spotify_return_to") ?? "/";
            sessionStorage.removeItem("spotify_return_to");
            router.push(returnTo);
          }, 1500);
        })
        .catch(() => {
          redirectWithError(router);
        });
    } catch {
      redirectWithError(router);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto px-4 py-20 max-w-md text-center">
      {status === "loading" && (
        <div className="space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">Connecting to Spotify…</p>
          <p className="text-muted-foreground text-sm">
            Exchanging authorization code for access token
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
          <p className="text-lg font-medium">Connected to Spotify!</p>
          <p className="text-muted-foreground text-sm">
            Returning to your results…
          </p>
        </div>
      )}
    </div>
  );
}

export default function SpotifyCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SpotifyCallbackContent />
    </Suspense>
  );
}
