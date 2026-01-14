-- ============================================================================
-- Token Validation Extensions for Supabase
-- PRD 0052: Automated validation rules and triggers
-- ============================================================================

-- ============================================================================
-- VALIDATION RULES TABLE
-- ============================================================================

-- Store validation configurations with project-level overrides
CREATE TABLE IF NOT EXISTS validation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Scope (null for global defaults)
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Rule configuration (JSONB for flexibility)
  rules JSONB NOT NULL DEFAULT '{
    "naming": {
      "enforceKebabCase": true,
      "minSegments": 2
    },
    "typeSafety": {
      "enforceTypeValidation": true,
      "allowUnknownTypes": false
    },
    "aliasIntegrity": {
      "preventCircularDeps": true,
      "requireExistingReferences": true
    },
    "contrast": {
      "wcag21": {
        "enabled": true,
        "level": "AA",
        "normalTextMinimum": 4.5,
        "largeTextMinimum": 3.0
      },
      "apca": {
        "enabled": true,
        "minimumValue": 60,
        "treatAsWarning": true
      }
    }
  }'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure only one rule set per scope
  CONSTRAINT unique_validation_scope UNIQUE NULLS NOT DISTINCT (project_id, brand_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_validation_rules_project ON validation_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_validation_rules_brand ON validation_rules(brand_id);

-- ============================================================================
-- VALIDATION RESULTS TABLE (Optional: For tracking validation history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
  
  -- Validation details
  validation_type TEXT NOT NULL, -- 'naming', 'type', 'alias', 'contrast'
  status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'fail')),
  message TEXT,
  details JSONB, -- Store detailed analysis
  
  -- Timestamps
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For tracking changes
  token_version INTEGER
);

CREATE INDEX IF NOT EXISTS idx_validation_results_token ON validation_results(token_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_status ON validation_results(status);

-- ============================================================================
-- POSTGRESQL FUNCTIONS FOR VALIDATION
-- ============================================================================

-- Function to get validation rules for a token's scope
CREATE OR REPLACE FUNCTION get_validation_rules(
  target_project_id UUID,
  target_brand_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  rules_result JSONB;
BEGIN
  -- Try brand-specific rules first
  IF target_brand_id IS NOT NULL THEN
    SELECT rules INTO rules_result
    FROM validation_rules
    WHERE brand_id = target_brand_id
    LIMIT 1;
    
    IF FOUND THEN
      RETURN rules_result;
    END IF;
  END IF;
  
  -- Try project-specific rules
  IF target_project_id IS NOT NULL THEN
    SELECT rules INTO rules_result
    FROM validation_rules
    WHERE project_id = target_project_id AND brand_id IS NULL
    LIMIT 1;
    
    IF FOUND THEN
      RETURN rules_result;
    END IF;
  END IF;
  
  -- Fall back to global default rules
  SELECT rules INTO rules_result
  FROM validation_rules
  WHERE project_id IS NULL AND brand_id IS NULL
  LIMIT 1;
  
  IF FOUND THEN
    RETURN rules_result;
  END IF;
  
  -- Return default if nothing found
  RETURN '{
    "naming": {"enforceKebabCase": true, "minSegments": 2},
    "typeSafety": {"enforceTypeValidation": true},
    "aliasIntegrity": {"preventCircularDeps": true}
  }'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Function to validate token path (kebab-case)
CREATE OR REPLACE FUNCTION validate_token_path(path TEXT)
RETURNS TABLE(valid BOOLEAN, error TEXT) AS $$
BEGIN
  -- Check if empty
  IF path IS NULL OR path = '' THEN
    RETURN QUERY SELECT false, 'Token path cannot be empty';
    RETURN;
  END IF;
  
  -- Check minimum segments
  IF array_length(string_to_array(path, '.'), 1) < 2 THEN
    RETURN QUERY SELECT false, 'Token path must have at least 2 segments';
    RETURN;
  END IF;
  
  -- Check kebab-case format
  IF path !~ '^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*$' THEN
    RETURN QUERY SELECT false, 'Token path must use kebab-case (lowercase with hyphens)';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to check if token value is an alias
CREATE OR REPLACE FUNCTION is_alias_value(val TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN val ~ '^\{[^}]+\}$';
END;
$$ LANGUAGE plpgsql;

-- Function to extract alias path from value
CREATE OR REPLACE FUNCTION extract_alias_path(val TEXT)
RETURNS TEXT AS $$
BEGIN
  IF is_alias_value(val) THEN
    RETURN substring(val from 2 for length(val) - 2);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VALIDATION TRIGGER
-- ============================================================================

-- Trigger function to validate tokens before insert/update
CREATE OR REPLACE FUNCTION validate_token_before_save()
RETURNS TRIGGER AS $$
DECLARE
  validation_result RECORD;
  alias_path TEXT;
  alias_exists BOOLEAN;
BEGIN
  -- 1. Validate token path
  SELECT * INTO validation_result FROM validate_token_path(NEW.token_path);
  
  IF NOT validation_result.valid THEN
    RAISE EXCEPTION 'Invalid token path: %', validation_result.error;
  END IF;
  
  -- 2. Check if value is valid JSON
  BEGIN
    -- Try to parse value as JSONB to ensure it's valid
    PERFORM NEW.value::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid token value: must be valid JSON';
  END;
  
  -- 3. Validate alias integrity (if value is an alias reference)
  IF NEW.value::text LIKE '{%}' THEN
    alias_path := extract_alias_path(NEW.value::text);
    
    IF alias_path IS NOT NULL THEN
      -- Check if the referenced token exists in the same scope
      SELECT EXISTS(
        SELECT 1 FROM tokens
        WHERE token_path = alias_path
          AND (
            -- Same brand
            (brand_id = NEW.brand_id) OR
            -- Same project
            (project_id = NEW.project_id AND brand_id IS NULL) OR
            -- Global token
            (is_global = true)
          )
      ) INTO alias_exists;
      
      IF NOT alias_exists THEN
        -- Soft warning instead of hard error
        RAISE WARNING 'Alias reference "%" not found. This may cause issues.', alias_path;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only if tokens table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tokens') THEN
    DROP TRIGGER IF EXISTS trigger_validate_token ON tokens;
    CREATE TRIGGER trigger_validate_token
      BEFORE INSERT OR UPDATE ON tokens
      FOR EACH ROW
      EXECUTE FUNCTION validate_token_before_save();
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTION: Get validation health report
-- ============================================================================

CREATE OR REPLACE FUNCTION get_validation_health_report(
  target_project_id UUID DEFAULT NULL,
  target_brand_id UUID DEFAULT NULL
)
RETURNS TABLE(
  total_tokens BIGINT,
  naming_issues BIGINT,
  type_issues BIGINT,
  alias_issues BIGINT,
  tokens_with_issues JSONB
) AS $$
BEGIN
  -- This is a placeholder for a more complex implementation
  -- In production, this would analyze all tokens and return detailed stats
  
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_tokens,
    0::BIGINT as naming_issues,
    0::BIGINT as type_issues,
    0::BIGINT as alias_issues,
    '[]'::JSONB as tokens_with_issues
  FROM tokens
  WHERE
    (target_project_id IS NULL OR project_id = target_project_id) AND
    (target_brand_id IS NULL OR brand_id = target_brand_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES FOR VALIDATION TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;

-- Validation rules: Read by all, modify by admins
CREATE POLICY "Validation rules are viewable by all authenticated users"
  ON validation_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Validation rules can be modified by admins"
  ON validation_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
        AND (
          validation_rules.project_id IS NULL OR
          user_roles.project_id = validation_rules.project_id
        )
    )
  );

-- Validation results: Read by project members
CREATE POLICY "Validation results are viewable by project members"
  ON validation_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tokens
      JOIN user_roles ON user_roles.project_id = tokens.project_id
      WHERE tokens.id = validation_results.token_id
        AND user_roles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SEED DEFAULT VALIDATION RULES
-- ============================================================================

-- Insert global default rules if they don't exist
INSERT INTO validation_rules (project_id, brand_id, rules)
VALUES (NULL, NULL, '{
  "naming": {
    "enforceKebabCase": true,
    "minSegments": 2,
    "maxSegments": 10
  },
  "typeSafety": {
    "enforceTypeValidation": true,
    "allowUnknownTypes": false,
    "strictMode": false
  },
  "aliasIntegrity": {
    "preventCircularDeps": true,
    "requireExistingReferences": true,
    "allowCrossProjectReferences": false
  },
  "contrast": {
    "wcag21": {
      "enabled": true,
      "level": "AA",
      "normalTextMinimum": 4.5,
      "largeTextMinimum": 3.0
    },
    "apca": {
      "enabled": true,
      "minimumValue": 60,
      "recommendedValue": 75,
      "treatAsWarning": true
    }
  }
}'::jsonb)
ON CONFLICT (project_id, brand_id) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE validation_rules IS 'Stores validation configurations with project/brand hierarchy';
COMMENT ON TABLE validation_results IS 'Tracks validation history and results for tokens';
COMMENT ON FUNCTION get_validation_rules IS 'Retrieves validation rules with brand -> project -> global fallback';
COMMENT ON FUNCTION validate_token_path IS 'Validates token path format (kebab-case, minimum segments)';
COMMENT ON FUNCTION validate_token_before_save IS 'Trigger function to validate tokens before insert/update';
