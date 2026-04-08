import { render, screen } from "@testing-library/react";
import React from "react";

describe("Example Frontend Test", () => {
  it("renders a simple element", () => {
    render(<div>Hello Test</div>);
    expect(screen.getByText("Hello Test")).toBeInTheDocument();
  });
});
