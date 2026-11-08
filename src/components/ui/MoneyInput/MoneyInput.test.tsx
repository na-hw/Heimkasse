import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { MoneyInput } from "./MoneyInput";

function Harness({ onValue, initial = null }: { onValue: (v: number | null) => void; initial?: number | null }) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <MoneyInput
      aria-label="Betrag"
      value={value}
      onChange={(v) => {
        setValue(v);
        onValue(v);
      }}
    />
  );
}

describe("MoneyInput", () => {
  it("parses German input to cents and formats on blur", async () => {
    const onValue = vi.fn();
    renderWithProviders(<Harness onValue={onValue} />);
    const input = screen.getByRole("textbox", { name: "Betrag" });
    await userEvent.type(input, "1234,5");
    expect(onValue).toHaveBeenLastCalledWith(123450);
    await userEvent.tab();
    expect(input).toHaveValue("1.234,50");
  });

  it("accepts Persian digits and separators", async () => {
    const onValue = vi.fn();
    renderWithProviders(<Harness onValue={onValue} />, { language: "fa" });
    await userEvent.type(screen.getByRole("textbox"), "۴۵٫۹۹");
    expect(onValue).toHaveBeenLastCalledWith(4599);
  });

  it("reports null for invalid or negative input", async () => {
    const onValue = vi.fn();
    renderWithProviders(<Harness onValue={onValue} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "-5");
    expect(onValue).toHaveBeenLastCalledWith(null);
    await userEvent.clear(input);
    await userEvent.type(input, "abc");
    expect(onValue).toHaveBeenLastCalledWith(null);
  });

  it("shows an initial value formatted in Persian digits", () => {
    renderWithProviders(<Harness onValue={vi.fn()} initial={123456} />, { language: "fa" });
    expect((screen.getByRole("textbox") as HTMLInputElement).value.replace(/[‎‏]/g, "")).toBe("۱٬۲۳۴٫۵۶");
  });
});
