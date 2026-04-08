import { render, screen } from "@testing-library/react";
import TournamentCard from "../components/TournamentCard";

describe("TournamentCard Component", () => {
  it("renders tournament info", () => {
    render(
      <TournamentCard
        name="Test Tournament"
        entryFee={100}
        status="UPCOMING"
      />,
    );
    expect(screen.getByText(/test tournament/i)).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
  });
});
