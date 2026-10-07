-- รวมแถว "แป้ง" เข้ากับ "ข้าว" → "ข้าว-แป้ง" (CHO 18 g/ส่วน) และปรับ "แป้งปลอด" เป็น CHO 18
-- แถว 'starch' ไม่ถูกลบ (calorie_calculation_foods อ้าง FK ของประวัติเดิม) — แอปซ่อนไว้ด้วย WHERE item_key <> 'starch'
UPDATE food_exchange_items SET label_th = 'ข้าว-แป้ง', fac_cho = 18 WHERE item_key = 'rice';
UPDATE food_exchange_items SET fac_cho = 18 WHERE item_key = 'starch_plod';
