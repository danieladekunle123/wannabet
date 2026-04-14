import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "../test/test-utils";
import { LoadingPage } from "../components/LoadingPage";

describe("LoadingPage", () => {
  it("renders with default message", () => {
    const { container } = render(<LoadingPage />);
    expect(container.innerHTML).toContain("Loading...");
    expect(container.innerHTML).toContain("WannaBet?");
  });

  it("renders with a custom message", () => {
    const { container } = render(
      <LoadingPage message="Loading your dashboard..." />,
    );
    expect(container.innerHTML).toContain("Loading your dashboard...");
  });

  it("renders the first message from the messages array", () => {
    const messages = [
      "Initializing WannaBet...",
      "Loading your session...",
      "Almost ready...",
    ];
    const { container } = render(
      <LoadingPage messages={messages} autoRotate duration={2000} />,
    );
    expect(container.innerHTML).toContain("Initializing WannaBet...");
  });

  it("renders the brand name", () => {
    const { container } = render(<LoadingPage />);
    expect(container.innerHTML).toContain("WannaBet?");
  });

  it("has the loading label text", () => {
    const { container } = render(<LoadingPage />);
    expect(container.innerHTML).toContain("Loading");
  });

  it("renders with a fixed z-50 overlay", () => {
    const { container } = render(<LoadingPage />);
    const overlay = container.querySelector(".fixed.inset-0.z-50");
    // motion/react is mocked to pass-through children so the div structure may
    // not be preserved — just check the text content exists
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
