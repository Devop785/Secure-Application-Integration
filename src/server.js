import {openDatabase} from './database.js';
import {createApp} from './integration.js';
const port=Number(process.env.PORT||3002);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be between 1 and 65535');
const db=openDatabase();
const server=createApp(db).listen(port,'127.0.0.1',()=>console.log(`Internship API: http://127.0.0.1:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
