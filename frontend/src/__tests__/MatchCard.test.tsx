import { render, screen } from "@testing-library/react";
import MatchCard from "../components/MatchCard";

describe("MatchCard Component", () => {
  it("renders match info", () => {
    render(<MatchCard game="Test Game" stake={100} status="OPEN" />);
    expect(screen.getByText(/test game/i)).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/open/i)).toBeInTheDocument();
  });
});
