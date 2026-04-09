import { screen } from "@testing-library/react";
import { render } from "../test/test-utils";
import { WalletEscrow } from "../components/WalletEscrow";
import { vi } from "vitest";
import React from "react";

// Mock API calls the wallet component makes
vi.mock("../lib/api", () => ({
  default: vi.fn(() =>
    Promise.resolve({
      balance: 10000,
      escrow: 500,
      ledger: [],
    }),
  ),
  __esModule: true,
}));

describe("WalletEscrow Component", () => {
  const onNavigate = vi.fn();

  it("renders without crashing", () => {
    render(<WalletEscrow onNavigate={onNavigate} />);
    expect(document.body).toBeDefined();
  });

  it("mounts the wallet component", () => {
    const { container } = render(<WalletEscrow onNavigate={onNavigate} />);
    expect(container).toBeDefined();
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
