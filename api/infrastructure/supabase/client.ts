import "./loadEnv";
import { createClient } from "@supabase/supabase-js";

const env = (globalThis as {
  process?: { env?: Record<string, string | undefined> }
}).process?.env

const supabaseUrl = env?.SUPABASE_URL
const supabaseKey =
  env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY) en api/.env",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // el backend no mantiene sesión de usuario
    autoRefreshToken: false,
  },
});