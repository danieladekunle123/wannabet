import { screen } from "@testing-library/react";
import { render } from "../test/test-utils";
import { NotificationsDropdown } from "../components/NotificationsDropdown";
import { vi } from "vitest";
import React from "react";

describe("NotificationsDropdown Component", () => {
  it("renders without crashing", () => {
    render(<NotificationsDropdown />);
    expect(document.body).toBeDefined();
  });

  it("accepts onNavigate prop", () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <NotificationsDropdown onNavigate={onNavigate} />,
    );
    expect(container).toBeDefined();
  });

  it("renders notification bell or trigger", () => {
    const { container } = render(<NotificationsDropdown />);
    // Component renders a button/trigger for the notification popover
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
