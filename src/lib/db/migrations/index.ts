import { migration001 } from "./001_initial";
import { migration002 } from "./002_warm_rent";
import type { Migration } from "./types";

/** All migrations in ascending order. Append new ones; never edit released ones. */
export const MIGRATIONS: readonly Migration[] = [migration001, migration002];

export const LATEST_SCHEMA_VERSION = MIGRATIONS.at(-1)?.version ?? 0;

export type { Migration } from "./types";
