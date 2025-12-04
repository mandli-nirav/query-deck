import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const {
      networkType,
      hostname,
      username,
      password,
      port,
      database,
      tableName,
    } = await request.json();

    if (!networkType || !hostname || !username || !database || !tableName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let columns: any[] = [];

    if (networkType === 'mysql') {
      const connection = await mysql.createConnection({
        host: hostname,
        user: username,
        password: password || '',
        database,
        port: parseInt(port) || 3306,
      });

      try {
        const [rows] = await connection.execute(
          `SELECT COLUMN_NAME as name, DATA_TYPE as type, IS_NULLABLE as nullable
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
           ORDER BY ORDINAL_POSITION`,
          [database, tableName]
        );
        columns = rows as any[];
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
        const result = await pool.query(
          `SELECT column_name as name, data_type as type, is_nullable as nullable
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position`,
          [tableName]
        );
        columns = result.rows;
      } finally {
        await pool.end();
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid network type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      columns,
    });
  } catch (error: any) {
    console.error('Error fetching columns:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch columns',
      },
      { status: 500 }
    );
  }
}
