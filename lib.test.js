import { describe, it, expect } from '@jest/globals';
import { buildInputSchema, buildCommand, executeCommand } from './lib.js';

describe('buildInputSchema', () => {
  it('should build schema with string parameter', () => {
    const params = {
      name: {
        type: 'string',
        description: 'User name',
        required: true
      }
    };
    
    const schema = buildInputSchema(params);
    
    expect(schema).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'User name'
        }
      },
      required: ['name']
    });
  });
  
  it('should build schema with boolean parameter', () => {
    const params = {
      verbose: {
        type: 'boolean',
        description: 'Enable verbose output'
      }
    };
    
    const schema = buildInputSchema(params);
    
    expect(schema).toEqual({
      type: 'object',
      properties: {
        verbose: {
          type: 'boolean',
          description: 'Enable verbose output'
        }
      },
      required: []
    });
  });
  
  it('should build schema with number parameter', () => {
    const params = {
      count: {
        type: 'number',
        description: 'Number of items',
        default: 10
      }
    };
    
    const schema = buildInputSchema(params);
    
    expect(schema).toEqual({
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of items',
          default: 10
        }
      },
      required: []
    });
  });
  
  it('should build schema with enum parameter', () => {
    const params = {
      level: {
        type: 'string',
        description: 'Log level',
        enum: ['debug', 'info', 'warn', 'error']
      }
    };
    
    const schema = buildInputSchema(params);
    
    expect(schema).toEqual({
      type: 'object',
      properties: {
        level: {
          type: 'string',
          description: 'Log level',
          enum: ['debug', 'info', 'warn', 'error']
        }
      },
      required: []
    });
  });
  
  it('should handle empty parameters', () => {
    const schema = buildInputSchema({});
    
    expect(schema).toEqual({
      type: 'object',
      properties: {},
      required: []
    });
  });
  
  it('should handle undefined parameters', () => {
    const schema = buildInputSchema(undefined);
    
    expect(schema).toEqual({
      type: 'object',
      properties: {},
      required: []
    });
  });
});

describe('buildCommand', () => {
  it('should build basic command with no args', () => {
    const config = {
      command: 'echo',
      baseArgs: ['hello']
    };
    
    const cmd = buildCommand(config, {});
    
    expect(cmd).toEqual(['echo', 'hello']);
  });
  
  it('should build command with positional arguments', () => {
    const config = {
      command: 'echo',
      baseArgs: [],
      parameters: {
        message: {
          type: 'string',
          description: 'Message to print',
          position: 0
        }
      }
    };
    
    const cmd = buildCommand(config, { message: 'test message' });
    
    expect(cmd).toEqual(['echo', 'test message']);
  });
  
  it('should build command with multiple positional arguments in order', () => {
    const config = {
      command: 'cp',
      baseArgs: [],
      parameters: {
        source: {
          type: 'string',
          description: 'Source file',
          position: 0
        },
        dest: {
          type: 'string',
          description: 'Destination file',
          position: 1
        }
      }
    };
    
    const cmd = buildCommand(config, { source: 'file1.txt', dest: 'file2.txt' });
    
    expect(cmd).toEqual(['cp', 'file1.txt', 'file2.txt']);
  });
  
  it('should build command with named string argument', () => {
    const config = {
      command: 'git',
      baseArgs: ['commit'],
      parameters: {
        message: {
          type: 'string',
          description: 'Commit message',
          argName: '-m'
        }
      }
    };
    
    const cmd = buildCommand(config, { message: 'Initial commit' });
    
    expect(cmd).toEqual(['git', 'commit', '-m', 'Initial commit']);
  });
  
  it('should build command with boolean flag when true', () => {
    const config = {
      command: 'ls',
      baseArgs: [],
      parameters: {
        all: {
          type: 'boolean',
          description: 'Show all files',
          argName: '-a'
        }
      }
    };
    
    const cmd = buildCommand(config, { all: true });
    
    expect(cmd).toEqual(['ls', '-a']);
  });
  
  it('should omit boolean flag when false', () => {
    const config = {
      command: 'ls',
      baseArgs: [],
      parameters: {
        all: {
          type: 'boolean',
          description: 'Show all files',
          argName: '-a'
        }
      }
    };
    
    const cmd = buildCommand(config, { all: false });
    
    expect(cmd).toEqual(['ls']);
  });
  
  it('should build command with mixed positional and named args', () => {
    const config = {
      command: 'find',
      baseArgs: [],
      parameters: {
        path: {
          type: 'string',
          description: 'Search path',
          position: 0
        },
        name: {
          type: 'string',
          description: 'File name pattern',
          argName: '-name'
        },
        type: {
          type: 'string',
          description: 'File type',
          argName: '-type'
        }
      }
    };
    
    const cmd = buildCommand(config, { 
      path: '/tmp',
      name: '*.txt',
      type: 'f'
    });
    
    expect(cmd).toEqual(['find', '/tmp', '-name', '*.txt', '-type', 'f']);
  });
  
  it('should convert number arguments to strings', () => {
    const config = {
      command: 'head',
      baseArgs: [],
      parameters: {
        lines: {
          type: 'number',
          description: 'Number of lines',
          argName: '-n'
        }
      }
    };
    
    const cmd = buildCommand(config, { lines: 10 });
    
    expect(cmd).toEqual(['head', '-n', '10']);
  });
  
  it('should handle boolean with argValue', () => {
    const config = {
      command: 'test-cmd',
      baseArgs: [],
      parameters: {
        flag: {
          type: 'boolean',
          description: 'Test flag',
          argName: '--flag',
          argValue: 'value'
        }
      }
    };
    
    const cmd = buildCommand(config, { flag: true });
    
    expect(cmd).toEqual(['test-cmd', '--flag', 'value']);
  });
});

describe('Command Injection Security Tests', () => {
  describe('String parameter injection attempts', () => {
    it('should safely handle command substitution attempt with $(...)', async () => {
      const config = {
        command: 'echo',
        baseArgs: [],
        parameters: {
          message: {
            type: 'string',
            description: 'Message',
            position: 0
          }
        }
      };
      
      const cmd = buildCommand(config, { message: '$(whoami)' });
      
      // Command should be built as array, not interpreted by shell
      expect(cmd).toEqual(['echo', '$(whoami)']);
      
      // Execute and verify the literal string is echoed, not evaluated
      const result = await executeCommand(cmd);
      expect(result.trim()).toBe('$(whoami)');
    });
    
    it('should safely handle command substitution with backticks', async () => {
      const config = {
        command: 'echo',
        baseArgs: [],
        parameters: {
          message: {
            type: 'string',
            description: 'Message',
            position: 0
          }
        }
      };
      
      const cmd = buildCommand(config, { message: '`whoami`' });
      
      expect(cmd).toEqual(['echo', '`whoami`']);
      
      const result = await executeCommand(cmd);
      expect(result.trim()).toBe('`whoami`');
    });
    
    it('should safely handle pipe attempts', async () => {
      const config = {
        command: 'echo',
        baseArgs: [],
        parameters: {
          message: {
            type: 'string',
            description: 'Message',
            position: 0
          }
        }
      };
      
      const cmd = buildCommand(config, { message: 'test | cat /etc/passwd' });
      
      expect(cmd).toEqual(['echo', 'test | cat /etc/passwd']);
      
      const result = await executeCommand(cmd);
      expect(result.trim()).toBe('test | cat /etc/passwd');
    });
    
    it('should safely handle semicolon command chaining', async () => {
      const config = {
        command: 'echo',
        baseArgs: [],
        parameters: {
          message: {
            type: 'string',
            description: 'Message',
            position: 0
          }
        }
      };
      
      const cmd = buildCommand(config, { message: 'hello; rm -rf /' });
      
      expect(cmd).toEqual(['echo', 'hello; rm -rf /']);
      
      const result = await executeCommand(cmd);
      expect(result.trim()).toBe('hello; rm -rf /');
    });
    
    it('should safely handle && command chaining', async () => {
      const config = {
        command: 'echo',
        baseArgs: [],
        parameters: {
          message: {
            type: 'string',
            description: 'Message',
            position: 0
          }
        }
      };
      
      const cmd = buildCommand(config, { message: 'test && cat /etc/passwd' });
      
      expect(cmd).toEqual(['echo', 'test && cat /etc/passwd']);
      
      const result = await executeCommand(cmd);
      expect(result.trim()).toBe('test && cat /etc/passwd');
    });
    
    it('should safely handle || command chaining', async () => {
      const config = {
        command: 'echo',
        baseArgs: [],
        parameters: {
          message: {
            type: 'string',
            description: 'Message',
            position: 0
          }
        }
      };
      
      const cmd = buildCommand(config, { message: 'test || whoami' });
      
      expect(cmd).toEqual(['echo', 'test || whoami']);
      
      const result = await executeCommand(cmd);
      expect(result.trim()).toBe('test || whoami');
    });
    
    it('should safely handle redirection attempts', async () => {
      const config = {
        command: 'echo',
        baseArgs: [],
        parameters: {
          message: {
            type: 'string',
            description: 'Message',
            position: 0
          }
        }
      };
      
      const cmd = buildCommand(config, { message: 'test > /tmp/hacked' });
      
      expect(cmd).toEqual(['echo', 'test > /tmp/hacked']);
      
      const result = await executeCommand(cmd);
      expect(result.trim()).toBe('test > /tmp/hacked');
    });
    
    it('should safely handle newline injection', async () => {
      const config = {
        command: 'echo',
        baseArgs: [],
        parameters: {
          message: {
            type: 'string',
            description: 'Message',
            position: 0
          }
        }
      };
      
      const cmd = buildCommand(config, { message: 'test\nwhoami' });
      
      expect(cmd).toEqual(['echo', 'test\nwhoami']);
      
      const result = await executeCommand(cmd);
      expect(result).toContain('test\nwhoami');
    });
  });
  
  describe('Named argument injection attempts', () => {
    it('should safely handle injection in named string arguments', async () => {
      const config = {
        command: 'git',
        baseArgs: ['commit'],
        parameters: {
          message: {
            type: 'string',
            description: 'Commit message',
            argName: '-m'
          }
        }
      };
      
      const cmd = buildCommand(config, { message: '$(whoami) hack' });
      
      // Should be separate array elements, not shell-interpreted
      expect(cmd).toEqual(['git', 'commit', '-m', '$(whoami) hack']);
    });
    
    it('should safely handle injection attempts in number arguments', async () => {
      const config = {
        command: 'head',
        baseArgs: [],
        parameters: {
          lines: {
            type: 'number',
            description: 'Number of lines',
            argName: '-n'
          }
        }
      };
      
      // Try to inject through number parameter
      const cmd = buildCommand(config, { lines: '10; whoami' });
      
      expect(cmd).toEqual(['head', '-n', '10; whoami']);
    });
  });
  
  describe('Boolean parameter injection attempts', () => {
    it('should not allow injection through boolean parameters', () => {
      const config = {
        command: 'ls',
        baseArgs: [],
        parameters: {
          all: {
            type: 'boolean',
            description: 'Show all',
            argName: '-a'
          }
        }
      };
      
      // Boolean parameters only add the flag when value is exactly true
      // String values won't trigger the flag even if truthy in JavaScript
      const cmd = buildCommand(config, { all: '$(whoami)' });
      
      // The string '$(whoami)' is truthy but not === true, so flag should be omitted
      expect(cmd).toEqual(['ls']);
    });
  });
  
  describe('Multiple parameter injection attempts', () => {
    it('should safely handle injection across multiple parameters', async () => {
      const config = {
        command: 'find',
        baseArgs: [],
        parameters: {
          path: {
            type: 'string',
            description: 'Search path',
            position: 0
          },
          name: {
            type: 'string',
            description: 'File name',
            argName: '-name'
          }
        }
      };
      
      const cmd = buildCommand(config, { 
        path: '.; whoami; echo',
        name: '*.txt && cat /etc/passwd'
      });
      
      // Both should remain as literal strings
      expect(cmd).toEqual(['find', '.; whoami; echo', '-name', '*.txt && cat /etc/passwd']);
    });
  });
});

describe('Error handling', () => {
  it('should reject when command fails', async () => {
    const cmd = ['false']; // 'false' command always returns exit code 1
    
    await expect(executeCommand(cmd)).rejects.toThrow('Command failed with code 1');
  });
  
  it('should reject when command does not exist', async () => {
    const cmd = ['this-command-definitely-does-not-exist-12345'];
    
    await expect(executeCommand(cmd)).rejects.toThrow('Failed to execute command');
  });
  
  it('should capture stderr on failure', async () => {
    // Use a command that writes to stderr
    const cmd = ['ls', '/this/path/does/not/exist/12345'];
    
    await expect(executeCommand(cmd)).rejects.toThrow();
  });
});

describe('Normal operation tests', () => {
  it('should execute simple echo command', async () => {
    const cmd = ['echo', 'hello world'];
    const result = await executeCommand(cmd);
    
    expect(result.trim()).toBe('hello world');
  });
  
  it('should execute command with multiple arguments', async () => {
    const cmd = ['echo', 'arg1', 'arg2', 'arg3'];
    const result = await executeCommand(cmd);
    
    expect(result.trim()).toBe('arg1 arg2 arg3');
  });
  
  it('should handle arguments with spaces', async () => {
    const cmd = ['echo', 'hello world', 'foo bar'];
    const result = await executeCommand(cmd);
    
    expect(result.trim()).toBe('hello world foo bar');
  });
  
  it('should handle arguments with special characters (non-shell)', async () => {
    const cmd = ['echo', '@#$%^&*()'];
    const result = await executeCommand(cmd);
    
    expect(result.trim()).toBe('@#$%^&*()');
  });
});
