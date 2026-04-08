import { render, screen, fireEvent } from "@testing-library/react";
import DisputeForm from "../components/DisputeForm";

describe("DisputeForm Component", () => {
  it("renders dispute form", () => {
    render(<DisputeForm matchId="match1" />);
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("shows validation error on empty submit", async () => {
    render(<DisputeForm matchId="match1" />);
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(await screen.findByText(/required/i)).toBeInTheDocument();
  });
});
