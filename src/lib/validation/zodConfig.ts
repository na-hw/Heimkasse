import { z } from "zod";
import { validationMessage } from "./messages";

/** Maps Zod issues to translation keys (see messages.ts). Installed once at startup. */
export function installZodErrorMap(): void {
  z.config({
    customError: (issue) => {
      switch (issue.code) {
        case "invalid_type":
          if (issue.input === undefined || issue.input === null || issue.input === "") {
            return validationMessage("validation.required");
          }
          return issue.expected === "number"
            ? validationMessage("validation.invalidNumber")
            : validationMessage("validation.required");
        case "too_small":
          if (issue.origin === "string") {
            return Number(issue.minimum) <= 1
              ? validationMessage("validation.required")
              : validationMessage("validation.min", { min: Number(issue.minimum) });
          }
          if (issue.origin === "number" && Number(issue.minimum) === 0 && !issue.inclusive) {
            return validationMessage("validation.positive");
          }
          return validationMessage("validation.min", { min: Number(issue.minimum) });
        case "too_big":
          return issue.origin === "string"
            ? validationMessage("validation.tooLong", { max: Number(issue.maximum) })
            : validationMessage("validation.max", { max: Number(issue.maximum) });
        case "invalid_value":
          return validationMessage("validation.required");
        default:
          return undefined;
      }
    },
  });
}

installZodErrorMap();
