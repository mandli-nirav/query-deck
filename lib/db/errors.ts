export function handleDatabaseError(error: unknown): {
  message: string;
  details: string;
} {
  console.error('Database error:', error);

  const err = error as { code?: string; message?: string; hostname?: string };
  let errorMessage = 'Connection failed. Please check your credentials.';

  if (err.code === 'ECONNREFUSED') {
    const isLocalhost =
      err.hostname?.includes('localhost') ||
      err.hostname?.includes('127.0.0.1');
    if (isLocalhost) {
      errorMessage =
        'Cannot connect to localhost from deployed server. Use a publicly accessible database or run the app locally.';
    } else {
      errorMessage =
        'Connection refused. Check if the database server is running and accepting connections.';
    }
  } else if (err.code === 'ENOTFOUND') {
    errorMessage = 'Host not found. Check your hostname/IP address.';
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === '28P01') {
    errorMessage = 'Access denied. Check your username and password.';
  } else if (err.code === 'ETIMEDOUT') {
    const hostname =
      err.message?.match(/(?:to |connect to )([^\s:]+)/)?.[1] || '';
    const isPrivateIP = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(
      hostname
    );

    if (isPrivateIP) {
      errorMessage = `Cannot reach private IP address (${hostname}) from deployed server. Please use a publicly accessible database with a public hostname, or use a cloud database service like Railway, Supabase, or PlanetScale.`;
    } else {
      errorMessage =
        'Connection timeout. The database may be behind a firewall, not accepting external connections, or the hostname/port may be incorrect.';
    }
  }

  return {
    message: errorMessage,
    details: err.message || 'Unknown error',
  };
}
