import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  type Category,
  type CategoryCreate,
  type CategoryType,
  type CategoryUpdate,
  categoryCreateSchema,
  categorySchema,
  categoryUpdateSchema,
} from "./schemas";

export class CategoriesRepository extends BaseRepository<Category, CategoryCreate, CategoryUpdate> {
  constructor(deps: RepositoryDeps) {
    super("categories", { entity: categorySchema, create: categoryCreateSchema, update: categoryUpdateSchema }, deps);
  }

  /** Active categories (optionally of one type) in display order. */
  listActive(type?: CategoryType): Promise<Category[]> {
    return this.list({
      where: [
        { field: "archived", op: "eq", value: false },
        ...(type ? [{ field: "type", op: "eq" as const, value: type }] : []),
      ],
      orderBy: [{ field: "sort_order" }],
    });
  }
}
