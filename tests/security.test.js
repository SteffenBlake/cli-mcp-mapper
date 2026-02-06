import { describe, it, expect } from '@jest/globals';
import { buildCommand, executeCommand } from '../lib.js';

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
