"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exchangeCodeForTokens } from "@/lib/spotify";

function SpotifyCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setErrorMsg(
        error === "access_denied"
          ? "You denied access to Spotify. Please try again and approve the request."
          : `Spotify returned an error: ${error}`
      );
      setStatus("error");
      return;
    }

    if (!code) {
      setErrorMsg("No authorization code received from Spotify.");
      setStatus("error");
      return;
    }

    exchangeCodeForTokens(code)
      .then(() => {
        setStatus("success");
        // Navigate back to results after a short delay
        setTimeout(() => {
          // Try to return to results page if we have a stored URL
          const returnTo = sessionStorage.getItem("spotify_return_to") ?? "/";
          sessionStorage.removeItem("spotify_return_to");
          router.push(returnTo);
        }, 1500);
      })
      .catch((err: unknown) => {
        setErrorMsg(
          err instanceof Error ? err.message : "Token exchange failed"
        );
        setStatus("error");
      });
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

      {status === "error" && (
        <div className="space-y-4">
          <XCircle className="h-10 w-10 text-brand-red mx-auto" />
          <p className="text-lg font-medium">Spotify connection failed</p>
          <p className="text-sm text-brand-red bg-brand-gray border border-brand-red px-4 py-2 rounded-sm">
            {errorMsg}
          </p>
          <Button onClick={() => router.push("/")}>Go back home</Button>
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
