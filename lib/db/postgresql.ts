import { Client } from 'pg';

interface DatabaseInfo {
  name: string;
  size: string;
  tables?: string[];
}

interface TableInfo {
  name: string;
  rows: number;
  size: string;
  created: string;
  updated: string;
  engine: string;
  comment: string;
  type: string;
}

interface ConnectionConfig {
  hostname: string;
  username: string;
  password?: string;
  port: number;
}

export async function testPostgreSQLConnection(config: ConnectionConfig) {
  const client = new Client({
    host: config.hostname,
    user: config.username,
    password: config.password || '',
    port: config.port,
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    return { success: true };
  } finally {
    await client.end();
  }
}

export async function fetchPostgreSQLDatabases(
  config: ConnectionConfig
): Promise<DatabaseInfo[]> {
  const client = new Client({
    host: config.hostname,
    user: config.username,
    password: config.password || '',
    port: config.port,
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT
        datname as database_name,
        pg_size_pretty(pg_database_size(datname)) as size
      FROM pg_database
      WHERE datistemplate = false AND datname != 'postgres'
      ORDER BY pg_database_size(datname) DESC
    `);

    return result.rows.map((row) => ({
      name: row.database_name,
      size: row.size,
    }));
  } finally {
    await client.end();
  }
}

export async function fetchPostgreSQLTables(
  config: ConnectionConfig,
  database: string
): Promise<string[]> {
  const client = new Client({
    host: config.hostname,
    user: config.username,
    password: config.password || '',
    port: config.port,
    database: database,
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
    `);

    return result.rows.map((t) => t.tablename);
  } finally {
    await client.end();
  }
}

export async function fetchPostgreSQLDatabasesWithTables(
  config: ConnectionConfig
): Promise<DatabaseInfo[]> {
  const client = new Client({
    host: config.hostname,
    user: config.username,
    password: config.password || '',
    port: config.port,
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT
        datname as database_name,
        pg_size_pretty(pg_database_size(datname)) as size
      FROM pg_database
      WHERE datistemplate = false AND datname != 'postgres'
      ORDER BY pg_database_size(datname) DESC
    `);

    const databases = await Promise.all(
      result.rows.map(async (row) => {
        const dbClient = new Client({
          host: config.hostname,
          user: config.username,
          password: config.password || '',
          port: config.port,
          database: row.database_name,
          connectionTimeoutMillis: 10000,
        });

        try {
          await dbClient.connect();
          const tablesResult = await dbClient.query(`
            SELECT tablename
            FROM pg_catalog.pg_tables
            WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
          `);

          return {
            name: row.database_name,
            size: row.size,
            tables: tablesResult.rows.map((t) => t.tablename),
          };
        } catch (err) {
          console.error(`Error fetching tables for ${row.database_name}:`, err);
          return {
            name: row.database_name,
            size: row.size,
            tables: [],
          };
        } finally {
          await dbClient.end();
        }
      })
    );

    return databases;
  } finally {
    await client.end();
  }
}

export async function fetchPostgreSQLTableInfo(
  config: ConnectionConfig,
  database: string,
  search?: string
): Promise<TableInfo[]> {
  const client = new Client({
    host: config.hostname,
    user: config.username,
    password: config.password || '',
    port: config.port,
    database: database,
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();

    let query = `
      SELECT
        c.relname as name,
        c.reltuples::bigint as rows,
        pg_size_pretty(pg_total_relation_size(c.oid)) as size,
        CASE WHEN c.relkind = 'r' THEN 'Table' ELSE 'View' END as type,
        obj_description(c.oid) as comment
      FROM pg_class c
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND c.relkind IN ('r', 'v')
    `;

    const params: string[] = [];

    if (search && search.trim()) {
      query += ` AND (
        c.relname ILIKE $1 OR
        obj_description(c.oid) ILIKE $1 OR
        CASE WHEN c.relkind = 'r' THEN 'Table' ELSE 'View' END ILIKE $1
      )`;
      params.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY c.relname`;

    const result = await client.query(query, params);

    return result.rows.map((row) => ({
      name: row.name,
      rows: parseInt(row.rows) || 0,
      size: row.size || '0 bytes',
      created: '',
      updated: '',
      engine: 'PostgreSQL',
      comment: row.comment || '',
      type: row.type,
    }));
  } finally {
    await client.end();
  }
}
