# Contributing to Kami Design Tokens

Thank you for your interest in contributing to the Kami Design Tokens repository! This document provides guidelines for contributing.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Token Guidelines](#token-guidelines)
5. [Pull Request Process](#pull-request-process)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Collaborate openly and transparently

## Getting Started

### Prerequisites
- Node.js 16+ and NPM 8+
- Git
- Familiarity with design tokens and design systems

### Setup Development Environment
```bash
# Clone the repository
git clone https://github.com/your-org/kami-design-tokens.git
cd kami-design-tokens

# Install dependencies
npm install

# Build tokens
npm run build

# Run tests
npm test
```

## Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/add-new-colors
# or
git checkout -b fix/spacing-token-reference
```

### 2. Make Changes
Edit token files in the `tokens/` directory:
- **Primitives** (`tokens/primitives/`): Add or modify raw values
- **Semantic** (`tokens/semantic/`): Add or modify intent-based tokens

### 3. Validate Changes
```bash
# Validate token structure
npm run validate

# Build artifacts
npm run build

# Run tests
npm test
```

### 4. Test in Consumer Projects
Before submitting, test your changes in a consumer project:
```bash
# In consumer project
npm install ../kami-design-tokens
# Verify UI looks correct
```

## Token Guidelines

### Naming Conventions

**Primitives:**
- Use descriptive, literal names
- Include numeric scales (e.g., `blue-500`, `spacing-md`)
- Format: `{category}-{variant}-{scale}`

```json
{
  "color": {
    "blue": {
      "500": "#2196f3"
    }
  }
}
```

**Semantic:**
- Use intent-based names
- Reference primitive tokens
- Format: `{usage}-{variant}-{state}`

```json
{
  "color": {
    "primary": "{color.blue.500}",
    "primary-hover": "{color.blue.600}"
  }
}
```

### Token Structure (W3C DTCG Format)

Use the `$value` and `$type` format:
```json
{
  "color": {
    "primary": {
      "$value": "{color.blue.500}",
      "$type": "color",
      "$description": "Primary brand color"
    }
  }
}
```

### Best Practices

1. **Don't hardcode values in semantic tokens** - Always reference primitives
2. **Use consistent naming** - Follow existing patterns
3. **Add descriptions** - Use `$description` for complex tokens
4. **Version carefully** - Consider impact on consumers
5. **Test thoroughly** - Verify in multiple contexts

## Pull Request Process

### 1. Commit Messages
Follow conventional commit format:
```
feat: add new color tokens for alert states
fix: correct spacing reference in button component
docs: update migration guide with new examples
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 2. PR Description
Include:
- **Purpose**: What does this PR do?
- **Changes**: List of token additions/modifications
- **Impact**: Which projects are affected?
- **Testing**: How was this tested?
- **Screenshots**: If UI changes are visible

### 3. Review Process
- At least one approval required
- All CI checks must pass
- Validate in at least one consumer project

### 4. Versioning
When merging:
- **Patch** (1.0.x): Bug fixes, value updates
- **Minor** (1.x.0): New tokens (backward compatible)
- **Major** (x.0.0): Breaking changes (removals, structure changes)

## Token Change Examples

### Adding a New Primitive
```json
// tokens/primitives/colors.json
{
  "color": {
    "purple": {
      "500": { "$value": "#9c27b0", "$type": "color" }
    }
  }
}
```

### Adding a Semantic Token
```json
// tokens/semantic/colors.json
{
  "color": {
    "accent": { "$value": "{color.purple.500}", "$type": "color" }
  }
}
```

### Updating a Token Value (Non-Breaking)
```json
// Change the hue slightly
"primary": { "$value": "{color.blue.600}", "$type": "color" }
```

### Removing a Token (Breaking Change)
1. Mark as deprecated in previous minor version
2. Remove in next major version
3. Provide migration path in CHANGELOG

## Questions?

- Open an issue for discussion
- Check existing issues and PRs
- Review the PRD documents in `tasks/`

Thank you for contributing! 🎨
