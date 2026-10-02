"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
require("./loadEnv");
const supabase_js_1 = require("@supabase/supabase-js");
const env = globalThis.process?.env;
const supabaseUrl = env?.SUPABASE_URL;
const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY) en api/.env");
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // el backend no mantiene sesión de usuario
        autoRefreshToken: false,
    },
});
