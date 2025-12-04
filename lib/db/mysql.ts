import mysql from 'mysql2/promise';

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

export async function testMySQLConnection(config: ConnectionConfig) {
  const connection = await mysql.createConnection({
    host: config.hostname,
    user: config.username,
    password: config.password || '',
    port: config.port,
    connectTimeout: 10000,
  });

  try {
    await connection.ping();
    return { success: true };
  } finally {
    await connection.end();
  }
}

export async function fetchMySQLDatabases(
  config: ConnectionConfig
): Promise<DatabaseInfo[]> {
  const connection = await mysql.createConnection({
    host: config.hostname,
    user: config.username,
    password: config.password || '',
    port: config.port,
    connectTimeout: 10000,
  });

  try {
    const [rows] = await connection.query(`
      SELECT
        table_schema as database_name,
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
      FROM information_schema.tables
      GROUP BY table_schema
    `);

    const dbList = (
      rows as Array<{ database_name: string; size_mb: number | null }>
    ).filter(
      (row) =>
        !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(
          row.database_name
        )
    );

    return dbList.map((row) => ({
      name: row.database_name,
      size: row.size_mb ? `${row.size_mb} MB` : '0 MB',
    }));
  } finally {
    await connection.end();
  }
}

export async function fetchMySQLTables(
  config: ConnectionConfig,
  database: string
): Promise<string[]> {
  const connection = await mysql.createConnection({
    host: config.hostname,
    user: config.username,
    password: config.password || '',
    port: config.port,
    connectTimeout: 10000,
  });

  try {
    const [rows] = await connection.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
      [database]
    );

    return (rows as Array<{ table_name: string }>).map((t) => t.table_name);
  } finally {
    await connection.end();
  }
}

export async function fetchMySQLDatabasesWithTables(
  config: ConnectionConfig
): Promise<DatabaseInfo[]> {
  const connection = await mysql.createConnection({
    host: config.hostname,
    user: config.username,
    password: config.password || '',
    port: config.port,
    connectTimeout: 10000,
  });

  try {
    const [rows] = await connection.query(`
      SELECT
        table_schema as database_name,
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
      FROM information_schema.tables
      GROUP BY table_schema
    `);

    const dbList = (
      rows as Array<{ database_name: string; size_mb: number | null }>
    ).filter(
      (row) =>
        !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(
          row.database_name
        )
    );

    const databases = await Promise.all(
      dbList.map(async (row) => {
        const [tableRows] = await connection.query(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
          [row.database_name]
        );

        return {
          name: row.database_name,
          size: row.size_mb ? `${row.size_mb} MB` : '0 MB',
          tables: (tableRows as Array<{ table_name: string }>).map(
            (t) => t.table_name
          ),
        };
      })
    );

    return databases;
  } finally {
    await connection.end();
  }
}

export async function fetchMySQLTableInfo(
  config: ConnectionConfig,
  database: string,
  search?: string
): Promise<TableInfo[]> {
  const connection = await mysql.createConnection({
    host: config.hostname,
    user: config.username,
    password: config.password || '',
    port: config.port,
    database: database,
    connectTimeout: 10000,
  });

  try {
    let query = `
      SELECT
        TABLE_NAME as name,
        TABLE_ROWS as \`rows\`,
        ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) as size_kb,
        CREATE_TIME as created,
        UPDATE_TIME as updated,
        ENGINE as engine,
        TABLE_COMMENT as comment,
        TABLE_TYPE as type
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
    `;

    const params: string[] = [database];

    if (search && search.trim()) {
      query += ` AND (
        TABLE_NAME LIKE ? OR
        TABLE_COMMENT LIKE ? OR
        ENGINE LIKE ? OR
        TABLE_TYPE LIKE ?
      )`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY TABLE_NAME`;

    const [rows] = await connection.query(query, params);

    return (
      rows as Array<{
        name: string;
        rows: number;
        size_kb: number;
        created: Date | null;
        updated: Date | null;
        engine: string | null;
        comment: string | null;
        type: string;
      }>
    ).map((row) => ({
      name: row.name,
      rows: row.rows || 0,
      size: row.size_kb ? `${row.size_kb} KiB` : '0 KiB',
      created: row.created ? row.created.toString() : '',
      updated: row.updated ? row.updated.toString() : '',
      engine: row.engine || '',
      comment: row.comment || '',
      type: row.type === 'BASE TABLE' ? 'Table' : row.type,
    }));
  } finally {
    await connection.end();
  }
}
