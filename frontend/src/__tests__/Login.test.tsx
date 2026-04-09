import { screen, fireEvent } from "@testing-library/react";
import { render } from "../test/test-utils";
import { Login } from "../components/Login";
import { vi } from "vitest";
import React from "react";

describe("Login Component", () => {
  const onNavigate = vi.fn();
  const onSwitchToSignup = vi.fn();

  it("renders login form with email and password fields", () => {
    render(
      <Login onNavigate={onNavigate} onSwitchToSignup={onSwitchToSignup} />,
    );
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it("renders sign-in button", () => {
    render(
      <Login onNavigate={onNavigate} onSwitchToSignup={onSwitchToSignup} />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("allows typing in email field", () => {
    render(
      <Login onNavigate={onNavigate} onSwitchToSignup={onSwitchToSignup} />,
    );
    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput).toHaveValue("test@example.com");
  });

  it("allows typing in password field", () => {
    render(
      <Login onNavigate={onNavigate} onSwitchToSignup={onSwitchToSignup} />,
    );
    const passwordInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "secret123" } });
    expect(passwordInput).toHaveValue("secret123");
  });
});
