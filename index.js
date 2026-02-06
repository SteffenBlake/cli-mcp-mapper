#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { buildInputSchema, buildCommand, executeCommand } from "./lib.js";

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Load config from env variable or default path
const defaultConfig = join(homedir(), ".config", "cli-mcp-mapper", "commands.json");
const configPath = process.env.CLI_MCP_MAPPER_CONFIG || defaultConfig;

let config;
try {
  const configContent = await readFile(configPath, "utf-8");
  config = JSON.parse(configContent);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`Error: Configuration file not found at ${configPath}`);
    console.error('Please create a configuration file or set CLI_MCP_MAPPER_CONFIG environment variable.');
    process.exit(1);
  } else if (error instanceof SyntaxError) {
    console.error(`Error: Invalid JSON syntax in configuration file ${configPath}`);
    console.error(error.message);
    process.exit(1);
  } else {
    console.error(`Error: Failed to load configuration file ${configPath}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Validate config structure
if (!config.commands || typeof config.commands !== 'object') {
  console.error('Error: Invalid configuration structure. Expected "commands" object.');
  process.exit(1);
}

// If dry-run mode, validate and exit
if (isDryRun) {
  console.log(`Configuration loaded successfully from ${configPath}`);
  console.log(`Found ${Object.keys(config.commands).length} command(s):`);
  
  for (const [name, cmd] of Object.entries(config.commands)) {
    try {
      // Validate command structure
      if (!cmd.command || typeof cmd.command !== 'string') {
        throw new Error(`Invalid command definition: missing or invalid 'command' field`);
      }
      if (!cmd.description || typeof cmd.description !== 'string') {
        throw new Error(`Invalid command definition: missing or invalid 'description' field`);
      }
      
      // Build schema to validate parameters
      buildInputSchema(cmd.parameters);
      
      console.log(`  ✓ ${name}: ${cmd.description}`);
    } catch (error) {
      console.error(`  ✗ ${name}: ${error.message}`);
      process.exit(1);
    }
  }
  
  console.log('\nDry-run completed successfully. Configuration is valid.');
  process.exit(0);
}

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
