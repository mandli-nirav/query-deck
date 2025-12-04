export function handleDatabaseError(error: unknown): {
  message: string;
  details: string;
} {
  console.error('Database error:', error);

  const err = error as { code?: string; message?: string };
  let errorMessage = 'Connection failed. Please check your credentials.';

  if (err.code === 'ECONNREFUSED') {
    errorMessage =
      'Connection refused. Check if the database server is running.';
  } else if (err.code === 'ENOTFOUND') {
    errorMessage = 'Host not found. Check your hostname/IP address.';
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === '28P01') {
    errorMessage = 'Access denied. Check your username and password.';
  } else if (err.code === 'ETIMEDOUT') {
    errorMessage =
      'Connection timeout. Check your network or firewall settings.';
  }

  return {
    message: errorMessage,
    details: err.message || 'Unknown error',
  };
}
