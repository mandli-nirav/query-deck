import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { Client } from 'pg';
import { handleDatabaseError } from '@/lib/db/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      networkType,
      hostname,
      username,
      password,
      port,
      database,
      tableName,
    } = body;

    // Validate required fields
    if (
      !networkType ||
      !hostname ||
      !username ||
      !port ||
      !database ||
      !tableName
    ) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (networkType === 'mysql') {
      const connection = await mysql.createConnection({
        host: hostname,
        user: username,
        password: password || '',
        port: parseInt(port),
        database: database,
        connectTimeout: 10000,
      });

      try {
        // MySQL: DROP TABLE table_name
        await connection.query(`DROP TABLE ??`, [tableName]);

        return NextResponse.json({
          success: true,
          message: `Table "${tableName}" deleted successfully`,
        });
      } finally {
        await connection.end();
      }
    } else if (networkType === 'postgresql') {
      const client = new Client({
        host: hostname,
        user: username,
        password: password || '',
        port: parseInt(port),
        database: database,
        connectionTimeoutMillis: 10000,
      });

      try {
        await client.connect();

        // PostgreSQL: DROP TABLE table_name
        await client.query(`DROP TABLE ${tableName}`);

        return NextResponse.json({
          success: true,
          message: `Table "${tableName}" deleted successfully`,
        });
      } finally {
        await client.end();
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported database type' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const { message, details } = handleDatabaseError(error);

    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
      },
      { status: 500 }
    );
  }
}
