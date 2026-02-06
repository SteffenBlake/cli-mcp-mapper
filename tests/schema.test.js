import { describe, it, expect } from '@jest/globals';
import { buildInputSchema } from '../lib.js';

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
