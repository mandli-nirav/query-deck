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
      oldTableName,
      newTableName,
    } = body;

    // Validate required fields
    if (
      !networkType ||
      !hostname ||
      !username ||
      !port ||
      !database ||
      !oldTableName ||
      !newTableName
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
        // MySQL: RENAME TABLE old_name TO new_name
        await connection.query(`RENAME TABLE ?? TO ??`, [
          oldTableName,
          newTableName,
        ]);

        return NextResponse.json({
          success: true,
          message: `Table renamed from "${oldTableName}" to "${newTableName}"`,
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

        // PostgreSQL: ALTER TABLE old_name RENAME TO new_name
        await client.query(
          `ALTER TABLE ${oldTableName} RENAME TO ${newTableName}`
        );

        return NextResponse.json({
          success: true,
          message: `Table renamed from "${oldTableName}" to "${newTableName}"`,
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
