import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("requires the confirmation word before confirming", async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Alle Daten löschen?"
        description="Kann nicht rückgängig gemacht werden."
        confirmLabel="Endgültig löschen"
        confirmationWord="LÖSCHEN"
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole("alertdialog", { name: "Alle Daten löschen?" })).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Endgültig löschen" });
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByRole("textbox"), "LÖSCH");
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByRole("textbox"), "EN");
    expect(confirm).toBeEnabled();

    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("focuses Cancel first so Enter never confirms by accident", () => {
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Löschen?"
        description="Sicher?"
        confirmLabel="Löschen"
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Abbrechen" })).toHaveFocus();
  });
});
