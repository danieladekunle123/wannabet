import { screen } from "@testing-library/react";
import { render } from "../test/test-utils";
import { CreateMatch } from "../components/CreateMatch";
import { vi } from "vitest";
import React from "react";

// Mock the events service
vi.mock("../services/eventsService", () => ({
  getTournamentsEvents: vi.fn(() => Promise.resolve([])),
  getActiveEvents: vi.fn(() => Promise.resolve([])),
}));

// Mock rawg service for game search
vi.mock("../services/rawgService", () => ({
  searchGames: vi.fn(() => Promise.resolve([])),
}));

describe("CreateMatch Component", () => {
  const onNavigate = vi.fn();

  it("renders without crashing", () => {
    render(<CreateMatch onNavigate={onNavigate} />);
    expect(document.body).toBeDefined();
  });

  it("mounts with default tab", () => {
    const { container } = render(<CreateMatch onNavigate={onNavigate} />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it("accepts initialTab prop", () => {
    const { container } = render(
      <CreateMatch onNavigate={onNavigate} initialTab="wager" />,
    );
    expect(container).toBeDefined();
  });
});
