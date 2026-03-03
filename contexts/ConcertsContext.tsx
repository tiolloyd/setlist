"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ArtistWithConcerts, GenreItem } from "@/lib/ticketmaster";

interface ConcertsContextValue {
  artists: ArtistWithConcerts[];
  genreTree: GenreItem[];
  selectedGenreIds: string[];
  searchParamString: string;
  setResults: (
    artists: ArtistWithConcerts[],
    genreTree: GenreItem[],
    paramString: string
  ) => void;
  setSelectedGenreIds: (ids: string[]) => void;
}

const ConcertsContext = createContext<ConcertsContextValue>({
  artists: [],
  genreTree: [],
  selectedGenreIds: [],
  searchParamString: "",
  setResults: () => {},
  setSelectedGenreIds: () => {},
});

export function ConcertsProvider({ children }: { children: ReactNode }) {
  const [artists, setArtists] = useState<ArtistWithConcerts[]>([]);
  const [genreTree, setGenreTree] = useState<GenreItem[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [searchParamString, setSearchParamString] = useState("");

  function setResults(
    newArtists: ArtistWithConcerts[],
    newGenreTree: GenreItem[],
    paramString: string
  ) {
    setArtists(newArtists);
    setGenreTree(newGenreTree);
    setSearchParamString(paramString);
    setSelectedGenreIds([]); // reset filter on new search
  }

  return (
    <ConcertsContext.Provider
      value={{
        artists,
        genreTree,
        selectedGenreIds,
        searchParamString,
        setResults,
        setSelectedGenreIds,
      }}
    >
      {children}
    </ConcertsContext.Provider>
  );
}

export function useConcerts() {
  return useContext(ConcertsContext);
}
