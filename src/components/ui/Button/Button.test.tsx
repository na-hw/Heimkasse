import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Button } from "./Button";

describe("Button", () => {
  it("is a non-submitting button by default", () => {
    renderWithProviders(<Button>Speichern</Button>);
    expect(screen.getByRole("button", { name: "Speichern" })).toHaveAttribute("type", "button");
  });

  it("blocks clicks and exposes aria-busy while loading", async () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button loading onClick={onClick}>
        Speichern
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Speichern" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("can render a link with button styles", () => {
    renderWithProviders(
      <Button asChild variant="primary">
        <a href="/settings/">Einstellungen</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Einstellungen" })).toHaveAttribute(
      "href",
      "/settings/",
    );
  });
});
