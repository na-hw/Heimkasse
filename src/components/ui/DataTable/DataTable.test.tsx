import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DataTable, createColumnHelper } from ".";

interface Row {
  id: string;
  name: string;
  amount: number;
}

const column = createColumnHelper<Row>();
const columns = [
  column.accessor("name", { header: "Name" }),
  column.accessor("amount", { header: "Betrag", meta: { align: "end" } }),
];
const data: Row[] = [
  { id: "1", name: "Miete", amount: 900 },
  { id: "2", name: "Abo", amount: 10 },
  { id: "3", name: "Lebensmittel", amount: 350 },
];

const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => within(r).getAllByRole("cell")[0]?.textContent);

describe("DataTable", () => {
  it("renders a captioned table and sorts with aria-sort", async () => {
    renderWithProviders(
      <DataTable caption="Ausgaben" data={data} columns={columns} getRowId={(r) => r.id} />,
    );
    expect(screen.getByRole("table", { name: "Ausgaben" })).toBeInTheDocument();
    const header = screen.getByRole("columnheader", { name: /Name/ });
    expect(header).toHaveAttribute("aria-sort", "none");
    await userEvent.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(names()).toEqual(["Abo", "Lebensmittel", "Miete"]);
  });

  it("filters rows and shows the empty state", () => {
    const { rerender } = renderWithProviders(
      <DataTable
        caption="A"
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        globalFilter="miet"
        emptyState={<p>Leer</p>}
      />,
    );
    expect(names()).toEqual(["Miete"]);
    rerender(
      <DataTable
        caption="A"
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        globalFilter="xyz"
        emptyState={<p>Leer</p>}
      />,
    );
    expect(screen.getByText("Leer")).toBeInTheDocument();
  });

  it("selects rows with labelled checkboxes", async () => {
    renderWithProviders(
      <DataTable
        caption="A"
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        enableSelection
      />,
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Alle Zeilen auswählen" }));
    const rowBoxes = screen.getAllByRole("checkbox", { name: "Zeile auswählen" });
    expect(rowBoxes.every((b) => b.getAttribute("aria-checked") === "true")).toBe(true);
  });

  it("paginates with accessible controls", async () => {
    renderWithProviders(
      <DataTable caption="A" data={data} columns={columns} getRowId={(r) => r.id} pageSize={2} />,
    );
    expect(screen.getByText("Seite 1 von 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Nächste Seite" }));
    expect(names()).toEqual(["Lebensmittel"]);
  });

  it("shows skeleton rows while loading", () => {
    renderWithProviders(
      <DataTable caption="A" data={[]} columns={columns} getRowId={(r) => r.id} isLoading />,
    );
    expect(screen.getByRole("table").closest("[aria-busy]")).toHaveAttribute("aria-busy", "true");
  });
});
