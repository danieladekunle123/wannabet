import React, { useEffect, useRef, useState } from "react";
import { Loader2, Search, Star } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { searchGames, type RawgGameSummary } from "../../services/rawgService";

export interface SelectedGameOption {
  gameId?: number;
  name: string;
  image?: string | null;
  rating?: number;
  manualEntry?: boolean;
}

interface GameSelectorProps {
  onGameSelected: (game: SelectedGameOption) => void;
}

export function GameSelector({ onGameSelected }: GameSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<RawgGameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<SelectedGameOption | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const query = debouncedQuery.trim();

    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    searchGames(query)
      .then((data) => {
        if (!mounted) return;
        setResults(data.results || []);
      })
      .catch(() => {
        if (!mounted) return;
        setResults([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const commitManualEntry = () => {
    const query = searchQuery.trim();
    if (!query) return;

    const manual: SelectedGameOption = {
      name: query,
      manualEntry: true,
    };

    setSelectedGame(manual);
    setSearchQuery(manual.name);
    setOpen(false);
    onGameSelected(manual);
  };

  const pickResult = (game: RawgGameSummary) => {
    const selected: SelectedGameOption = {
      gameId: game.id,
      name: game.name,
      image: game.background_image || null,
      rating: game.rating,
      manualEntry: false,
    };

    setSelectedGame(selected);
    setSearchQuery(selected.name);
    setOpen(false);
    onGameSelected(selected);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          placeholder="Search games via RAWG or type and press Enter"
          className="pl-10 bg-muted/50 border-muted"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitManualEntry();
            }
          }}
        />
      </div>

      {selectedGame && (
        <div className="mt-2">
          <Badge className={selectedGame.manualEntry ? "bg-slate-600" : "bg-emerald-600"}>
            {selectedGame.manualEntry ? "Manual" : "RAWG"}: {selectedGame.name}
          </Badge>
        </div>
      )}

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-md border border-border bg-card shadow-xl max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-3 py-4 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching RAWG games...
            </div>
          )}

          {!loading && debouncedQuery.trim().length >= 2 && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No games found. Press Enter to use "{searchQuery.trim()}" as manual entry.
            </div>
          )}

          {!loading && results.map((game) => {
            const releaseYear = game.released ? new Date(game.released).getFullYear() : "TBD";
            return (
              <button
                key={game.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                onClick={() => pickResult(game)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded overflow-hidden bg-muted shrink-0">
                    {game.background_image ? (
                      <img src={game.background_image} alt={game.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-[10px] text-muted-foreground">No Img</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{game.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{releaseYear}</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-400" />
                        {typeof game.rating === "number" ? game.rating.toFixed(1) : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
