import { BaseRepository, type RepositoryDeps } from "@/lib/db/repository";
import {
  DEFAULT_PREFERENCES,
  type PreferenceKey,
  type Preferences,
  preferencesSchema,
} from "@/lib/preferences/types";
import {
  type Setting,
  type SettingCreate,
  type SettingUpdate,
  settingCreateSchema,
  settingSchema,
  settingUpdateSchema,
} from "./schemas";

export class SettingsRepository extends BaseRepository<Setting, SettingCreate, SettingUpdate> {
  constructor(deps: RepositoryDeps) {
    super(
      "settings",
      { entity: settingSchema, create: settingCreateSchema, update: settingUpdateSchema },
      deps,
    );
  }

  /**
   * Reads all preferences. Missing or invalid stored values fall back to
   * their defaults individually, so one bad row never breaks the app.
   */
  async getPreferences(): Promise<Preferences> {
    const rows = await this.list();
    const prefs: Preferences = { ...DEFAULT_PREFERENCES };
    for (const row of rows) {
      const key = row.key as PreferenceKey;
      const field = preferencesSchema.shape[key];
      if (!field) continue;
      const parsed = field.safeParse(row.value);
      if (parsed.success) Object.assign(prefs, { [key]: parsed.data });
    }
    return prefs;
  }

  /** Validates and upserts a single preference. */
  async setPreference<K extends PreferenceKey>(key: K, value: Preferences[K]): Promise<void> {
    const validated = preferencesSchema.shape[key].parse(value);
    const [existing] = await this.list({ where: [{ field: "key", op: "eq", value: key }] });
    if (existing) {
      await this.update(existing.id, { value: validated });
    } else {
      await this.create({ key, value: validated });
    }
  }
}
