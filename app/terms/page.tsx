import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Setlist",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold uppercase tracking-widest mb-1">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 9, 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">The Service</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Setlist (<span className="text-foreground font-medium">setlistmusic.live</span>) is a concert discovery and playlist building tool. It finds upcoming concerts near you via the Ticketmaster API and lets you create playlists of performing artists on your connected streaming service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Using the Service</h2>
        <p className="text-muted-foreground text-sm mb-3 leading-relaxed">By using Setlist, you agree to:</p>
        <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed">
          <li>Use the service for personal, non-commercial purposes only.</li>
          <li>Not attempt to reverse-engineer, scrape, or abuse the service or its APIs.</li>
          <li>Not use the service in any way that violates applicable laws or regulations.</li>
          <li>Provide accurate location information — incorrect locations will simply return incorrect results.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Music Provider Terms</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          When you connect Spotify or Apple Music, you are subject to their respective terms of service in addition to ours. Setlist acts as an authorized API client and does not circumvent any platform restrictions. Playlists created through Setlist are owned by you within your streaming account.
        </p>
        <ul className="mt-3 space-y-1 text-muted-foreground text-sm">
          <li>
            <a href="https://www.spotify.com/legal/end-user-agreement/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-white">
              Spotify Terms of Service
            </a>
          </li>
          <li>
            <a href="https://www.apple.com/legal/internet-services/itunes/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-white">
              Apple Media Services Terms
            </a>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Concert Data Accuracy</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Concert information is sourced from Ticketmaster and is provided as-is. We make no guarantee that event listings are complete, accurate, or up to date. Concerts may be cancelled, rescheduled, or missing from results. Always verify event details directly with the venue or ticketing provider before purchasing tickets.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Service Availability</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Setlist is provided free of charge and on an as-available basis. We reserve the right to modify, suspend, or discontinue the service at any time without notice. We are not liable for any interruption in service or loss of data resulting from downtime.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Disclaimer of Warranties</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The service is provided "as is" without warranties of any kind, express or implied. We do not warrant that the service will be error-free, uninterrupted, or free of harmful components.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Limitation of Liability</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          To the fullest extent permitted by law, Setlist and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold uppercase tracking-wider mb-3 text-brand-red">Contact</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Questions about these terms? Email us at{" "}
          <a href="mailto:tiolloyd@gmail.com" className="text-foreground underline hover:text-brand-red">
            tiolloyd@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
