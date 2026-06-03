const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://postgres.gcrgtkjmretabpmlrpyd:L9ja8SMUWJH8ABaS@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres' }); 
async function main() { 
  await client.connect(); 
  const res = await client.query('SELECT "errorMessage" FROM "AIUsageLog" WHERE success = false ORDER BY "createdAt" DESC LIMIT 1'); 
  console.log('ERROR:', res.rows[0]?.errorMessage); 
} 
main().catch(console.error).finally(() => client.end());
