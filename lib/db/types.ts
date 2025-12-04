export interface DatabaseInfo {
  name: string;
  size: string;
  tables?: string[];
}

export interface TableInfo {
  name: string;
  rows: number;
  size: string;
  created: string;
  updated: string;
  engine: string;
  comment: string;
  type: string;
}

export interface ConnectionConfig {
  hostname: string;
  username: string;
  password?: string;
  port: number;
}

export type NetworkType = 'mysql' | 'postgresql';

export interface ConnectionRequest {
  networkType: NetworkType;
  hostname: string;
  username: string;
  password?: string;
  port: string;
}

export interface TableRequest extends ConnectionRequest {
  database: string;
  search?: string;
}
