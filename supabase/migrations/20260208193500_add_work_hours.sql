-- Doktorlar tablosuna çalışma saatleri kolonu ekle
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS work_hours JSONB DEFAULT '[
  {"day": 1, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 2, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 3, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 4, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 5, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 6, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 0, "start": "09:00", "end": "18:00", "isOpen": false}
]';

-- Klinik genel çalışma saatleri ayarını ekle
INSERT INTO clinic_settings (key, value)
VALUES ('clinic_work_hours', '[
  {"day": 1, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 2, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 3, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 4, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 5, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 6, "start": "09:00", "end": "18:00", "isOpen": true},
  {"day": 0, "start": "09:00", "end": "18:00", "isOpen": false}
]')
ON CONFLICT (key) DO NOTHING;
