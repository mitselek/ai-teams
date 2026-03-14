// (*CD:Babbage*)
// comms-publish — bridge operational findings to GitHub Issues via the `gh` CLI.
//
// Usage:
//   comms-publish --title <title> --type <type> [--affects <team>] [--body <text>] [--body-file <path>]
//
// Options:
//   --title <text>       Issue title (required)
//   --type <type>        finding|decision|question|blocker (required)
//   --affects <team>     Team name affected (or "all") — creates 'affects:<team>' label
//   --body <text>        Issue body markdown
//   --body-file <path>   Read body from file (preferred for long content)
//   --dry-run            Print gh command but don't execute
//
// Required environment:
//   COMMS_TEAM_NAME   — creates 'team:<name>' label
//   COMMS_AGENT_NAME  — used in attribution footer
//   COMMS_TEAM_PREFIX — used in attribution footer

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';

const VALID_TYPES = new Set<string>(['finding', 'decision', 'question', 'blocker']);
const REPO = 'mitselek/ai-teams';

// GOTCHA: gh CLI cannot read files from /tmp/ due to sandbox isolation.
// Write temp files to cwd instead.
const TEMP_BODY_FILE = path.join(process.cwd(), '.gh-issue-body.md');

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      title: { type: 'string' },
      type: { type: 'string' },
      affects: { type: 'string' },
      body: { type: 'string' },
      'body-file': { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  });

  if (!values.title) fatal('--title is required');
  if (!values.type) fatal('--type is required');
  if (!VALID_TYPES.has(values.type)) {
    fatal(`Invalid type: ${values.type}. Valid: ${[...VALID_TYPES].join(', ')}`);
  }

  const teamName = requireEnv('COMMS_TEAM_NAME');
  const agentName = process.env['COMMS_AGENT_NAME'] ?? 'unknown';
  const teamPrefix = process.env['COMMS_TEAM_PREFIX'] ?? 'CD';

  let body: string;
  if (values['body-file']) {
    try {
      body = fs.readFileSync(values['body-file'], 'utf8').trim();
    } catch (err) {
      fatal(`Cannot read body file: ${(err as Error).message}`);
    }
  } else if (values.body) {
    body = values.body;
  } else {
    body = '';
  }

  // Build the full issue body with header metadata and attribution footer
  const affectsLine = values.affects ? `**Affects:** ${values.affects}` : '';
  const issueBody = [
    `**Team:** ${teamName}`,
    `**Agent:** ${agentName}`,
    `**Type:** ${values.type}`,
    affectsLine,
    '',
    '---',
    '',
    body,
    '',
    `(*${teamPrefix}:${agentName}*)`,
  ].filter(line => line !== undefined).join('\n');

  // Write to temp file (not /tmp — gh CLI sandbox restriction)
  fs.writeFileSync(TEMP_BODY_FILE, issueBody, 'utf8');

  // Build gh command
  const labels = [
    `team:${teamName}`,
    `type:${values.type}`,
    ...(values.affects ? [`affects:${values.affects}`] : []),
  ];

  const ghArgs = [
    'issue', 'create',
    '--repo', REPO,
    '--title', values.title!,
    '--body-file', TEMP_BODY_FILE,
    ...labels.flatMap(l => ['--label', l]),
  ];

  if (values['dry-run']) {
    console.log('DRY RUN — would execute:');
    console.log(`gh ${ghArgs.join(' ')}`);
    console.log('\nBody:\n' + issueBody);
    cleanup();
    return;
  }

  try {
    const output = execFileSync('gh', ghArgs, { encoding: 'utf8' });
    console.log('Created issue:', output.trim());
  } catch (err) {
    // Attempt to create missing labels if that's the failure
    const errMsg = (err as Error).message;
    if (errMsg.includes('label') && errMsg.includes('not found')) {
      console.warn('Some labels not found. Create them first with:');
      for (const label of labels) {
        console.warn(`  gh label create "${label}" --repo ${REPO}`);
      }
    }
    fatal(`gh issue create failed: ${errMsg}`);
  } finally {
    cleanup();
  }
}

function cleanup(): void {
  try {
    fs.unlinkSync(TEMP_BODY_FILE);
  } catch {
    // Already gone — fine
  }
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) fatal(`Required environment variable not set: ${name}`);
  return val!;
}

function fatal(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
