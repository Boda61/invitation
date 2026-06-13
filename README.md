# Wedding Invite Neon Backend

This project adds a simple Node.js backend for storing participant data in Neon Postgres.

## إعداد Neon

1. أنشئ حسابًا على Neon.
2. أنشئ قاعدة بيانات جديدة.
3. انسخ `DATABASE_URL` من Neon.
4. انسخ `.env.example` إلى `.env` وضع الرابط.

## تشغيل المشروع

```bash
npm install
npm run start
```

## واجهات البرمجة

- `GET /api/status` - اختبار اتصال قاعدة البيانات.
- `GET /api/participants` - عرض كل المشاركين.
- `POST /api/participants` - إضافة مشارك جديد.
- `POST /api/points` - إضافة نقاط لمشارك موجود.

## جدول participants

```sql
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
