import { screen } from "@testing-library/react";
import { render } from "../test/test-utils";
import { Messages } from "../components/Messages";
import { vi } from "vitest";
import React from "react";

// Mock API calls that Messages makes
vi.mock("../lib/api", () => ({
  default: vi.fn(() => Promise.resolve({ data: [] })),
  __esModule: true,
}));

describe("Messages Component", () => {
  it("renders without crashing", () => {
    render(<Messages />);
    expect(document.body).toBeDefined();
  });

  it("accepts optional props", () => {
    const onNavigate = vi.fn();
    const onUnreadCountChange = vi.fn();
    const { container } = render(
      <Messages
        onNavigate={onNavigate}
        onUnreadCountChange={onUnreadCountChange}
      />,
    );
    expect(container).toBeDefined();
  });

  it("mounts with conversation ID", () => {
    const { container } = render(
      <Messages initialConversationId="test-conv-id" />,
    );
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
