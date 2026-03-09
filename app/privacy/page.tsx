import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Setlist",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold uppercase tracking-widest mb-1">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 9, 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">What We Collect</h2>
        <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed">
          <li><span className="text-foreground font-medium">Location</span> — your city or coordinates, used only to find concerts near you. We do not store your location.</li>
          <li><span className="text-foreground font-medium">Music provider choice</span> — which streaming service you connect (Spotify, Apple Music, etc.), held only in your browser session.</li>
          <li><span className="text-foreground font-medium">Like / dislike preferences</span> — your thumbs up/down on artists, stored in our database linked to an anonymous session ID.</li>
          <li><span className="text-foreground font-medium">Session ID</span> — a random UUID generated in your browser and stored in localStorage. It is not tied to your name, email, or any personally identifiable information.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">How We Use It</h2>
        <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed">
          <li><span className="text-foreground font-medium">Concert discovery</span> — your location is sent to Ticketmaster to fetch nearby events.</li>
          <li><span className="text-foreground font-medium">Playlist generation</span> — artists you like are used to build a playlist on your connected streaming service.</li>
          <li><span className="text-foreground font-medium">Personalization</span> — your like/dislike history is reloaded on return visits so your preferences persist across sessions.</li>
        </ul>
        <p className="text-muted-foreground text-sm mt-4 leading-relaxed">
          We do not use your data for advertising, profiling, or any purpose beyond the core features of the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Third-Party Services</h2>
        <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
          Setlist integrates with the following third-party services. Each has its own privacy policy that governs the data you share with them directly.
        </p>
        <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed">
          <li><span className="text-foreground font-medium">Ticketmaster</span> — concert and event data. Your location is sent to their API.</li>
          <li><span className="text-foreground font-medium">Spotify</span> — playlist creation via OAuth. We request only the permissions needed to create and manage playlists.</li>
          <li><span className="text-foreground font-medium">Apple Music</span> — playlist creation via MusicKit JS. Authentication is handled entirely by Apple.</li>
          <li><span className="text-foreground font-medium">Tidal / Qobuz</span> — planned integrations; not yet active.</li>
          <li><span className="text-foreground font-medium">Nominatim / OpenStreetMap</span> — free geocoding to convert place names to coordinates. No account or personal data is required.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Data Storage</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Artist preferences are stored in <span className="text-foreground font-medium">Supabase</span>, a hosted Postgres database. Data is associated with your anonymous session ID only. We do not store your streaming service credentials — OAuth tokens are held in your browser session and never sent to our servers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Data Sharing</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We do not sell, rent, or trade your data to any third party, ever.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Your Rights</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Because preferences are stored against an anonymous session ID, you can clear your data at any time by clearing your browser's localStorage (this resets your session ID). You may also contact us to request deletion of any data associated with a specific session ID.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Contact</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Questions about this policy? Email us at{" "}
          <a href="mailto:tiolloyd@gmail.com" className="text-foreground underline hover:text-brand-red">
            tiolloyd@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
