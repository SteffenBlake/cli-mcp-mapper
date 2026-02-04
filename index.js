#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

// Load config from env variable or default path
const defaultConfig = join(homedir(), ".config", "cli-mcp-mapper", "commands.json");
const configPath = process.env.CLI_MCP_MAPPER_CONFIG || defaultConfig;
const config = JSON.parse(await readFile(configPath, "utf-8"));

const server = new Server(
  {
    name: "cli-whitelist-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
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

function buildInputSchema(parameters) {
  const properties = {};
  const required = [];
  
  for (const [name, param] of Object.entries(parameters || {})) {
    properties[name] = {
      type: param.type,
      description: param.description,
    };
    
    if (param.enum) properties[name].enum = param.enum;
    if (param.default) properties[name].default = param.default;
    if (param.required) required.push(name);
  }
  
  return {
    type: "object",
    properties,
    required,
  };
}

function buildCommand(commandConfig, args) {
  const cmd = [commandConfig.command, ...(commandConfig.baseArgs || [])];
  
  // Add positional args first
  const positional = Object.entries(commandConfig.parameters || {})
    .filter(([_, param]) => param.position !== undefined)
    .sort(([_, a], [__, b]) => a.position - b.position);
  
  for (const [name, param] of positional) {
    if (args[name] !== undefined) {
      cmd.push(String(args[name]));
    }
  }
  
  // Add named args
  for (const [name, param] of Object.entries(commandConfig.parameters || {})) {
    if (param.position !== undefined) continue; // Skip positional
    if (args[name] === undefined) continue; // Skip if not provided
    
    if (param.type === "boolean") {
      if (args[name] === true) {
        cmd.push(param.argName);
        if (param.argValue) cmd.push(param.argValue);
      }
    } else {
      cmd.push(param.argName);
      cmd.push(String(args[name]));
    }
  }
  
  return cmd;
}

function executeCommand(cmdArray) {
  return new Promise((resolve, reject) => {
    const [command, ...args] = cmdArray;
    const proc = spawn(command, args, { shell: true });
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => (stdout += data));
    proc.stderr.on("data", (data) => (stderr += data));
    
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}\n${stderr}`));
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
