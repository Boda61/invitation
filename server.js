import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: './.env' });

const app = express();
const port = process.env.PORT || 4000;
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('خطأ: يجب تعيين DATABASE_URL في ملف .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(process.cwd()));

app.get('/api/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'فشل الاتصال بقاعدة البيانات' });
  }
});

app.get('/api/participants', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, team, points, created_at FROM participants ORDER BY points DESC, created_at ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'فشل تحميل المشاركين' });
  }
});

app.post('/api/participants', async (req, res) => {
  const { name, team, points } = req.body;
  if (!name || !team) {
    return res.status(400).json({ status: 'error', message: 'الاسم والفريق مطلوبان' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO participants (name, team, points) VALUES ($1, $2, $3) RETURNING id, name, team, points, created_at',
      [name.trim(), team, Number(points) || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'فشل إضافة المشارك' });
  }
});

app.post('/api/points', async (req, res) => {
  const { name, team, points } = req.body;
  if (!name || !team || typeof points !== 'number') {
    return res.status(400).json({ status: 'error', message: 'الاسم والفريق والنقاط مطلوبة' });
  }

  try {
    const updateResult = await pool.query(
      'UPDATE participants SET points = points + $1 WHERE name = $2 AND team = $3 RETURNING id, name, team, points, created_at',
      [points, name.trim(), team]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'المشارك غير موجود' });
    }

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'فشل تحديث النقاط' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
