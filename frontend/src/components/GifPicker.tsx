import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Input } from "./ui/input";

interface GifPickerProps {
  apiKey: string;
  onSelect: (gifUrl: string) => void;
}

export function GifPicker({ apiKey, onSelect }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gridWidth, setGridWidth] = useState(760);

  const gf = useMemo(() => new GiphyFetch(apiKey), [apiKey]);

  const fetchGifs = useCallback(
    (offset: number) => {
      const searchTerm = query.trim() || "trending";
      return gf.search(searchTerm, { offset, limit: 20, rating: "pg-13" });
    },
    [gf, query],
  );

  useEffect(() => {
    const updateWidth = () => {
      const maxWidth = 760;
      const viewportWidth = window.innerWidth - 96;
      setGridWidth(Math.max(280, Math.min(maxWidth, viewportWidth)));
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search GIFs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-muted/30 border-border/50"
      />
      <div className="max-h-80 overflow-y-auto rounded-lg border border-border/50 p-2">
        <Grid
          key={query || "trending"}
          width={gridWidth}
          columns={4}
          gutter={8}
          fetchGifs={fetchGifs}
          onGifClick={(gif, e) => {
            e.preventDefault();
            const gifUrl = gif?.images?.original?.url;
            if (gifUrl) onSelect(gifUrl);
          }}
          hideAttribution
        />
      </div>
    </div>
  );
}
