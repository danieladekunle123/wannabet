import { render, screen, fireEvent } from "@testing-library/react";
import Upload from "../components/Upload";

describe("Upload Component", () => {
  it("renders upload button", () => {
    render(<Upload />);
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });

  it("shows error on invalid file type", async () => {
    render(<Upload />);
    const fileInput = screen.getByLabelText(/file/i);
    const file = new File(["test"], "test.exe", {
      type: "application/x-msdownload",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(await screen.findByText(/invalid file type/i)).toBeInTheDocument();
  });
});
