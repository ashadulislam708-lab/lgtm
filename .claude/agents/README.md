# Agents

Specialized agents organized into teams for complex, multi-step tasks.

---

## What Are Agents?

Agents are autonomous Claude instances that handle specific complex tasks. Unlike skills (which provide inline guidance), agents:

- Run as separate sub-tasks
- Work autonomously with minimal supervision
- Have specialized tool access
- Return comprehensive reports when complete
- Are organized into **4 teams** with designated **team leaders**

**Key advantage:** Agents are **standalone** - just copy the `.md` file and use immediately!

---

## Team Structure (19 Agents)

```
                    project-coordinator
                   /       |        |        \
      backend-developer  frontend-developer  quality-lead  documentation-architect
       (team-backend)    (team-frontend)    (team-quality)  (team-docs)
        |  |  |            |    |          |  |  |  |  |  |   |  |
        ns dj db          mob  api        car rp crm pr aer am wr prd

    Cross-Team: ticket-fixer
```

| Team | Leader | Members | Domain |
|------|--------|---------|--------|
| **Backend Engineering** | backend-developer | nestjs-specialist, django-specialist, database-designer | APIs, database, business logic |
| **Frontend & Mobile** | frontend-developer | mobile-developer, api-integration-agent | React web, React Native mobile, API integration audit |
| **Quality & Architecture** | quality-lead | code-architecture-reviewer, refactor-agent, plan-reviewer, auto-error-resolver, agent-monitor | Code review, refactoring, monitoring |
| **Documentation & Research** | documentation-architect | web-research-specialist, prd-converter | Docs, PRD conversion, research |

See [SUBAGENT_REGISTRY.md](SUBAGENT_REGISTRY.md) for complete team details and invocation patterns.

---

## Available Agents (19)

### code-architecture-reviewer

**Purpose:** Review code for architectural consistency and best practices

**When to use:**

- After implementing a new feature
- Before merging significant changes
- When refactoring code
- To validate architectural decisions

**Integration:** ✅ Copy as-is

---

### documentation-architect

**Purpose:** Create comprehensive documentation

**When to use:**

- Documenting new features
- Creating API documentation
- Writing developer guides
- Generating architectural overviews

**Integration:** ✅ Copy as-is

---

### frontend-error-fixer ⏳ Coming Soon

**Purpose:** Debug and fix frontend errors

**When to use:**

- Browser console errors
- TypeScript compilation errors in frontend
- React errors
- Build failures

**Integration:** ⚠️ May reference screenshot paths - update if needed

---

### plan-reviewer

**Purpose:** Review development plans before implementation

**When to use:**

- Before starting complex features
- Validating architectural plans
- Identifying potential issues early
- Getting second opinion on approach

**Integration:** ✅ Copy as-is

---

### refactor-agent

**Purpose:** Analyze, plan, and execute code refactoring (dual-mode: PLAN and EXECUTE)

**When to use:**

- Planning code reorganization
- Executing approved refactoring plans
- Breaking down large files
- Improving code structure and maintainability

**Integration:** ✅ Copy as-is

---

### web-research-specialist

**Purpose:** Research technical issues online

**When to use:**

- Debugging obscure errors
- Finding solutions to problems
- Researching best practices
- Comparing implementation approaches

**Integration:** ✅ Copy as-is

---

### auth-route-tester ⏳ Coming Soon

**Purpose:** Test authenticated API endpoints

**When to use:**

- Testing routes with JWT cookie auth
- Validating endpoint functionality
- Debugging authentication issues

**Integration:** ⚠️ Requires JWT cookie-based auth

---

### auth-route-debugger ⏳ Coming Soon

**Purpose:** Debug authentication issues

**When to use:**

- Auth failures
- Token issues
- Cookie problems
- Permission errors

**Integration:** ⚠️ Requires JWT cookie-based auth

---

### ticket-fixer

**Purpose:** Analyze Notion Bug Report tickets and implement fixes

**When to use:**

- Processing bug reports from Notion database
- Understanding requirements from tickets
- Implementing fixes based on ticket descriptions
- Updating ticket status after resolution

**Integration:** ⚠️ Requires Notion API access

---

### auto-error-resolver

**Purpose:** Automatically fix TypeScript compilation errors

**When to use:**

- Build failures with TypeScript errors
- After refactoring that breaks types
- Systematic error resolution needed

**Integration:** ⚠️ May need path updates

---

## How to Integrate an Agent

### Standard Integration (Most Agents)

**Step 1: Copy the file**

```bash
cp showcase/.claude/agents/agent-name.md \\
   your-project/.claude/agents/
```

**Step 2: Verify (optional)**

```bash
# Check for hardcoded paths
grep -n "~/git/\|/root/git/\|/Users/" your-project/.claude/agents/agent-name.md
```

**Step 3: Use it**
Ask Claude: "Use the [agent-name] agent to [task]"

That's it! Agents work immediately.

---

### Agents Requiring Customization

**frontend-error-fixer:**

- May reference screenshot paths
- Ask user: "Where should screenshots be saved?"
- Update paths in agent file

**auth-route-tester / auth-route-debugger:**

- Require JWT cookie authentication
- Update service URLs from examples
- Customize for user's auth setup

**auto-error-resolver:**

- May have hardcoded project paths
- Update to use `$CLAUDE_PROJECT_DIR` or relative paths

---

## Agent Communication & Subagent Execution

Agents can delegate specialized tasks to other agents using the Task tool, enabling complex orchestration workflows.

### Invoking a Subagent

From within an agent, use the Task tool:

```typescript
Task(
  subagent_type='agent-name',
  description='Brief task summary',
  prompt='Detailed instructions with context'
)
```

### When to Delegate

**Delegate when:**
- Task requires deep specialized knowledge beyond your expertise
- Task is autonomous with clear success criteria
- Task benefits from fresh context and focused attention
- Task is orthogonal to your core responsibility

**Do NOT delegate:**
- Tasks within your core expertise
- Tasks requiring iterative parent involvement
- Simple tasks (1-2 tool calls)
- Tasks where delegation overhead exceeds complexity

### Context Passing

Include in your subagent prompt:
- Parent agent name
- Task context and background
- Files involved
- Previous actions taken
- Expected output format
- Success criteria

**Example:**
```typescript
Task(
  subagent_type='code-architecture-reviewer',
  description='Review auth module',
  prompt=`
    Review the authentication module for ticket #456.

    Context:
    - Parent: backend-developer
    - Files: [list]
    - Implementation: JWT with passport

    Verify: NestJS patterns, Swagger docs, error handling
  `
)
```

### Agent Registry

See [SUBAGENT_REGISTRY.md](SUBAGENT_REGISTRY.md) for:
- Complete list of all agents
- Agent specializations
- Common orchestration patterns
- Invocation examples

---

## When to Use Agents vs Skills

| Use Agents When...                | Use Skills When...              |
| --------------------------------- | ------------------------------- |
| Task requires multiple steps      | Need inline guidance            |
| Complex analysis needed           | Checking best practices         |
| Autonomous work preferred         | Want to maintain control        |
| Task has clear end goal           | Ongoing development work        |
| Example: "Review all controllers" | Example: "Creating a new route" |

**Both can work together:**

- Skill provides patterns during development
- Agent reviews the result when complete

---

## Agent Quick Reference

| Agent                      | Complexity | Customization       | Auth Required |
| -------------------------- | ---------- | ------------------- | ------------- |
| code-architecture-reviewer | Medium     | ✅ None             | No            |
| refactor-agent             | High       | ✅ None             | No            |
| documentation-architect    | Medium     | ✅ None             | No            |
| frontend-error-fixer       | Medium     | ⚠️ Screenshot paths | No            |
| plan-reviewer              | Low        | ✅ None             | No            |
| web-research-specialist    | Low        | ✅ None             | No            |
| auth-route-tester          | Medium     | ⚠️ Auth setup       | JWT cookies   |
| auth-route-debugger        | Medium     | ⚠️ Auth setup       | JWT cookies   |
| ticket-fixer               | Medium     | ⚠️ Notion API       | No            |
| auto-error-resolver        | Low        | ⚠️ Paths            | No            |

---

## For Claude Code

**When integrating agents for a user:**

1. **Read [CLAUDE_INTEGRATION_GUIDE.md](../../CLAUDE_INTEGRATION_GUIDE.md)**
2. **Just copy the .md file** - agents are standalone
3. **Check for hardcoded paths:**
    ```bash
    grep "~/git/\|/root/" agent-name.md
    ```
4. **Update paths if found** to `$CLAUDE_PROJECT_DIR` or `.`
5. **For auth agents:** Ask if they use JWT cookie auth first

**That's it!** Agents are the easiest components to integrate.

---

## Creating Your Own Agents

Agents are markdown files with optional YAML frontmatter:

```markdown
# Agent Name

## Purpose

What this agent does

## Instructions

Step-by-step instructions for autonomous execution

## Tools Available

List of tools this agent can use

## Expected Output

What format to return results in
```

**Tips:**

- Be very specific in instructions
- Break complex tasks into numbered steps
- Specify exactly what to return
- Include examples of good output
- List available tools explicitly

---

## Troubleshooting

### Agent not found

**Check:**

```bash
# Is agent file present?
ls -la .claude/agents/[agent-name].md
```

### Agent fails with path errors

**Check for hardcoded paths:**

```bash
grep "~/\|/root/\|/Users/" .claude/agents/[agent-name].md
```

**Fix:**

```bash
sed -i 's|~/git/.*project|$CLAUDE_PROJECT_DIR|g' .claude/agents/[agent-name].md
```

---

## Next Steps

1. **Browse agents above** - Find ones useful for your work
2. **Copy what you need** - Just the .md file
3. **Ask Claude to use them** - "Use [agent] to [task]"
4. **Create your own** - Follow the pattern for your specific needs

**Questions?** See [CLAUDE_INTEGRATION_GUIDE.md](../../CLAUDE_INTEGRATION_GUIDE.md)
