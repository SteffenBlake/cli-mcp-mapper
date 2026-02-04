import { spawn } from "child_process";

/**
 * Build JSON schema for MCP tool input parameters
 * @param {Object} parameters - Parameter definitions from config
 * @returns {Object} JSON schema object
 */
export function buildInputSchema(parameters) {
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

/**
 * Build command array from config and arguments
 * @param {Object} commandConfig - Command configuration
 * @param {Object} args - Arguments passed to the tool
 * @returns {Array<string>} Command array [command, arg1, arg2, ...]
 */
export function buildCommand(commandConfig, args) {
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

/**
 * Execute command safely without shell interpretation
 * @param {Array<string>} cmdArray - Command array [command, arg1, arg2, ...]
 * @returns {Promise<string>} Command output
 */
export function executeCommand(cmdArray) {
  return new Promise((resolve, reject) => {
    const [command, ...args] = cmdArray;
    // SECURITY FIX: Remove shell: true to prevent command injection
    // spawn will now execute the command directly without shell interpretation
    const proc = spawn(command, args);
    
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
    
    proc.on("error", (err) => {
      reject(new Error(`Failed to execute command: ${err.message}`));
    });
  });
}
