import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { validationMessage } from "@/lib/validation/messages";
import { Input } from "../Input";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("labels the control and links hint and error via aria-describedby", () => {
    renderWithProviders(
      <FormField
        label="Name"
        hint="Shown in lists"
        error={validationMessage("validation.tooLong", { max: 5 })}
        required
      >
        <Input />
      </FormField>,
    );
    const input = screen.getByRole("textbox", { name: /Name/ });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAccessibleDescription(/Shown in lists.*höchstens 5 Zeichen/);
  });

  it("translates validation keys in the active language", () => {
    renderWithProviders(
      <FormField label="Betrag" error={validationMessage("validation.required")}>
        <Input />
      </FormField>,
      { language: "fa" },
    );
    expect(screen.getByText("لطفاً این فیلد را پر کنید.")).toBeInTheDocument();
  });

  it("omits aria-invalid when there is no error", () => {
    renderWithProviders(
      <FormField label="Name">
        <Input />
      </FormField>,
    );
    expect(screen.getByRole("textbox", { name: "Name" })).not.toHaveAttribute("aria-invalid");
  });
});
