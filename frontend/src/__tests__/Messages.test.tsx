import { render, screen } from "@testing-library/react";
import Messages from "../components/Messages";

describe("Messages Component", () => {
  it("renders messages list", () => {
    const messages = [
      { id: "1", content: "Hello", sender: "user1" },
      { id: "2", content: "World", sender: "user2" },
    ];
    render(<Messages messages={messages} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("World")).toBeInTheDocument();
  });
});
