import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// --- Connection Details ---
// I have used the credentials you provided to connect the app to your Supabase project.
// The app will now fetch live data from your database.

// IMPORTANT SECURITY NOTE:
// The 'anon' key is safe to use in a browser.
// NEVER use the 'service_role' key in your frontend code. It is a secret key
// for backend use only and would give anyone full access to your database.

const supabaseUrl = 'https://mvusipourrzyrekbjwnd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dXNpcG91cnJ6eXJla2Jqd25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDM3NzUsImV4cCI6MjA3MzYxOTc3NX0.oPFBuzbAoa97UxY8dxvdQclSQcAAJdux0zeG263Y4e8';

// For production applications, it is best practice to use environment variables
// instead of hardcoding keys directly in the code.
// let supabaseUrl = process.env.SUPABASE_URL;
// let supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
     console.error("Supabase URL or Anon Key is missing.");
}

export const supabase = createClient<Database>(supabaseUrl as string, supabaseAnonKey as string);
