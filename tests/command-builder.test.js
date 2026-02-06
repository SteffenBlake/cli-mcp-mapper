import { describe, it, expect } from '@jest/globals';
import { buildCommand } from '../lib.js';

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
