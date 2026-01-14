# Token Validation System

**PRD 0052: Automated validation for quality and accessibility**

This document explains the token validation system, which enforces naming conventions, type safety, alias integrity, and accessibility standards.

---

## Overview

The validation system operates at three levels:

1. **Database Level**: PostgreSQL triggers validate tokens before save
2. **API Level**: REST endpoints for real-time validation
3. **CLI Level**: Validation script for CI/CD pipelines

---

## Validation Rules

### 1. Naming Conventions

**Rule**: Token paths must use kebab-case with at least 2 segments

**Valid Examples**:
```
color.primary.500
spacing.base
typography.heading-1
```

**Invalid Examples**:
```
colorPrimary      ❌ Not kebab-case
color             ❌ Only 1 segment
color.Primary     ❌ Capital letter
color.primary_500 ❌ Underscore instead of hyphen
```

### 2. Type Safety

Each token type has specific value format requirements:

#### Color
- Formats: hex (`#FF0000`), rgb (`rgb(255, 0, 0)`), hsl (`hsl(0, 100%, 50%)`)
- Named colors (`red`, `blue`, etc.)
- Aliases (`{color.primary.500}`)

#### Dimension
- Format: number + unit
- Units: `px`, `rem`, `em`, `%`, `vh`, `vw`, `vmin`, `vmax`
- Example: `16px`, `1.5rem`, `50%`

#### Duration
- Format: number + unit
- Units: `ms`, `s`
- Example: `200ms`, `0.3s`

#### Font Weight
- Range: 1-1000 (number)
- Keywords: `normal`, `bold`, `lighter`, `bolder`

#### Cubic Bezier
- Format: Array of 4 numbers between 0 and 1
- Example: `[0.4, 0, 0.2, 1]`

### 3. Alias Integrity

**Valid Alias**: References an existing token
```json
{
  "color": {
    "primary": { "$value": "#3b82f6", "$type": "color" },
    "button": { "$value": "{color.primary}", "$type": "color" }
  }
}
```

**Invalid Alias**: References non-existent token
```json
{
  "button": {
    "$value": "{color.nonexistent}",  ❌ Token doesn't exist
    "$type": "color"
  }
}
```

**Circular Dependency**: Token references itself through alias chain
```json
{
  "a": { "$value": "{b}" },
  "b": { "$value": "{c}" },
  "c": { "$value": "{a}" }  ❌ Circular: a → b → c → a
}
```

### 4. Accessibility Contrast

The system checks color contrast using two standards:

#### WCAG 2.1 (Luminance Ratio)

| Level | Normal Text | Large Text | Use Case |
|-------|-------------|------------|----------|
| AAA   | 7:1         | 4.5:1      | Enhanced contrast |
| AA    | 4.5:1       | 3:1        | Minimum standard |

#### WCAG 3.0 (APCA)

| Level | APCA Value | Use Case |
|-------|------------|----------|
| AAA   | ≥90        | Excellent - all text sizes |
| AA    | ≥75        | Good - body text (16px+) |
| Large | ≥60        | Large text (24px+) or bold (18.66px+) |
| Non-text | ≥45     | Icons, borders |
| Fail  | <45        | Insufficient |

**Example API Usage**:
```javascript
POST /api/validation/contrast
{
  "textColor": "#000000",
  "backgroundColor": "#FFFFFF",
  "textSize": "normal",
  "requirements": {
    "wcag21": true,
    "wcag21Level": "AA",
    "apca": true,
    "apcaMinimum": 60
  }
}

Response:
{
  "valid": true,
  "analysis": {
    "wcag21": {
      "ratio": 21,
      "compliance": { "level": "AAA", "pass": true }
    },
    "apca": {
      "value": 106,
      "compliance": { "level": "AAA", "pass": true }
    }
  }
}
```

---

## API Endpoints

### Validate Single Token

```bash
POST /api/validation/token
Content-Type: application/json

{
  "token": {
    "token_path": "color.primary.500",
    "token_type": "color",
    "value": "#3b82f6"
  },
  "tokenSet": [] // Optional: for alias checking
}
```

### Check Contrast

```bash
POST /api/validation/contrast
Content-Type: application/json

{
  "textColor": "#000000",
  "backgroundColor": "#FFFFFF",
  "textSize": "normal"
}
```

### Batch Validation

```bash
POST /api/validation/batch
Content-Type: application/json

{
  "tokens": [
    { "token_path": "color.primary", "token_type": "color", "value": "#3b82f6" },
    { "token_path": "spacing.base", "token_type": "dimension", "value": "16px" }
  ]
}

Response:
{
  "summary": {
    "total": 2,
    "valid": 2,
    "invalid": 0,
    "withWarnings": 0
  },
  "results": []
}
```

### Get Validation Rules

```bash
GET /api/validation/rules/:projectId?/:brandId?

Response:
{
  "rules": {
    "naming": {
      "enforceKebabCase": true,
      "minSegments": 2
    },
    "contrast": {
      "wcag21": {
        "enabled": true,
        "level": "AA"
      }
    }
  }
}
```

### Health Report

```bash
GET /api/validation/health/:projectId?/:brandId?

Response:
{
  "health": {
    "total_tokens": 150,
    "naming_issues": 0,
    "type_issues": 0,
    "alias_issues": 2,
    "tokens_with_issues": [...]
  }
}
```

---

## CLI Usage

### Basic Validation

```bash
npm run tokens:validate
```

This runs comprehensive checks:
- Naming conventions
- Type safety
- Alias integrity
- Contrast analysis (for color pairs)

### Output Example

```
🔍 Validating design tokens...

Loading tokens...
Loaded 16 token files

Running enhanced validation checks...
Analyzing color contrast...

================================================================================
📊 Validation Summary
================================================================================

✅ All validations passed!

ℹ️  3 Contrast Advisory:
   1. text.primary on background.default: WCAG 2.1 = 18.5:1 (AAA)
   2. text.secondary on background.surface: WCAG 2.1 = 12.3:1 (AAA)
   3. text.disabled on background.default: APCA: Below recommended (52.3 < 60)

  Total tokens validated: 150
```

---

## Database Schema

### validation_rules

Stores validation configurations with hierarchy:

```sql
CREATE TABLE validation_rules (
  id UUID PRIMARY KEY,
  project_id UUID,      -- NULL for global defaults
  brand_id UUID,        -- NULL for project-level
  rules JSONB NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Rule Hierarchy**: Brand → Project → Global

### Trigger Function

```sql
CREATE FUNCTION validate_token_before_save()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Validate token path (kebab-case)
  -- 2. Check value is valid JSON
  -- 3. Verify alias references exist
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Programmatic Usage

### JavaScript/Node.js

```javascript
import {
  validateToken,
  validateContrast,
  validateTokenPath,
} from "./lib/utils/validation.js";

// Validate token
const token = {
  token_path: "color.primary.500",
  token_type: "color",
  value: "#3b82f6",
};

const result = validateToken(token);
if (!result.valid) {
  console.error("Validation errors:", result.errors);
}

// Check contrast
const contrast = validateContrast("#000000", "#FFFFFF", {
  textSize: "normal",
  requireWCAG21: true,
  wcag21Level: "AA",
});

console.log("Contrast ratio:", contrast.analysis.wcag21.ratio);
console.log("Passes AA:", contrast.analysis.wcag21.compliance.pass);
```

---

## Best Practices

1. **Run validation in CI/CD**: Add `npm run tokens:validate` to your build pipeline
2. **Check contrast early**: Use the API endpoint during token editing
3. **Set project-specific rules**: Override global defaults for stricter requirements
4. **Document exceptions**: If a contrast warning is acceptable, document why
5. **Use semantic naming**: Follow patterns like `category.property.variant`

---

## Troubleshooting

### "Invalid kebab-case" error

**Problem**: Token path contains uppercase or special characters

**Solution**: Use lowercase with hyphens only
```
❌ color.Primary500
✅ color.primary-500
```

### "Alias reference not found"

**Problem**: Token references a non-existent token

**Solution**: Verify the referenced token exists and path is correct
```
❌ {color.primary.600}  // 600 doesn't exist
✅ {color.primary.500}  // 500 exists
```

### "Circular dependency detected"

**Problem**: Token reference chain loops back to itself

**Solution**: Break the circular reference by using a direct value
```
❌ a → b → c → a
✅ a → b → c (direct value)
```

---

## Further Reading

- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [APCA Contrast Algorithm](https://github.com/Myndex/SAPC-APCA)
- [Design Tokens Format (DTCG)](https://design-tokens.github.io/community-group/format/)

For issues or questions, see [GitHub Issues](https://github.com/your-org/design-tokens/issues).
