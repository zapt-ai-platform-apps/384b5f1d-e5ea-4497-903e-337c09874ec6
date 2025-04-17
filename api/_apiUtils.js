import { initializeZapt } from '@zapt/zapt-js';
import * as Sentry from '@sentry/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Initialize Sentry
Sentry.init({
  dsn: process.env.VITE_PUBLIC_SENTRY_DSN,
  environment: process.env.VITE_PUBLIC_APP_ENV,
  initialScope: {
    tags: {
      type: 'backend',
      projectId: process.env.VITE_PUBLIC_APP_ID
    }
  }
});

const { supabase } = initializeZapt(process.env.VITE_PUBLIC_APP_ID);

export async function authenticateUser(req) {
  console.log('Authenticating user from API request');
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    console.error('Authentication error:', error);
    throw new Error('Invalid token');
  }

  console.log('User authenticated:', user.id);
  return user;
}

export function getDatabaseConnection() {
  console.log('Creating database connection');
  const client = postgres(process.env.COCKROACH_DB_URL);
  return drizzle(client);
}