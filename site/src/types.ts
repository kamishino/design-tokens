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
