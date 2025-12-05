import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { networkType, hostname, username, password, port, database, query } =
      await request.json();

    if (!networkType || !hostname || !username || !database || !query) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    let result: { columns: string[]; rows: any[] };

    if (networkType === 'mysql') {
      const connection = await mysql.createConnection({
        host: hostname,
        user: username,
        password: password || '',
        database,
        port: parseInt(port) || 3306,
      });

      try {
        const [rows, fields] = await connection.execute(query);

        if (Array.isArray(rows)) {
          result = {
            columns: fields?.map((field: any) => field.name) || [],
            rows: rows,
          };
        } else {
          // For INSERT, UPDATE, DELETE queries
          result = {
            columns: ['affectedRows'],
            rows: [{ affectedRows: (rows as any).affectedRows }],
          };
        }
      } finally {
        await connection.end();
      }
    } else if (networkType === 'postgresql') {
      const pool = new Pool({
        host: hostname,
        user: username,
        password: password || '',
        database,
        port: parseInt(port) || 5432,
      });

      try {
        const queryResult = await pool.query(query);

        result = {
          columns: queryResult.fields.map((field: { name: string }) => field.name),
          rows: queryResult.rows,
        };
      } finally {
        await pool.end();
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid network type' },
        { status: 400 }
      );
    }

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      result: {
        columns: result.columns,
        rows: result.rows,
        rowCount: result.rows.length,
        executionTime,
      },
    });
  } catch (error: any) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute query',
      },
      { status: 500 }
    );
  }
}
