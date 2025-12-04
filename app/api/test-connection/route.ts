import { NextRequest, NextResponse } from 'next/server';
import { fetchMySQLDatabasesWithTables } from '@/lib/db/mysql';
import { fetchPostgreSQLDatabasesWithTables } from '@/lib/db/postgresql';
import { handleDatabaseError } from '@/lib/db/errors';
import type { DatabaseInfo, ConnectionRequest } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    const body: ConnectionRequest = await request.json();
    const { networkType, hostname, username, password, port } = body;

    // Validate required fields
    if (!networkType || !hostname || !username || !port) {
      return NextResponse.json(
        { error: 'Network type, hostname, username, and port are required' },
        { status: 400 }
      );
    }

    const config = {
      hostname,
      username,
      password,
      port: parseInt(port),
    };

    let databases: DatabaseInfo[] = [];

    if (networkType === 'mysql') {
      databases = await fetchMySQLDatabasesWithTables(config);
    } else if (networkType === 'postgresql') {
      databases = await fetchPostgreSQLDatabasesWithTables(config);
    } else {
      return NextResponse.json(
        { error: 'Unsupported database type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      databases,
      message: 'Connection successful',
    });
  } catch (error: unknown) {
    const { message, details } = handleDatabaseError(error);

    return NextResponse.json(
      {
        success: false,
        error: message,
        details: details,
      },
      { status: 500 }
    );
  }
}
