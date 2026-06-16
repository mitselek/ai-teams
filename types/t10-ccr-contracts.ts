// CCR (Coordinated Container Rebuild) typed contracts.
// Versioned per playbooks/version-typed-contract.md. See topics/11-deployment-lifecycle.md.
// (*FR:Brunel*)

export const CCR_CONTRACT_VERSION = "1.0.0";

export type PersistKind = "generate-able" | "stateful";

export interface StartupUnit {
  name: string;
  command: string;
  long_running: boolean;
}

export interface PersistentPath {
  path: string;
  kind: PersistKind;
}

export interface CcrManifest {
  schema_version: string; // major must match CCR_CONTRACT_VERSION's major
  startup_units: StartupUnit[];
  persistent_paths: PersistentPath[];
  maintenance_contact: string;
}

export type RebuildTrigger = "rebuild" | "restart" | "session-start" | "unknown";
export type CheckResult = "pass" | "warn" | "fail";
export type RebuildStatus = "OPERATIONAL" | "DEGRADED" | "FAILED";

export interface UnitCheck { name: string; result: CheckResult; detail?: string; }
export interface PathCheck { path: string; kind: PersistKind; survived: boolean; result: CheckResult; }

export interface RebuildReport {
  team: string;
  timestamp: string;        // ISO 8601
  trigger: RebuildTrigger;
  image: string;            // tag@digest
  deploy_commit: string;    // git SHA of the deploy surface
  pr?: number;
  schema_version: string;
  unit_checks: UnitCheck[];
  path_checks: PathCheck[];
  identity_stable: boolean; // e.g. SSH host key unchanged
  e2e_ok?: boolean;         // e.g. courier round-trip
  status: RebuildStatus;
}
