import { NextRequest, NextResponse } from 'next/server';
import { fetchMySQLTableInfo } from '@/lib/db/mysql';
import { fetchPostgreSQLTableInfo } from '@/lib/db/postgresql';
import { handleDatabaseError } from '@/lib/db/errors';
import type { TableRequest } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    const body: TableRequest = await request.json();
    const {
      networkType,
      hostname,
      username,
      password,
      port,
      database,
      search,
    } = body;

    // Validate required fields
    if (!networkType || !hostname || !username || !port || !database) {
      return NextResponse.json(
        { error: 'All connection details and database name are required' },
        { status: 400 }
      );
    }

    const config = {
      hostname,
      username,
      password,
      port: parseInt(port),
    };

    let tables;

    if (networkType === 'mysql') {
      tables = await fetchMySQLTableInfo(config, database, search);
    } else if (networkType === 'postgresql') {
      tables = await fetchPostgreSQLTableInfo(config, database, search);
    } else {
      return NextResponse.json(
        { error: 'Unsupported database type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tables,
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
