import {readFileSync} from 'node:fs';
import {openDatabase} from './database.js';
const db=openDatabase();
try{db.exec(readFileSync(new URL('../db/seed.sql',import.meta.url),'utf8'));console.log('Seed complete (existing IDs preserved).');}finally{db.close();}
