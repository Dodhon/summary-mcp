import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "mcp-aar-summarizer",
    version: "0.1.0"
  },
  {
    capabilities: {
      prompts: {},
      tools: {}
    }
  }
);

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "conversation_aar_warehouse",
        description: "After Action Report for a warehouse operator–chatbot troubleshooting conversation. Returns strict JSON only.",
        arguments: [
          {
            name: "conversation",
            description: "Full transcript text of the conversation.",
            required: true
          },
          {
            name: "ticket_id",
            description: "Optional ticket or reference identifier.",
            required: false
          }
        ]
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (req: any) => {
  const { name, arguments: args } = req.params;
  if (name !== "conversation_aar_warehouse") {
    throw new Error(`Unknown prompt: ${name}`);
  }

  const system = `You are producing an After Action Report for a warehouse operator–chatbot troubleshooting conversation. The trouble shooting conversation is the conversation that this tool is being called in. Be concise, factual, and blameless. Only include facts present in the transcript. If a field is unclear, set it to "unknown". Prefer concrete artifacts such as SKU/part IDs, bin/zone/station, WMS messages/codes, device IDs, timestamps, and exact commands or settings. Return valid JSON ONLY that exactly matches the schema and field names. Keep lists focused on the most material items (aim for up to 5–10).`;

  const user = `JSON schema (return exactly these fields; do not add or remove fields):\n{\n  "ticket_id": "string",\n  "issue_type": "string",\n  "description": "string",\n  "user_provided_info": [\n    { "label": "string", "value": "string" }\n  ],\n  "key_artifacts": [\n    "string"\n  ],\n  "diagnosed_issue": "string",\n  "root_cause": "string",\n  "detailed_actions": [\n    {\n      "timestamp": "string (optional)",\n      "actor": "string (optional)",\n      "action": "string",\n      "status": "succeeded | failed | no_effect | blocked | deferred",\n      "result": "string (optional)",\n      "evidence": "string (optional)"\n    }\n  ],\n  "effective_actions": [\n    { "action": "string", "impact": "string" }\n  ],\n  "solution_summary": "string",\n  "detailed_solution": [\n    "string"\n  ],\n  "effectiveness": {\n    "rating": "effective | partially_effective | ineffective",\n    "notes": "string"\n  },\n  "follow_ups": [\n    "string"\n  ]\n}\n\nRules:\n- Do not invent facts. Use "unknown" if not supported by the transcript.\n- Include all material attempts in detailed_actions with a clear status and any evidence.\n- Place only the successful/impactful items in effective_actions.\n- Redact personal identifiers if present (emails/phones) unless essential for remediation.\n- Output JSON only. No prose before or after.`;

  return {
    messages: [
      { role: "system", content: [{ type: "text", text: system }] },
      { role: "user", content: [{ type: "text", text: user }] }
    ]
  };
});

// Tools: expose summarize_aar tool
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "summarize_aar",
        description: "Generate an After Action Report JSON from a warehouse operator–chatbot conversation.",
        inputSchema: {
          type: "object",
          properties: {
            conversation: { type: "string" },
            ticket_id: { type: "string" }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
  const { name, arguments: args } = req.params;
  if (name !== "summarize_aar") {
    return { content: [{ type: "text", text: `Error: Unknown tool ${name}` }], isError: true };
  }
  const ticketId = (args?.ticket_id as string | undefined) ?? "";

  const system = `You are producing an After Action Report for a warehouse operator–chatbot troubleshooting conversation. Be concise, factual, and blameless. Only include facts present in the existing chat context. If a field is unclear, set it to "unknown". Prefer concrete artifacts such as SKU/part IDs, bin/zone/station, WMS messages/codes, device IDs, timestamps, and exact commands or settings. Return valid JSON ONLY that exactly matches the schema and field names. Keep lists focused on the most material items (aim for up to 5–10).`;

  const user = `Use the current conversation context (do not quote or restate it). If provided, set ticket_id to: ${ticketId || "unknown"}. Now produce ONLY the JSON object (no prose) matching this schema exactly:\n{\n  "ticket_id": "string",\n  "issue_type": "string",\n  "description": "string",\n  "user_provided_info": [\n    { "label": "string", "value": "string" }\n  ],\n  "key_artifacts": [\n    "string"\n  ],\n  "diagnosed_issue": "string",\n  "root_cause": "string",\n  "detailed_actions": [\n    {\n      "timestamp": "string (optional)",\n      "actor": "string (optional)",\n      "action": "string",\n      "status": "succeeded | failed | no_effect | blocked | deferred",\n      "result": "string (optional)",\n      "evidence": "string (optional)"\n    }\n  ],\n  "effective_actions": [\n    { "action": "string", "impact": "string" }\n  ],\n  "solution_summary": "string",\n  "detailed_solution": [\n    "string"\n  ],\n  "effectiveness": {\n      "rating": "effective | partially_effective | ineffective",\n      "notes": "string"\n  },\n  "follow_ups": [\n    "string"\n  ]\n}\nRules:\n- Do not invent facts. Use "unknown" if not supported by the context.\n- Include all material attempts in detailed_actions with a clear status and any evidence.\n- Place only the successful/impactful items in effective_actions.\n- Redact personal identifiers if present (emails/phones) unless essential for remediation.\n- Output JSON only. No prose before or after.`;

  const text = `${system}\n\n${user}`;
  return { content: [{ type: "text", text }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
