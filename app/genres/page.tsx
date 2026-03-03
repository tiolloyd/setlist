"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConcerts } from "@/contexts/ConcertsContext";

export default function GenresPage() {
  const router = useRouter();
  const { artists, genreTree, searchParamString, setSelectedGenreIds } =
    useConcerts();

  // Redirect to search if navigated directly (no context data)
  useEffect(() => {
    if (artists.length === 0 && genreTree.length === 0) {
      router.replace("/search");
    }
  }, [artists.length, genreTree.length, router]);

  // Local genre selection state — committed to context only on "Show Concerts"
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // All genres start expanded
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(genreTree.map((g) => g.id))
  );

  // Count artists per genre/subGenre id
  const idCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const artist of artists) {
      for (const id of [...artist.genreIds, ...artist.subGenreIds]) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return counts;
  }, [artists]);

  // How many artists match the current selection
  const filteredCount = useMemo(() => {
    if (selected.size === 0) return 0;
    return artists.filter(
      (a) =>
        a.genreIds.some((id) => selected.has(id)) ||
        a.subGenreIds.some((id) => selected.has(id))
    ).length;
  }, [artists, selected]);

  const allGenreIds = genreTree.map((g) => g.id);
  const allSelected =
    allGenreIds.length > 0 && allGenreIds.every((id) => selected.has(id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      // Select every parent genre (drops any individual subGenre picks)
      setSelected(new Set(allGenreIds));
    }
  }

  function toggleGenre(genreId: string, childIds: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(genreId)) {
        next.delete(genreId);
      } else {
        // Select parent → remove any individual child picks for this genre
        next.add(genreId);
        for (const id of childIds) next.delete(id);
      }
      return next;
    });
  }

  function toggleSubGenre(parentId: string, subGenreId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(subGenreId)) {
        next.delete(subGenreId);
      } else {
        // Selecting a child deselects the parent genre
        next.delete(parentId);
        next.add(subGenreId);
      }
      return next;
    });
  }

  function toggleExpand(genreId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(genreId)) next.delete(genreId);
      else next.add(genreId);
      return next;
    });
  }

  function handleSkip() {
    setSelectedGenreIds([]);
    router.push(`/results?${searchParamString}`);
  }

  function handleShowConcerts() {
    setSelectedGenreIds(Array.from(selected));
    router.push(`/results?${searchParamString}`);
  }

  // Don't flash pre-redirect
  if (artists.length === 0) return null;

  const locationName =
    new URLSearchParams(searchParamString).get("locationName") ?? "your area";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">
          {artists.length} artist{artists.length !== 1 ? "s" : ""} found near{" "}
          <span className="text-brand-white font-medium">
            {locationName.split(",")[0]}
          </span>
        </p>
        <h2 className="text-xl font-bold text-brand-white tracking-tight">
          Filter by Genre
        </h2>
      </div>

      {/* Genre list */}
      <div className="border border-brand-gray-light">

        {/* Select All row */}
        <button
          type="button"
          onClick={toggleSelectAll}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 border-b border-brand-gray-light text-left transition-colors border-l-2",
            allSelected
              ? "border-l-brand-red bg-brand-red/5"
              : "border-l-transparent hover:bg-brand-gray-light/20"
          )}
        >
          <span
            className={cn(
              "text-sm font-semibold uppercase tracking-wider",
              allSelected ? "text-brand-white" : "text-muted-foreground"
            )}
          >
            Select All
          </span>
          <span className="text-xs text-muted-foreground">{artists.length}</span>
        </button>

        {/* Genre rows */}
        {genreTree.map((genre, gIdx) => {
          const isGenreSelected = selected.has(genre.id);
          const someSubSelected = genre.subGenres.some((s) =>
            selected.has(s.id)
          );
          const isExpanded = expanded.has(genre.id);
          const count = idCounts.get(genre.id) ?? 0;
          const isLastGenre = gIdx === genreTree.length - 1;

          return (
            <div key={genre.id}>
              {/* Genre header row */}
              <div
                className={cn(
                  "flex items-stretch border-l-2 transition-colors",
                  !isLastGenre || (isExpanded && genre.subGenres.length > 0)
                    ? "border-b border-brand-gray-light"
                    : "",
                  isGenreSelected
                    ? "border-l-brand-red bg-brand-red/5"
                    : someSubSelected
                    ? "border-l-brand-red/40"
                    : "border-l-transparent"
                )}
              >
                {/* Clickable genre label — selects the genre */}
                <button
                  type="button"
                  onClick={() =>
                    toggleGenre(
                      genre.id,
                      genre.subGenres.map((s) => s.id)
                    )
                  }
                  className="flex-1 flex items-center justify-between px-4 py-3 text-left hover:bg-brand-gray-light/10 transition-colors"
                >
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isGenreSelected || someSubSelected
                        ? "text-brand-white"
                        : "text-brand-white/70"
                    )}
                  >
                    {genre.name}
                  </span>
                  {count > 0 && (
                    <span className="text-xs text-muted-foreground mr-2">
                      {count}
                    </span>
                  )}
                </button>

                {/* Expand/collapse arrow — only toggles visibility of subGenres */}
                {genre.subGenres.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(genre.id)}
                    className="px-3 py-3 text-muted-foreground hover:text-brand-red transition-colors shrink-0"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform duration-150",
                        isExpanded && "rotate-90 text-brand-red"
                      )}
                    />
                  </button>
                )}
              </div>

              {/* SubGenre rows */}
              {isExpanded &&
                genre.subGenres.map((sub, sIdx) => {
                  const isSubSelected = selected.has(sub.id);
                  const subCount = idCounts.get(sub.id) ?? 0;
                  const isLastSub = sIdx === genre.subGenres.length - 1;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubGenre(genre.id, sub.id)}
                      className={cn(
                        "w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-left border-l-2 transition-colors",
                        !isLastGenre || !isLastSub
                          ? "border-b border-brand-gray-light"
                          : "",
                        isSubSelected
                          ? "border-l-brand-red bg-brand-red/5"
                          : "border-l-transparent hover:bg-brand-gray-light/10"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm",
                          isSubSelected
                            ? "text-brand-white"
                            : "text-muted-foreground"
                        )}
                      >
                        {sub.name}
                      </span>
                      {subCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {subCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 gap-4">
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-muted-foreground hover:text-brand-white underline underline-offset-2 transition-colors"
        >
          Skip — Show All Concerts
        </button>

        <button
          type="button"
          onClick={handleShowConcerts}
          disabled={selected.size === 0}
          className={cn(
            "btn-primary px-6 py-2.5 text-sm font-bold tracking-wide",
            selected.size === 0 && "opacity-40 cursor-not-allowed"
          )}
        >
          Show Concerts ({filteredCount})
        </button>
      </div>

      {selected.size === 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-right">
          Select genres above, or skip to see everything
        </p>
      )}
    </div>
  );
}
