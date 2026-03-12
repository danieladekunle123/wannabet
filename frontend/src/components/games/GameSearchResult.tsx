import { Star } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import type { RawgGameSummary } from "../../services/rawgService";

interface GameSearchResultProps {
  game: RawgGameSummary;
  onClick?: () => void;
}

export function GameSearchResult({ game, onClick }: GameSearchResultProps) {
  const releaseYear = game.released ? new Date(game.released).getFullYear() : "TBD";
  const rating = typeof game.rating === "number" ? game.rating.toFixed(1) : "N/A";

  return (
    <Card className="cursor-pointer hover-lift border-primary/30" onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
            {game.background_image ? (
              <img
                src={game.background_image}
                alt={game.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-foreground truncate">{game.name}</h4>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{releaseYear}</span>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-400" />
                {rating}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
