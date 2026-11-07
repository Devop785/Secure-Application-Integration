import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
export function openDatabase(path = process.env.DB_PATH || 'data/internships.sqlite') {
 if(path !== ':memory:') mkdirSync(dirname(resolve(path)),{recursive:true});
 const db = new DatabaseSync(path);
 db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 db.exec(readFileSync(new URL('../db/schema.sql',import.meta.url),'utf8'));
 return db;
}
