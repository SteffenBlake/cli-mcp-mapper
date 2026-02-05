# CLI MCP Mapper

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/SteffenBlake/cli-mcp-mapper/refs/heads/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/cli-mcp-mapper.svg)](https://www.npmjs.com/package/cli-mcp-mapper)
[![CI](https://github.com/SteffenBlake/cli-mcp-mapper/actions/workflows/ci.yml/badge.svg)](https://github.com/SteffenBlake/cli-mcp-mapper/actions/workflows/ci.yml)

**Transform any CLI command into a Model Context Protocol (MCP) tool with simple JSON configuration.**

CLI MCP Mapper is a powerful MCP server that dynamically exposes command-line tools as MCP tools. This allows AI assistants and other MCP clients to safely execute system commands, scripts, and tools through a declarative JSON configuration—no code required.

## Table of Contents

- [Why CLI MCP Mapper?](#why-cli-mcp-mapper)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Environment Variable](#environment-variable)
  - [Default Location](#default-location)
  - [Configuration File Format](#configuration-file-format)
- [JSON Specification](#json-specification)
  - [Schema Reference](#schema-reference)
  - [Command Definition](#command-definition)
  - [Parameter Definition](#parameter-definition)
  - [Parameter Types](#parameter-types)
- [Usage Examples](#usage-examples)
  - [Basic Commands Example](#basic-commands-example)
  - [Git Operations Example](#git-operations-example)
  - [Complex Parameters Example](#complex-parameters-example)
- [MCP Client Configuration](#mcp-client-configuration)
  - [Claude Desktop](#claude-desktop)
  - [Other MCP Clients](#other-mcp-clients)
- [Example Configuration Files](#example-configuration-files)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)

## Why CLI MCP Mapper?

The Model Context Protocol (MCP) enables AI assistants to interact with external tools and systems. However, creating MCP servers for every command-line tool can be time-consuming and requires coding expertise. CLI MCP Mapper solves this by:

- **No Coding Required**: Define tools using simple JSON configuration
- **Universal Compatibility**: Works with any CLI tool (git, npm, docker, custom scripts, etc.)
- **Type Safety**: JSON schema validation ensures configuration correctness
- **Flexible Parameter Handling**: Supports positional arguments, named flags, booleans, enums, and more
- **Reusable Configurations**: Share and version control your tool definitions
- **Rapid Prototyping**: Test MCP tool ideas without writing server code

### Use Cases

- **DevOps Automation**: Expose docker, kubectl, terraform commands to AI assistants
- **Development Workflows**: Make build tools, linters, and test runners available as MCP tools
- **System Administration**: Safely expose system commands with controlled parameters
- **Custom Scripts**: Wrap your own scripts and make them AI-accessible
- **Git Operations**: Provide version control capabilities to AI assistants
- **File Management**: Enable AI to perform file operations with safety guardrails

## Features

✨ **Dynamic Tool Generation**: Automatically creates MCP tools from JSON definitions  
🎯 **Flexible Parameters**: Supports positional args, named flags, booleans, enums, and required/optional parameters  
📝 **Type System**: String, boolean, and number parameter types with validation  
🔒 **Schema Validation**: JSON schema for validating your command configurations  
🚀 **Zero Dependencies**: Minimal runtime footprint (only @modelcontextprotocol/sdk)  
🔧 **Easy Configuration**: Environment variable or default path configuration  
📚 **Rich Examples**: Comprehensive example configurations included  

## Installation

Install CLI MCP Mapper globally from NPM:

```bash
npm i -g cli-mcp-mapper
```

Verify the installation:

```bash
which cli-mcp-mapper
```

## Configuration

CLI MCP Mapper requires a JSON configuration file that defines which commands to expose as MCP tools.

### Environment Variable

You can specify a custom configuration path using the `CLI_MCP_MAPPER_CONFIG` environment variable:

```bash
export CLI_MCP_MAPPER_CONFIG=/path/to/your/commands.json
```

For persistent configuration, add this to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
# Add to ~/.bashrc or ~/.zshrc
export CLI_MCP_MAPPER_CONFIG="$HOME/my-mcp-configs/commands.json"
```

### Default Location

If no environment variable is set, CLI MCP Mapper looks for the configuration at:

```
~/.config/cli-mcp-mapper/commands.json
```

On different systems:
- **Linux/macOS**: `~/.config/cli-mcp-mapper/commands.json`
- **Windows**: `%USERPROFILE%\.config\cli-mcp-mapper\commands.json`

To create the default configuration directory:

```bash
mkdir -p ~/.config/cli-mcp-mapper
```

Then copy one of the example configurations or create your own:

```bash
# Copy a basic example
cp examples/basic-commands.json ~/.config/cli-mcp-mapper/commands.json

# Or create your own
cat > ~/.config/cli-mcp-mapper/commands.json << 'EOF'
{
  "commands": {
    "hello": {
      "description": "Say hello",
      "command": "echo",
      "baseArgs": [],
      "parameters": {
        "name": {
          "type": "string",
          "description": "Name to greet",
          "required": true,
          "position": 0
        }
      }
    }
  }
}
EOF
```

### Configuration File Format

The configuration file is a JSON object with a single `commands` property containing a map of command definitions:

```json
{
  "commands": {
    "command_name": {
      "description": "What this command does",
      "command": "base-command",
      "baseArgs": ["--static", "args"],
      "parameters": {
        "param_name": {
          "type": "string",
          "description": "Parameter description",
          "required": false,
          "position": 0
        }
      }
    }
  }
}
```

## JSON Specification

### Schema Reference

A JSON Schema is provided for validating your configuration files. Reference it in your JSON:

```json
{
  "$schema": "./commands.schema.json",
  "commands": { ... }
}
```

This enables autocompletion and validation in editors that support JSON Schema (VS Code, IntelliJ, etc.).

### Command Definition

Each command in the `commands` object has the following structure:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `description` | string | ✅ Yes | Human-readable description shown to MCP clients |
| `command` | string | ✅ Yes | Base command to execute (e.g., `"git"`, `"npm"`, `"docker"`) |
| `baseArgs` | string[] | No | Static arguments always passed to the command (e.g., `["build", "--quiet"]`) |
| `parameters` | object | No | Map of parameter names to parameter definitions |

**Example:**

```json
{
  "git_status": {
    "description": "Show the working tree status",
    "command": "git",
    "baseArgs": ["status"],
    "parameters": {
      "short": {
        "type": "boolean",
        "description": "Give output in short format",
        "argName": "-s"
      }
    }
  }
}
```

### Parameter Definition

Each parameter in the `parameters` object defines how the parameter is passed to the command:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | string | ✅ Yes | Parameter type: `"string"`, `"boolean"`, or `"number"` |
| `description` | string | ✅ Yes | Human-readable parameter description |
| `required` | boolean | No | Whether the parameter must be provided (default: `false`) |
| `position` | number | No | For positional arguments: 0-based position in command line |
| `argName` | string | No | For named arguments: the flag to use (e.g., `"--output"`, `"-v"`) |
| `argValue` | string | No | Static value to pass after `argName` (rarely used) |
| `enum` | string[] | No | List of allowed values |
| `default` | any | No | Default value if not provided |

**Parameter Processing Rules:**

1. **Positional Parameters** (`position` is set):
   - Added to command line in position order (0, 1, 2, ...)
   - No `argName` needed
   - If parameter is not provided and not required, it's omitted

2. **Named Parameters** (`argName` is set):
   - For `boolean` type: If `true`, adds `argName` to command
   - For `string` or `number` type: Adds `argName` followed by the value
   - If parameter is not provided, it's omitted

3. **Required Parameters** (`required: true`):
   - MCP clients must provide these parameters
   - Validation happens before command execution

### Parameter Types

#### String Parameters

Used for text values, file paths, URLs, etc.

```json
{
  "file_path": {
    "type": "string",
    "description": "Path to the file",
    "required": true,
    "position": 0
  }
}
```

With enum for limited choices:

```json
{
  "log_level": {
    "type": "string",
    "description": "Logging level",
    "enum": ["debug", "info", "warn", "error"],
    "argName": "--log-level"
  }
}
```

#### Boolean Parameters

Used for flags/switches. When `true`, the `argName` is added to the command.

```json
{
  "verbose": {
    "type": "boolean",
    "description": "Enable verbose output",
    "argName": "-v"
  }
}
```

Multiple boolean flags can be combined:

```json
{
  "force": {
    "type": "boolean",
    "description": "Force operation",
    "argName": "-f"
  },
  "recursive": {
    "type": "boolean",
    "description": "Recursive operation",
    "argName": "-r"
  }
}
```

When both are true, command becomes: `command -f -r`

#### Number Parameters

Used for numeric values (counts, limits, sizes, etc.).

```json
{
  "max_count": {
    "type": "number",
    "description": "Maximum number of results",
    "argName": "-n"
  }
}
```

## Usage Examples

### Basic Commands Example

Simple file system operations:

```json
{
  "commands": {
    "ls": {
      "description": "List directory contents",
      "command": "ls",
      "baseArgs": ["-lah"],
      "parameters": {
        "path": {
          "type": "string",
          "description": "Directory path",
          "position": 0
        }
      }
    },
    "mkdir": {
      "description": "Create a directory",
      "command": "mkdir",
      "baseArgs": [],
      "parameters": {
        "path": {
          "type": "string",
          "description": "Directory to create",
          "required": true,
          "position": 0
        },
        "parents": {
          "type": "boolean",
          "description": "Create parent directories",
          "argName": "-p"
        }
      }
    }
  }
}
```

**Usage in MCP client:**
- `ls()` → executes `ls -lah`
- `ls({ path: "/tmp" })` → executes `ls -lah /tmp`
- `mkdir({ path: "/tmp/test", parents: true })` → executes `mkdir -p /tmp/test`

### Git Operations Example

Version control commands:

```json
{
  "commands": {
    "git_commit": {
      "description": "Commit changes with a message",
      "command": "git",
      "baseArgs": ["commit"],
      "parameters": {
        "message": {
          "type": "string",
          "description": "Commit message",
          "required": true,
          "argName": "-m"
        },
        "all": {
          "type": "boolean",
          "description": "Stage all modified files",
          "argName": "-a"
        }
      }
    },
    "git_status": {
      "description": "Show repository status",
      "command": "git",
      "baseArgs": ["status"],
      "parameters": {}
    }
  }
}
```

**Usage in MCP client:**
- `git_status()` → executes `git status`
- `git_commit({ message: "Fix bug", all: true })` → executes `git commit -m "Fix bug" -a`

### Complex Parameters Example

Advanced parameter handling with mixed positional and named arguments:

```json
{
  "commands": {
    "find_files": {
      "description": "Search for files",
      "command": "find",
      "baseArgs": [],
      "parameters": {
        "path": {
          "type": "string",
          "description": "Starting directory",
          "position": 0,
          "default": "."
        },
        "name": {
          "type": "string",
          "description": "File name pattern",
          "argName": "-name"
        },
        "type": {
          "type": "string",
          "description": "File type",
          "enum": ["f", "d", "l"],
          "argName": "-type"
        },
        "max_depth": {
          "type": "number",
          "description": "Maximum search depth",
          "argName": "-maxdepth"
        }
      }
    }
  }
}
```

**Usage in MCP client:**
- `find_files({ name: "*.js", type: "f" })` → executes `find . -name "*.js" -type f`
- `find_files({ path: "/src", name: "*.ts", max_depth: 3 })` → executes `find /src -name "*.ts" -maxdepth 3`

## MCP Client Configuration

### Claude Desktop

To use CLI MCP Mapper with Claude Desktop, add it to your MCP configuration file.

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the following to the `mcpServers` section:

```json
{
  "mcpServers": {
    "cli-mcp-mapper": {
      "type": "local",
      "command": "cli-mcp-mapper",
      "args": [],
      "tools": ["*"]
    }
  }
}
```

**With custom configuration path:**

```json
{
  "mcpServers": {
    "cli-mcp-mapper": {
      "type": "local",
      "command": "cli-mcp-mapper",
      "args": [],
      "env": {
        "CLI_MCP_MAPPER_CONFIG": "/path/to/your/commands.json"
      },
      "tools": ["*"]
    }
  }
}
```

After updating the configuration:

1. Save the file
2. Restart Claude Desktop
3. Your configured commands will appear as available tools

### Other MCP Clients

For other MCP clients, refer to their documentation for adding MCP servers. The general pattern is:

```json
{
  "command": "cli-mcp-mapper",
  "args": [],
  "env": {
    "CLI_MCP_MAPPER_CONFIG": "/path/to/commands.json"
  }
}
```

## Example Configuration Files

The repository includes several example configuration files in the `examples/` directory:

### `basic-commands.json`
Common Unix/Linux commands: `ls`, `cat`, `mkdir`, `rm`, `pwd`, `echo`, `find`, `grep`

Use this to give AI assistants basic file system capabilities.

### `git-commands.json`
Git operations: `git status`, `git commit`, `git push`, `git pull`, `git log`, etc.

Enable version control operations for AI-assisted development.

### `file-operations.json`
File manipulation: `cp`, `mv`, `touch`, `chmod`, `chown`, `tar`, `wc`

Advanced file and archive operations.

### Using Examples

To use an example configuration:

```bash
# Copy to default location
cp examples/basic-commands.json ~/.config/cli-mcp-mapper/commands.json

# Or use with environment variable
export CLI_MCP_MAPPER_CONFIG="$PWD/examples/git-commands.json"
```

You can also merge multiple examples into a single configuration:

```bash
# Combine multiple configurations
jq -s '{"commands": (map(.commands) | add)}' \
  examples/basic-commands.json \
  examples/git-commands.json \
  > ~/.config/cli-mcp-mapper/commands.json
```

## Troubleshooting

### Configuration File Not Found

**Error:** `Cannot find module '/path/to/commands.json'`

**Solutions:**
1. Verify the file exists: `ls -la ~/.config/cli-mcp-mapper/commands.json`
2. Create the directory: `mkdir -p ~/.config/cli-mcp-mapper`
3. Check environment variable: `echo $CLI_MCP_MAPPER_CONFIG`
4. Ensure JSON file is valid: `cat ~/.config/cli-mcp-mapper/commands.json | jq`

### Invalid JSON Syntax

**Error:** `Unexpected token` or `JSON Parse error`

**Solutions:**
1. Validate JSON syntax: `cat commands.json | jq`
2. Use an editor with JSON validation (VS Code, etc.)
3. Check for missing commas, brackets, or quotes
4. Validate against schema: Use the provided `commands.schema.json`

### Command Not Executing

**Error:** Command returns error or unexpected output

**Solutions:**
1. Test command manually: Run the generated command in your terminal
2. Check `baseArgs`: Ensure they're valid for your command
3. Verify `argName` matches command's expected flags
4. Check positional argument order
5. Review command's help: `command --help`

### Permission Denied

**Error:** `EACCES` or `Permission denied`

**Solutions:**
1. Ensure command is in PATH: `which command-name`
2. Check file permissions: `ls -la $(which command-name)`
3. Use absolute path in `command` field
4. For scripts, ensure execute permission: `chmod +x script.sh`

### Tool Not Appearing in MCP Client

**Solutions:**
1. Restart MCP client (e.g., Claude Desktop)
2. Check MCP client logs for errors
3. Verify `commands.json` is valid
4. Ensure CLI MCP Mapper is installed: `which cli-mcp-mapper`
5. Check client configuration file syntax

### Commands Execute but Return No Output

**Issue:** Command executes successfully but returns empty string

**Explanation:** Some commands output to stderr instead of stdout. CLI MCP Mapper captures both but only returns stdout by default on success.

**Solutions:**
1. Check if command writes to stderr
2. Use command flags to redirect output to stdout
3. This is often expected behavior for commands that only show errors

## Security Considerations

⚠️ **Important Security Notes:**

1. **Command Injection Protection**: CLI MCP Mapper uses Node.js `spawn` without shell interpretation to prevent command injection attacks. While we have comprehensive tests to validate this protection, **you should always run agents with shell access in containerized or sandboxed environments** (e.g., Docker, VM, or other isolation mechanisms) to minimize potential security risks. This provides an additional layer of defense in case of unforeseen vulnerabilities.

2. **Containerization Best Practice**: When deploying CLI MCP Mapper in production or exposing it to AI agents, strongly consider running it within:
   - Docker containers with limited privileges
   - Virtual machines with restricted network access  
   - Sandboxed environments with filesystem restrictions
   - Isolated user accounts with minimal permissions

3. **Access Control**: MCP clients that connect to CLI MCP Mapper will have the same permissions as the user running it. Run the server with the least privileged user account necessary.

4. **Validate Parameters**: Use `enum` to restrict parameter values when possible to prevent unexpected inputs.

5. **Avoid Dangerous Commands**: Be cautious about exposing commands like:
   - `rm -rf` without proper constraints
   - `chmod` with unrestricted modes
   - Commands that can execute arbitrary code
   - Network commands that could expose sensitive data
   - System administration commands

6. **Read-Only Operations**: Consider starting with read-only commands (ls, cat, git status) before exposing write operations.

7. **Configuration Security**:
   - Don't commit sensitive configurations to version control
   - Use environment-specific configuration files
   - Review configurations before deploying
   - Regularly audit which commands are exposed

8. **Least Privilege**: Only grant the minimum necessary commands for your use case.

**Best Practices:**

```json
{
  "commands": {
    "safe_delete": {
      "description": "Delete files (safe - no recursive)",
      "command": "rm",
      "baseArgs": ["-i"],  // Interactive mode for safety
      "parameters": {
        "file": {
          "type": "string",
          "description": "Single file to delete",
          "required": true,
          "position": 0
        }
      }
    }
  }
}
```

## Contributing

Contributions are welcome! Here's how you can help:

1. **Report Issues**: Found a bug? Open an issue on GitHub
2. **Submit PRs**: Fix bugs, add features, improve documentation
3. **Share Examples**: Create and share useful command configurations
4. **Improve Documentation**: Help make the docs clearer and more comprehensive

### Development Setup

```bash
# Clone the repository
git clone https://github.com/SteffenBlake/cli-mcp-mapper.git
cd cli-mcp-mapper

# Install dependencies
npm install

# Test locally
node index.js
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the MCP community**

For issues, questions, or contributions, visit: https://github.com/SteffenBlake/cli-mcp-mapper
