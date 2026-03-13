export type AgentType = "team-lead" | "general-purpose";

export type AgentColor =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "gray";

export type Model =
  | "claude-opus-4-6"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5-20251001";

export interface AgentLore {
  /** Full ceremonial name */
  fullName: string;
  /** Literary or cultural origin of the name */
  origin: string;
  /** Why this name fits the agent's role */
  significance: string;
}

export interface RosterMember {
  /** Short name used in team communication and spawning */
  name: string;
  agentType: AgentType;
  model: Model;
  /** Path to the agent's prompt file, relative to team directory */
  prompt: string;
  /** Terminal color for the agent's messages */
  color?: AgentColor;
  /** Literary/cultural backstory behind the agent's name */
  lore?: AgentLore;
}

export interface Roster {
  /** Team identifier */
  name: string;
  /** What this team does */
  description: string;
  /** Path to shared prompt file, relative to team directory */
  commonPromptFile: string;
  /** Absolute path to the working directory for this team */
  workDir: string;
  members: RosterMember[];
}
