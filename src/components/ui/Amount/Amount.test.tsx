import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Amount } from "./Amount";

describe("Amount", () => {
  it("announces expenses as 'minus' and shows a visible sign", () => {
    const { container } = renderWithProviders(<Amount cents={-4500} />);
    expect(screen.getByText("minus 45,00 €")).toHaveClass("visually-hidden");
    expect(container.textContent).toContain("-45,00");
  });

  it("announces income as 'plus' in Persian", () => {
    renderWithProviders(<Amount cents={4500} />, { language: "fa" });
    expect(screen.getByText(/^مثبت ۴۵٫۰۰/)).toBeInTheDocument();
  });

  it("does not add a sign for neutral balances", () => {
    renderWithProviders(<Amount cents={4500} variant="neutral" />);
    expect(screen.getByText("45,00 €", { selector: ".visually-hidden" })).toBeInTheDocument();
  });
});
