---
description: Generate agent monitoring reports (daily summary, error analysis, team health, delegation chains)
argument-hint: "<report-type>"
---

# Agent Report

Generate monitoring reports for the agent orchestration system.

## Usage

```
/agent-report <report-type>
```

## Report Types

| Type | Description |
|------|-------------|
| `daily` | Daily summary of all agent activity (last 24h) |
| `errors` | Error pattern analysis (last 7 days) |
| `health` | Team health assessment and load distribution |
| `chains` | Delegation chain analysis and efficiency |
| `full` | All reports combined |

## Workflow

1. Parse the report type from arguments (default: `daily`)
2. Invoke the `agent-monitor` agent with the appropriate prompt:

```
Task(
  subagent_type='agent-monitor',
  description='Generate [report-type] monitoring report',
  prompt='Generate a [report-type] report by reading data from:
    - .claude/monitoring/logs/*.jsonl (raw activity logs)
    - .claude/monitoring/AGENT_MONITOR_DASHBOARD.md (current dashboard)
    - .claude/monitoring/AGENT_ERROR_LOG.md (error patterns)
    - .claude/agents/agent-registry.json (agent definitions and teams)

    Report type: [report-type]
    Output the report as formatted markdown.'
)
```

3. Display the report output to the user

## Examples

```
/agent-report daily      # What happened today?
/agent-report errors     # What's been failing?
/agent-report health     # How are teams doing?
/agent-report chains     # Are delegation patterns efficient?
/agent-report full       # Everything
```

## Data Sources

- `.claude/monitoring/logs/*.jsonl` - JSONL activity logs per session
- `.claude/monitoring/AGENT_MONITOR_DASHBOARD.md` - Auto-updated dashboard
- `.claude/monitoring/AGENT_ACTIVITY_HISTORY.md` - Rolling 7-day summary
- `.claude/monitoring/AGENT_ERROR_LOG.md` - Error pattern tracking
- `.claude/agents/agent-registry.json` - Agent team structure and roles
