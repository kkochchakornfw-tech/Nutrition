import "server-only";
import { Pool, types } from "pg";

// pg แปลง DATE เป็น JS Date อัตโนมัติ แล้วโดน timezone เลื่อนวัน
// บังคับให้คืนเป็น string 'YYYY-MM-DD' ตรงๆ
types.setTypeParser(1082, (v) => v); // DATE
types.setTypeParser(1114, (v) => v); // TIMESTAMP (without tz)

const g = globalThis as unknown as { hisPool?: Pool };

export const hisPool =
  g.hisPool ??
  new Pool({
    host: process.env.HIS_DB_HOST,
    port: Number(process.env.HIS_DB_PORT ?? 5432),
    user: process.env.HIS_DB_USER,
    password: process.env.HIS_DB_PASSWORD,
    database: process.env.HIS_DB_NAME,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") g.hisPool = hisPool;
