import { render, screen } from "@testing-library/react";
import NotificationDropdown from "../components/NotificationDropdown";

describe("NotificationDropdown Component", () => {
  it("renders notifications", () => {
    const notifications = [
      { id: "1", message: "Test notification", type: "info" },
    ];
    render(<NotificationDropdown notifications={notifications} />);
    expect(screen.getByText("Test notification")).toBeInTheDocument();
  });
});
