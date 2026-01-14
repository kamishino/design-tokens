export interface TokenFile {
  path: string;
  name: string;
  category: string;
  size: number;
}

export interface TokenContent {
  [key: string]: any;
}

export interface DraftChanges {
  [filePath: string]: TokenContent;
}

export interface TokenValue {
  $value?: any;
  value?: any;
  $type?: string;
  $description?: string;
  [key: string]: any;
}

// Multi-project types (PRD 0051 & 0054)
export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  git_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Brand {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description?: string;
  is_default: boolean;
  created_at?: string;
}

export interface CreateProjectRequest {
  name: string;
  slug: string;
  description?: string;
  git_url?: string;
  create_default_brand?: boolean;
}

export interface CreateBrandRequest {
  name: string;
  slug: string;
  description?: string;
  is_default?: boolean;
}
