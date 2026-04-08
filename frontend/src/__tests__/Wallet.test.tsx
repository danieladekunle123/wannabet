import { render, screen } from "@testing-library/react";
import Wallet from "../components/Wallet";

describe("Wallet Component", () => {
  it("renders wallet balance", () => {
    render(<Wallet balance={1000} escrow={500} />);
    expect(screen.getByText(/balance/i)).toBeInTheDocument();
    expect(screen.getByText(/1000/)).toBeInTheDocument();
    expect(screen.getByText(/escrow/i)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });
});
