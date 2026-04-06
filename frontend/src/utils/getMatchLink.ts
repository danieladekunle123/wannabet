type MatchStream = {
  raw_url?: string | null;
};

type MatchOpponent = {
  opponent?: {
    name?: string | null;
  } | null;
};

type MatchLike = {
  streamUrl?: string | null;
  streams_list?: MatchStream[] | null;
  opponents?: MatchOpponent[] | null;
  teams?: string[] | null;
  videogame?: {
    name?: string | null;
  } | null;
  game?: string | null;
};

type TournamentLike = {
  tournamentName?: string | null;
  league?: string | null;
  game?: string | null;
};

const toQueryToken = (value: string) => value.trim().replace(/\s+/g, "+");

export const getMatchLink = (match: MatchLike) => {
  const stream = match.streams_list?.[0]?.raw_url || match.streamUrl;

  if (stream) {
    return {
      url: stream,
      label: "Watch Live",
    };
  }

  const team1 = match.opponents?.[0]?.opponent?.name || match.teams?.[0] || "";
  const team2 = match.opponents?.[1]?.opponent?.name || match.teams?.[1] || "";
  const game = match.videogame?.name || match.game || "";

  const query = [team1, "vs", team2, game].filter(Boolean).join(" ");

  return {
    url: `https://www.google.com/search?q=${toQueryToken(query || "esports match")}`,
    label: "View Match",
  };
};

export const getTournamentLink = (tournament: TournamentLike) => {
  const tournamentName = tournament.tournamentName || "";
  const league = tournament.league || "";
  const game = tournament.game || "";
  const query = [tournamentName, league, game, "esports"]
    .filter(Boolean)
    .join(" ");

  return {
    url: `https://www.google.com/search?q=${toQueryToken(query || "esports tournament")}`,
    label: "View Tournament",
  };
};
