import { screen } from "@testing-library/react";
import { render } from "../test/test-utils";
import { Tournaments } from "../components/Tournaments";
import { vi } from "vitest";
import React from "react";

// Mock the events service
vi.mock("../services/eventsService", () => ({
  getTournamentsEvents: vi.fn(() => Promise.resolve([])),
}));

// Mock rawg service
vi.mock("../services/rawgService", () => ({
  searchGames: vi.fn(() => Promise.resolve([])),
}));

// Mock the filler image
vi.mock("../assets/fillerbg.jpg", () => ({
  default: "mock-image.jpg",
}));

describe("Tournaments Component", () => {
  it("renders without crashing", () => {
    render(<Tournaments />);
    expect(document.body).toBeDefined();
  });

  it("accepts onNavigate prop", () => {
    const onNavigate = vi.fn();
    const { container } = render(<Tournaments onNavigate={onNavigate} />);
    expect(container).toBeDefined();
  });

  it("accepts showSeeAll prop", () => {
    const { container } = render(<Tournaments showSeeAll={true} />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
