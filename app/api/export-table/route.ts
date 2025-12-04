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
      format,
    } = body;

    // Validate required fields
    if (
      !networkType ||
      !hostname ||
      !username ||
      !port ||
      !database ||
      !tableName ||
      !format
    ) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    let data: any[] = [];
    let columns: string[] = [];

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
        // Get all data from the table
        const [rows] = await connection.query(`SELECT * FROM ??`, [tableName]);
        data = rows as any[];

        // Get column names
        if (data.length > 0) {
          columns = Object.keys(data[0]);
        }
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

        // Get all data from the table
        const result = await client.query(`SELECT * FROM ${tableName}`);
        data = result.rows;

        // Get column names
        if (result.fields.length > 0) {
          columns = result.fields.map((field) => field.name);
        }
      } finally {
        await client.end();
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported database type' },
        { status: 400 }
      );
    }

    // Generate export content based on format
    let content: string;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'csv':
        // CSV format
        const csvRows = [
          columns.join(','), // Header
          ...data.map((row) =>
            columns
              .map((col) => {
                const value = row[col];
                // Escape quotes and wrap in quotes if contains comma or quote
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                if (
                  stringValue.includes(',') ||
                  stringValue.includes('"') ||
                  stringValue.includes('\n')
                ) {
                  return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
              })
              .join(',')
          ),
        ];
        content = csvRows.join('\n');
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;

      case 'json':
        // JSON format
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
        break;

      case 'sql':
        // SQL INSERT statements
        const sqlStatements = data.map((row) => {
          const values = columns.map((col) => {
            const value = row[col];
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'number') return value;
            // Escape single quotes in strings
            return `'${String(value).replace(/'/g, "''")}'`;
          });
          return `INSERT INTO ${tableName} (${columns.join(
            ', '
          )}) VALUES (${values.join(', ')});`;
        });
        content = sqlStatements.join('\n');
        contentType = 'application/sql';
        fileExtension = 'sql';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        );
    }

    // Return file as download
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${tableName}.${fileExtension}"`,
      },
    });
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
