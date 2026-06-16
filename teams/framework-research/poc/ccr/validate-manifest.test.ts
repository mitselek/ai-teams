import { test } from "node:test";
import assert from "node:assert/strict";
import { validateManifest } from "./validate-manifest.ts";

const valid = {
  schema_version: "1.0.0",
  startup_units: [
    { name: "courier", command: "python3 stationmaster-courier.reference.py --config courier.json", long_running: true },
  ],
  persistent_paths: [
    { path: "~/.ssh/stationmaster_apex", kind: "stateful" },
    { path: "courier.json", kind: "generate-able" },
  ],
  maintenance_contact: "apex PO",
};

test("valid manifest yields no errors", () => {
  assert.deepEqual(validateManifest(valid), []);
});

test("missing maintenance_contact is rejected", () => {
  const m: any = { ...valid }; delete m.maintenance_contact;
  assert.ok(validateManifest(m).some((e) => e.includes("maintenance_contact")));
});

test("bad persist kind is rejected", () => {
  const m = { ...valid, persistent_paths: [{ path: "x", kind: "ephemeral" }] };
  assert.ok(validateManifest(m).some((e) => e.includes("kind")));
});

test("non-object input is rejected", () => {
  assert.deepEqual(validateManifest(null), ["manifest is not an object"]);
});

test("startup_unit missing long_running is rejected", () => {
  const m = { ...valid, startup_units: [{ name: "x", command: "y" }] };
  assert.ok(validateManifest(m).some((e) => e.includes("long_running")));
});
