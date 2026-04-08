import { render, screen } from "@testing-library/react";
import AdminPanel from "../components/AdminPanel";

describe("AdminPanel Component", () => {
  it("renders admin actions", () => {
    render(<AdminPanel />);
    expect(screen.getByText(/ban user/i)).toBeInTheDocument();
    expect(screen.getByText(/resolve dispute/i)).toBeInTheDocument();
  });
});
