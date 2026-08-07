import bcrypt from 'bcrypt';
import pool from './index';

const SALT_ROUNDS = 10;

async function seed() {
  const username = 'admin';
  const password = 'admin123';

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await pool.query(
    `INSERT INTO admins (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO NOTHING`,
    [username, passwordHash]
  );

  console.log(`Seed complete: admin user "${username}" created (or already exists).`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
