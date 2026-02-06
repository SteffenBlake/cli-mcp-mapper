import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { spawn } from 'child_process';
import { writeFile, unlink, mkdir, rm } from 'fs/promises';
import { join } from 'path';

/**
 * Helper function to run index.js with specified config
 */
function runDryRun(configPath) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, CLI_MCP_MAPPER_CONFIG: configPath };
    const proc = spawn('node', ['index.js', '--dry-run'], { 
      cwd: process.cwd(),
      env 
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });
    
    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

describe('Dry-run functionality', () => {
  const testDir = '/tmp/cli-mcp-mapper-test';
  
  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });
  
  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });
  
  describe('Valid configuration', () => {
    it('should successfully validate a correct configuration file', async () => {
      const configPath = join(testDir, 'valid-config.json');
      const config = {
        commands: {
          echo_test: {
            description: 'Test echo command',
            command: 'echo',
            baseArgs: [],
            parameters: {
              message: {
                type: 'string',
                description: 'Message to echo',
                position: 0
              }
            }
          }
        }
      };
      
      await writeFile(configPath, JSON.stringify(config, null, 2));
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Configuration loaded successfully');
      expect(result.stdout).toContain('Found 1 command(s)');
      expect(result.stdout).toContain('✓ echo_test: Test echo command');
      expect(result.stdout).toContain('Dry-run completed successfully');
    });
    
    it('should validate configuration with multiple commands', async () => {
      const configPath = join(testDir, 'multi-config.json');
      const config = {
        commands: {
          echo_test: {
            description: 'Echo command',
            command: 'echo',
            baseArgs: [],
            parameters: {}
          },
          ls_test: {
            description: 'List files',
            command: 'ls',
            baseArgs: ['-la'],
            parameters: {
              path: {
                type: 'string',
                description: 'Path to list',
                position: 0
              }
            }
          },
          git_status: {
            description: 'Git status',
            command: 'git',
            baseArgs: ['status'],
            parameters: {
              short: {
                type: 'boolean',
                description: 'Short format',
                argName: '-s'
              }
            }
          }
        }
      };
      
      await writeFile(configPath, JSON.stringify(config, null, 2));
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Found 3 command(s)');
      expect(result.stdout).toContain('✓ echo_test');
      expect(result.stdout).toContain('✓ ls_test');
      expect(result.stdout).toContain('✓ git_status');
    });
    
    it('should validate configuration with complex parameters', async () => {
      const configPath = join(testDir, 'complex-config.json');
      const config = {
        commands: {
          find_files: {
            description: 'Find files',
            command: 'find',
            baseArgs: [],
            parameters: {
              path: {
                type: 'string',
                description: 'Search path',
                position: 0,
                default: '.'
              },
              name: {
                type: 'string',
                description: 'File name',
                argName: '-name'
              },
              type: {
                type: 'string',
                description: 'File type',
                enum: ['f', 'd', 'l'],
                argName: '-type'
              },
              max_depth: {
                type: 'number',
                description: 'Max depth',
                argName: '-maxdepth'
              }
            }
          }
        }
      };
      
      await writeFile(configPath, JSON.stringify(config, null, 2));
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✓ find_files');
    });
  });
  
  describe('Missing configuration file', () => {
    it('should exit with error when configuration file does not exist', async () => {
      const configPath = join(testDir, 'nonexistent.json');
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error: Configuration file not found');
      expect(result.stderr).toContain(configPath);
    });
  });
  
  describe('Invalid JSON syntax', () => {
    it('should exit with error when JSON syntax is invalid', async () => {
      const configPath = join(testDir, 'invalid-json.json');
      await writeFile(configPath, '{ "invalid": json }');
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error: Invalid JSON syntax');
      expect(result.stderr).toContain(configPath);
    });
    
    it('should handle malformed JSON with missing brackets', async () => {
      const configPath = join(testDir, 'malformed.json');
      await writeFile(configPath, '{ "commands": { }');
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error: Invalid JSON syntax');
    });
  });
  
  describe('Invalid configuration structure', () => {
    it('should exit with error when "commands" field is missing', async () => {
      const configPath = join(testDir, 'no-commands.json');
      const config = {
        notCommands: {}
      };
      
      await writeFile(configPath, JSON.stringify(config));
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error: Invalid configuration structure');
      expect(result.stderr).toContain('Expected "commands" object');
    });
    
    it('should exit with error when "commands" is not an object', async () => {
      const configPath = join(testDir, 'commands-not-object.json');
      const config = {
        commands: 'not an object'
      };
      
      await writeFile(configPath, JSON.stringify(config));
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Error: Invalid configuration structure');
    });
  });
  
  describe('Invalid command definitions', () => {
    it('should exit with error when command definition is missing "command" field', async () => {
      const configPath = join(testDir, 'missing-command.json');
      const config = {
        commands: {
          invalid_cmd: {
            description: 'Missing command field',
            baseArgs: []
          }
        }
      };
      
      await writeFile(configPath, JSON.stringify(config));
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('✗ invalid_cmd');
      expect(result.stderr).toContain('missing or invalid \'command\' field');
    });
    
    it('should exit with error when command definition is missing "description" field', async () => {
      const configPath = join(testDir, 'missing-description.json');
      const config = {
        commands: {
          invalid_cmd: {
            command: 'echo',
            baseArgs: []
          }
        }
      };
      
      await writeFile(configPath, JSON.stringify(config));
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('✗ invalid_cmd');
      expect(result.stderr).toContain('missing or invalid \'description\' field');
    });
    
    it('should exit with error when command field is not a string', async () => {
      const configPath = join(testDir, 'command-not-string.json');
      const config = {
        commands: {
          invalid_cmd: {
            description: 'Test',
            command: 123,
            baseArgs: []
          }
        }
      };
      
      await writeFile(configPath, JSON.stringify(config));
      
      const result = await runDryRun(configPath);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('✗ invalid_cmd');
      expect(result.stderr).toContain('missing or invalid \'command\' field');
    });
  });
  
  describe('Exit behavior', () => {
    it('should not start the MCP server in dry-run mode', async () => {
      const configPath = join(testDir, 'exit-test.json');
      const config = {
        commands: {
          test_cmd: {
            description: 'Test',
            command: 'echo',
            baseArgs: []
          }
        }
      };
      
      await writeFile(configPath, JSON.stringify(config));
      
      const startTime = Date.now();
      const result = await runDryRun(configPath);
      const duration = Date.now() - startTime;
      
      expect(result.code).toBe(0);
      // Should exit quickly, not hang waiting for MCP connections
      expect(duration).toBeLessThan(2000);
    });
  });
});
