import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TagInput } from "./TagInput";

function Harness() {
  const [tags, setTags] = useState<string[]>(["urlaub"]);
  return <TagInput id="tags" value={tags} onChange={setTags} />;
}

describe("TagInput", () => {
  it("adds tags with Enter and comma, ignoring duplicates", async () => {
    renderWithProviders(<Harness />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "familie{Enter}auto,urlaub,");
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "urlaub",
      "familie",
      "auto",
    ]);
  });

  it("removes tags via button and Backspace", async () => {
    renderWithProviders(<Harness />);
    await userEvent.type(screen.getByRole("combobox"), "a{Enter}");
    await userEvent.click(screen.getByRole("button", { name: "Tag urlaub entfernen" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    await userEvent.type(screen.getByRole("combobox"), "{Backspace}");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
