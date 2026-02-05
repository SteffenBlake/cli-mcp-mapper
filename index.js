#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { buildInputSchema, buildCommand, executeCommand } from "./lib.js";

// Load config from env variable or default path
const defaultConfig = join(homedir(), ".config", "cli-mcp-mapper", "commands.json");
const configPath = process.env.CLI_MCP_MAPPER_CONFIG || defaultConfig;
const config = JSON.parse(await readFile(configPath, "utf-8"));

const server = new Server(
  {
    name: "cli-mcp-mapper",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: Object.keys(config.commands).reduce((acc, name) => {
        acc[name] = true;
        return acc;
      }, {}),
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = Object.entries(config.commands).map(([name, cmd]) => ({
    name,
    description: cmd.description,
    inputSchema: buildInputSchema(cmd.parameters),
  }));
  
  return { tools };
});

// Execute tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const commandConfig = config.commands[name];
  
  if (!commandConfig) {
    throw new Error(`Unknown command: ${name}`);
  }
  
  const cmdArray = buildCommand(commandConfig, args);
  const result = await executeCommand(cmdArray);
  
  return {
    content: [
      {
        type: "text",
        text: result,
      },
    ],
  };
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
