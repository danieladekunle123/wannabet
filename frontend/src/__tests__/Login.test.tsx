import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../components/Login";

describe("Login Component", () => {
  it("renders login form", () => {
    render(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("shows validation error on empty submit", async () => {
    render(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /login/i }));
    expect(await screen.findByText(/required/i)).toBeInTheDocument();
  });
});
