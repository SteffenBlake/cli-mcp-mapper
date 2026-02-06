import { describe, it, expect } from '@jest/globals';
import { executeCommand } from '../lib.js';

describe('Command execution tests', () => {
  describe('Error handling', () => {
    it('should resolve with exit code info when command fails', async () => {
      const cmd = ['false']; // 'false' command always returns exit code 1
      
      const result = await executeCommand(cmd);
      expect(result).toContain('Command exited with code');
      expect(result).toContain('1');
    });
    
    it('should reject when command does not exist', async () => {
      const cmd = ['this-command-definitely-does-not-exist-12345'];
      
      await expect(executeCommand(cmd)).rejects.toThrow('Failed to execute command');
    });
    
    it('should resolve with stderr content on failure', async () => {
      // Use a command that writes to stderr
      const cmd = ['ls', '/this/path/does/not/exist/12345'];
      
      const result = await executeCommand(cmd);
      expect(result).toContain('Command exited with code');
      expect(result.toLowerCase()).toMatch(/no such file or directory|cannot access/);
    });
    
    it('should resolve with full output including stderr when command fails with non-zero exit code', async () => {
      // Use a command that will fail and output to stderr
      // This command tries to list a non-existent directory
      const cmd = ['ls', '/this/path/does/not/exist/for/testing/12345'];
      
      // The promise should resolve (not reject) with the full output
      const result = await executeCommand(cmd);
      
      // Result should contain exit code information
      expect(result).toContain('Command exited with code');
      
      // Result should contain stderr output with error message
      expect(result.toLowerCase()).toMatch(/no such file or directory|cannot access/);
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
});
