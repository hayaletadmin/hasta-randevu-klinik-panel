-- Mevcut bildirimlerdeki eski linkleri güncelle
-- Bu SQL komutunu Supabase Dashboard > SQL Editor'de çalıştırın

UPDATE notifications
SET link = '/admin/randevular/liste'
WHERE link = '/admin/randevular'
  AND type = 'appointment';

-- Kaç kayıt güncellendiğini görmek için:
SELECT COUNT(*) as updated_count
FROM notifications
WHERE link = '/admin/randevular/liste'
  AND type = 'appointment';
