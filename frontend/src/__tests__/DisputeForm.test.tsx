import { screen } from "@testing-library/react";
import { render } from "../test/test-utils";
import { Signup } from "../components/Signup";
import { vi } from "vitest";
import React from "react";
import { fireEvent } from "@testing-library/react";

describe("Signup Component", () => {
  const onNavigate = vi.fn();
  const onSwitchToLogin = vi.fn();

  it("renders signup form", () => {
    render(
      <Signup onNavigate={onNavigate} onSwitchToLogin={onSwitchToLogin} />,
    );
    // Signup should have email, username, and password inputs
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    const passwordFields = screen.getAllByPlaceholderText(/password/i);
    expect(passwordFields.length).toBeGreaterThanOrEqual(1);
  });

  it("allows typing in email field", () => {
    render(
      <Signup onNavigate={onNavigate} onSwitchToLogin={onSwitchToLogin} />,
    );
    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: "new@example.com" } });
    expect(emailInput).toHaveValue("new@example.com");
  });

  it("renders sign-up button", () => {
    render(
      <Signup onNavigate={onNavigate} onSwitchToLogin={onSwitchToLogin} />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
