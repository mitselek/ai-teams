// Pure validator for a parsed CCR manifest object. Returns a list of human-readable
// error strings (empty = valid). YAML/frontmatter parsing is the caller's job; this
// keeps the core logic dependency-free and unit-testable. (*FR:Brunel*)
import type { PersistKind } from "../../../../types/t10-ccr-contracts.ts";

const KINDS: PersistKind[] = ["generate-able", "stateful"];

export function validateManifest(input: unknown): string[] {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null) return ["manifest is not an object"];
  const m = input as Record<string, unknown>;

  if (typeof m.schema_version !== "string") errors.push("schema_version: missing or not a string");
  if (typeof m.maintenance_contact !== "string" || (m.maintenance_contact as string).trim() === "")
    errors.push("maintenance_contact: missing or empty");

  if (!Array.isArray(m.startup_units)) {
    errors.push("startup_units: missing or not an array");
  } else {
    m.startup_units.forEach((u, i) => {
      const uu = u as Record<string, unknown>;
      if (typeof uu?.name !== "string") errors.push(`startup_units[${i}].name: missing or not a string`);
      if (typeof uu?.command !== "string") errors.push(`startup_units[${i}].command: missing or not a string`);
      if (typeof uu?.long_running !== "boolean") errors.push(`startup_units[${i}].long_running: missing or not a boolean`);
    });
  }

  if (!Array.isArray(m.persistent_paths)) {
    errors.push("persistent_paths: missing or not an array");
  } else {
    m.persistent_paths.forEach((p, i) => {
      const pp = p as Record<string, unknown>;
      if (typeof pp?.path !== "string") errors.push(`persistent_paths[${i}].path: missing or not a string`);
      if (!KINDS.includes(pp?.kind as PersistKind))
        errors.push(`persistent_paths[${i}].kind: must be 'generate-able' or 'stateful'`);
    });
  }

  return errors;
}
