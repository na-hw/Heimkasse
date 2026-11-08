import type { IconKey } from "@/lib/appearance/icons";
import type { ColorKey } from "@/lib/appearance/palette";
import type { Meter } from "../schemas";

/** Icon and color per meter type. */
export const METER_APPEARANCE: Record<Meter["type"], { icon: IconKey; color: ColorKey }> = {
  electricity: { icon: "zap", color: "amber" },
  gas: { icon: "flame", color: "orange" },
  water: { icon: "droplet", color: "blue" },
  heating: { icon: "thermometer", color: "red" },
};
