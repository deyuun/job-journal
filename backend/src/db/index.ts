import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js"

// the pool is like automatically connect to the database for every request
const pool = new Pool(
  {
    connectionString: process.env.DATABASE_URL,
  }
)

// drizzle do two things (pool to communicate with PostgreSQL, and schema for TypeScript definition of db tables)
export const database = drizzle(pool, { schema })