const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_er9wkZV8IzyE@ep-restless-voice-albuug7e-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  try {
    await client.connect();
    
    console.log("--- Checking Database Migration Status ---");
    
    const habitsRes = await client.query('SELECT count(*) FROM habits');
    console.log(`Total Habits in DB: ${habitsRes.rows[0].count}`);
    
    const usersRes = await client.query('SELECT id, email, google_user_id FROM users');
    console.log(`Total Users in DB: ${usersRes.rows.length}`);
    
    console.log("\n--- Users Details ---");
    usersRes.rows.forEach(u => {
      console.log(`Email: ${u.email} | Google ID: ${u.google_user_id} | Internal ID: ${u.id}`);
    });
    
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

run();
