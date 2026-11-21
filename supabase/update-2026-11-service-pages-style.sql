-- NEDAL ELABID — Service pages: gallery, lead form, explained figures
--
-- Run after supabase/update-2026-11-service-pages.sql. Paste the whole file
-- into Supabase → SQL Editor → New query → Run. It only fills in the fields
-- the redesign added and repairs the escaped apostrophe from the first file;
-- it never deletes a row and is safe to run twice.

-- 1. The quoted apostrophe shipped in the first migration's English text.
update public.landing_pages
set data = jsonb_set(
  data,
  '{faqItems,en}',
  to_jsonb(replace(data->'faqItems'->>'en', 'project''''s', 'project''s'))
)
where data->'faqItems'->>'en' like '%project''''s%';

-- 2. Fields the redesign added. `||` only writes a key that is missing, because
--    the new object is merged UNDER the stored one further down.
update public.landing_pages
set data = jsonb_build_object(
  'galleryHeading', jsonb_build_object('en', 'Designs from the work', 'ar', 'تصاميم من الشغل'),
  'gallery', '[]'::jsonb,
  'leadHeading', jsonb_build_object('en', 'Prefer I call you?', 'ar', 'تفضّل أتصل بك؟'),
  'leadBody', jsonb_build_object(
    'en', 'Leave a name and a number and I will get back to you myself. Nothing else is needed.',
    'ar', 'سيب اسمك ورقمك وأرجع لك بنفسي. مش محتاج أي حاجة تانية.'
  ),
  'leadButton', jsonb_build_object('en', 'Send', 'ar', 'أرسل')
) || data
where data->>'slug' = 'real-estate-marketing-riyadh';

-- 3. The figures now lead and the sentence under them says what they count.
--    Only replaced while the labels are still the original client names, so a
--    label you edited in the dashboard is left alone.
update public.landing_pages
set data = jsonb_set(data, '{heroStats}', jsonb_build_array(
  jsonb_build_object(
    'value', '800+',
    'label', jsonb_build_object(
      'en', 'prospective leads in 25 days — Al Jafal Real Estate',
      'ar', 'عميل محتمل خلال 25 يومًا — الجافل العقارية')),
  jsonb_build_object(
    'value', '2,000+',
    'label', jsonb_build_object(
      'en', 'prospective leads in about 4 months — Umam Real Estate',
      'ar', 'عميل محتمل خلال نحو 4 أشهر — أمم العقارية')),
  jsonb_build_object(
    'value', '80',
    'label', jsonb_build_object(
      'en', 'offices booked in 5 months — Al Mugheeb Real Estate Development',
      'ar', 'مكتبًا محجوزًا خلال 5 أشهر — المغيب للتطوير العقاري'))
))
where data->>'slug' = 'real-estate-marketing-riyadh'
  and data->'heroStats'->0->'label'->>'ar' = 'الجافل العقارية';
