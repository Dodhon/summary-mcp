## MCP AAR Summarizer (Prompt-first)

Minimal MCP server exposing a single prompt for generating an After Action Report (AAR) for a warehouse operator–chatbot troubleshooting conversation. Claude Desktop will render the prompt and produce a strict JSON summary.

### Prerequisites

- Node.js >= 18
- npm (or pnpm if you prefer)

### Install

```bash
cd /Users/thuptenwangpo/Documents/GitHub/summary-mcp/mcp-aar
npm ci
npm run build
```

### Run (optional local test)

```bash
npm start
```

### Configure Claude Desktop

Edit the config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add an entry under `mcpServers` (adjust paths if needed):

```json
{
  "mcpServers": {
    "aar-summarizer": {
      "command": "node",
      "args": [
        "/absolute/path/to/summary-mcp/mcp-aar/dist/index.js"
      ]
    }
  }
}
```

Restart Claude Desktop.

### Use in Claude Desktop
- Open the MCP menu, choose the prompt: `conversation_aar_warehouse`.
- Paste the conversation into `conversation` and optionally provide `ticket_id`.
- Claude will return a JSON object matching the AAR schema.

Also exposed as a tool: `summarize_aar` (same output behavior, for tool workflows).

### Prompt behavior
- Factual, blameless, concise.
- If unknown, set field to `"unknown"`.
- Lists focus on most material 5–10 items.
- JSON only; no prose.

Environment: No environment variables required.

### Schema fields
- `ticket_id`, `issue_type`, `description`, `user_provided_info[]`, `key_artifacts[]`, `diagnosed_issue`, `root_cause`, `detailed_actions[] { timestamp?, actor?, action, status, result?, evidence? }`, `effective_actions[]`, `solution_summary`, `detailed_solution[]`, `effectiveness { rating, notes }`, `follow_ups[]`.
