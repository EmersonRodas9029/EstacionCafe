import { config } from "dotenv";
import { resolve } from "path";

// La API guarda sus credenciales en api/.env, independientemente del cwd o del build.
config({ path: resolve(process.cwd(), "api/.env") });
config({ path: resolve(__dirname, "../../.env") });

