/**
 * Style Dictionary Configuration
 * Defines how design tokens are transformed into platform-specific formats
 */

const StyleDictionary = require('style-dictionary');

// Custom format for strict TypeScript definitions
StyleDictionary.registerFormat({
  name: 'typescript/strict-definitions',
  formatter: function({ dictionary }) {
    const buildInterface = (obj, indent = 0) => {
      const spaces = '  '.repeat(indent);
      let output = '';
      
      for (const [key, value] of Object.entries(obj)) {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
        
        if (value.value !== undefined) {
          // Leaf node - actual token value
          const valueType = typeof value.value === 'number' ? 'number' : 'string';
          output += `${spaces}${safeKey}: ${valueType};\n`;
        } else {
          // Nested object
          output += `${spaces}${safeKey}: {\n`;
          output += buildInterface(value, indent + 1);
          output += `${spaces}};\n`;
        }
      }
      
      return output;
    };
    
    // Build nested structure from flat token array
    const buildTree = (tokens) => {
      const tree = {};
      
      tokens.forEach(token => {
        const path = token.path;
        let current = tree;
        
        for (let i = 0; i < path.length - 1; i++) {
          const key = path[i];
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }
        
        const lastKey = path[path.length - 1];
        current[lastKey] = { value: token.value };
      });
      
      return tree;
    };
    
    const tree = buildTree(dictionary.allTokens);
    
    return `// Generated Design Tokens - DO NOT EDIT MANUALLY
// Last updated: ${new Date().toISOString()}

export interface DesignTokens {
${buildInterface(tree, 1)}}

declare const tokens: DesignTokens;
export default tokens;
`;
  }
});

// Custom format for ES Module output
StyleDictionary.registerFormat({
  name: 'javascript/es6-strict',
  formatter: function({ dictionary }) {
    const buildObject = (tokens) => {
      const tree = {};
      
      tokens.forEach(token => {
        const path = token.path;
        let current = tree;
        
        for (let i = 0; i < path.length - 1; i++) {
          const key = path[i];
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }
        
        const lastKey = path[path.length - 1];
        current[lastKey] = token.value;
      });
      
      return tree;
    };
    
    const tokens = buildObject(dictionary.allTokens);
    
    return `// Generated Design Tokens - DO NOT EDIT MANUALLY
// Last updated: ${new Date().toISOString()}

const tokens = ${JSON.stringify(tokens, null, 2)};

export default tokens;
`;
  }
});

// Custom format for CommonJS output
StyleDictionary.registerFormat({
  name: 'javascript/commonjs-strict',
  formatter: function({ dictionary }) {
    const buildObject = (tokens) => {
      const tree = {};
      
      tokens.forEach(token => {
        const path = token.path;
        let current = tree;
        
        for (let i = 0; i < path.length - 1; i++) {
          const key = path[i];
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }
        
        const lastKey = path[path.length - 1];
        current[lastKey] = token.value;
      });
      
      return tree;
    };
    
    const tokens = buildObject(dictionary.allTokens);
    
    return `// Generated Design Tokens - DO NOT EDIT MANUALLY
// Last updated: ${new Date().toISOString()}

module.exports = ${JSON.stringify(tokens, null, 2)};
`;
  }
});

module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables',
        options: {
          outputReferences: true
        }
      }]
    },
    scss: {
      transformGroup: 'scss',
      buildPath: 'dist/scss/',
      files: [{
        destination: '_variables.scss',
        format: 'scss/variables',
        options: {
          outputReferences: true
        }
      }]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [
        {
          destination: 'tokens.mjs',
          format: 'javascript/es6-strict'
        },
        {
          destination: 'tokens.js',
          format: 'javascript/commonjs-strict'
        },
        {
          destination: 'tokens.d.ts',
          format: 'typescript/strict-definitions'
        }
      ]
    },
    json: {
      transformGroup: 'js',
      buildPath: 'dist/json/',
      files: [{
        destination: 'tokens.json',
        format: 'json/nested'
      }]
    }
  }
};
