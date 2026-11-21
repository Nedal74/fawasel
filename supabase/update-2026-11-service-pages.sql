-- NEDAL ELABID — Service landing pages
--
-- For a database that already ran supabase/schema.sql: paste this whole file
-- into Supabase → SQL Editor → New query → Run. It only ADDS one table; it
-- never drops or changes existing data, and is safe to run twice.
-- (Running the full supabase/schema.sql again has the same effect.)

create extension if not exists "pgcrypto";

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Same envelope as every other collection: id / created_at / updated_at / data.
create or replace procedure create_cms_table(table_name text) as $$
begin
  execute format($f$
    create table if not exists public.%I (
      id uuid primary key default gen_random_uuid(),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      data jsonb not null default '{}'::jsonb,
      published boolean generated always as (coalesce((data->>'published')::boolean, true)) stored,
      sort_order int generated always as (coalesce((data->>'order')::int, 0)) stored
    );
  $f$, table_name);

  execute format('drop trigger if exists %I on public.%I', table_name || '_updated_at', table_name);
  execute format(
    'create trigger %I before update on public.%I for each row execute function set_updated_at()',
    table_name || '_updated_at', table_name);

  execute format('alter table public.%I enable row level security', table_name);

  -- Anonymous clients may read published rows only; all writes require the
  -- service role, which is used exclusively on the server.
  execute format('drop policy if exists %I on public.%I', table_name || '_read_published', table_name);
  execute format(
    'create policy %I on public.%I for select using (published)',
    table_name || '_read_published', table_name);
end;
$$ language plpgsql;

call create_cms_table('landing_pages');

create unique index if not exists landing_pages_slug_key
  on public.landing_pages ((data->>'slug'));

-- Starter content: the Riyadh real-estate page ------------------------------
-- Inserted only when no page with this slug exists, so running the file again
-- never duplicates the row and never overwrites your dashboard edits.
insert into public.landing_pages (data)
select $landing${
  "title": {
    "en": "Real Estate Marketing in Riyadh",
    "ar": "التسويق العقاري في الرياض"
  },
  "slug": "real-estate-marketing-riyadh",
  "heroHeadline": {
    "en": "Real Estate Marketing in Riyadh",
    "ar": "التسويق العقاري في الرياض"
  },
  "heroSubline": {
    "en": "I take your real estate project from prospective buyers all the way to enquiries you can act on: photography, drone, paid campaigns and a landing page that captures the lead.",
    "ar": "أحوّل مشروعك العقاري إلى اتفاق مع العملاء المحتملين: من التصوير والدرون، إلى الحملة الممولة، إلى صفحة تستقبل الاستفسارات."
  },
  "heroImage": "",
  "heroImageAlt": {
    "en": "A residential tower in Riyadh at sunset — a real estate marketing project.",
    "ar": "برج سكني في الرياض وقت الغروب — مشروع تسويق عقاري."
  },
  "heroStats": [
    {
      "label": {
        "en": "Al Jafal Real Estate",
        "ar": "الجافل العقارية"
      },
      "value": "800+"
    },
    {
      "label": {
        "en": "Umam Real Estate",
        "ar": "أمم العقارية"
      },
      "value": "2,000+"
    },
    {
      "label": {
        "en": "Al Mugheeb Real Estate Development",
        "ar": "المغيب للتطوير العقاري"
      },
      "value": "80"
    }
  ],
  "ctaLabel": {
    "en": "Talk to me on WhatsApp",
    "ar": "تحدّث معي على واتساب"
  },
  "whatsappMessage": {
    "en": "Hi Nedal — I have a real estate project in Riyadh and I would like to talk about marketing it.",
    "ar": "أهلًا نضال، عندي مشروع عقاري في الرياض وحابب أتكلم معك عن تسويقه."
  },
  "offerHeading": {
    "en": "What I deliver for your project",
    "ar": "ماذا أقدّم لمشروعك"
  },
  "offerItems": {
    "en": "Paid campaign management :: Campaigns on the platforms your buyers actually use, targeted by project and by Riyadh, and built around enquiries rather than impressions.\nSocial media management :: A steady presence that shows the project and answers the questions buyers ask before anyone calls you.\nReal estate photography and drone :: Ground and aerial coverage of the project and its location, so buyers see it the way they would on a site visit.\nVideo production :: Short films for launches and ads that gather the location and the units into one simple, convincing story.\nProject website development :: A page for each project showing the location, the units and the features, taking enquiries directly.",
    "ar": "إدارة الحملات الإعلانية الممولة :: حملات على المنصات التي يتواجد فيها مشتروك ومستهدفة بالمشروع وبالرياض، باستهداف دقيق ورسائل تقود إلى الاستفسار لا إلى المشاهدات فقط.\nإدارة منصات التواصل الاجتماعي :: حضور مستمر يعرض مشروعك ويجيب عن أسئلة المهتمين، ويبني الثقة قبل أن يتصل بك أحد.\nالتصوير العقاري والدرون :: تصوير معماري أرضي ولقطات جوية تظهر المشروع وموقعه ومحيطه كما سيشاهده العميل عند الزيارة.\nإنتاج الفيديو :: فيديوهات قصيرة للمشاريع والإعلانات تجمع الموقع والوحدات والميزات في سرد بسيط ومقنع.\nتطوير مواقع المشاريع :: صفحة أو موقع لكل مشروع يعرض الموقع والوحدات والمزايا ويستقبل طلبات الاستفسار مباشرة."
  },
  "offerNote": {
    "en": "The scope is agreed against a commercial outcome, not against a list of deliverables.",
    "ar": "يُحدَّد نطاق العمل بناءً على نتيجة تجارية، لا على قائمة مخرجات."
  },
  "methodHeading": {
    "en": "How I work",
    "ar": "طريقة العمل"
  },
  "methodSteps": {
    "en": "Understanding the brief :: A session to understand your project, its location, its audience, its selling prices, and the commercial goal — sales or rentals or bookings.\nBuilding the project''s assets :: The visual and written material (photography, drone, video, ad copy).\nLaunching the campaigns :: Paid campaigns that take enquiries and route them to a channel you own: WhatsApp, a landing page or a request form.\nMeasuring and improving :: Tracking the cost of a qualified lead and the quality of enquiries, and adjusting targeting and messaging weekly.\nClear reporting :: Periodic numbers that answer three questions — how many leads, where from, and at what cost.",
    "ar": "الفهم قبل الإعلان :: جلسة لفهم مشروعك وموقعه وجمهوره وأسعار المنافسين والهدف التجاري: بيع أو تأجير أو حجوزات.\nبناء أصول المشروع :: صفحة المشروع والمحتوى البصري (تصوير أرضي ودرون وفيديو) ورسائل الإعلانات.\nإطلاق الحملات :: حملات ممولة تستقبل الاستفسارات وتوصلها إلى قناة تملكها: واتساب أو صفحة أو نموذج طلب.\nالقياس والتحسين :: متابعة تكلفة العميل المحتمل وجودة الاستفسارات، وتعديل الاستهداف والرسائل أسبوعيًا.\nتقارير واضحة :: أرقام دورية تجيب عن ثلاثة أسئلة: كم عميلًا محتملًا، ومن أين، وبكم كلّف."
  },
  "caseStudiesHeading": {
    "en": "Case studies",
    "ar": "دراسات الحالة"
  },
  "projectIds": [],
  "faqHeading": {
    "en": "Frequently asked questions",
    "ar": "الأسئلة الشائعة"
  },
  "faqItems": {
    "en": "How much does real estate marketing in Riyadh cost? :: The cost depends on the scope: campaign management only, or a full scope covering photography, content and the project website. It is set after the first session, not quoted blind.\nWhen do results start to show? :: On comparable projects, enquiries started within the first week of a campaign going live. On one real estate project that reached more than 800 prospective leads in 25 days — timing depends on the project''s readiness and the media budget.\nDo you work with developers and brokerages? :: Yes. I work with real estate development companies on marketing their projects, and with brokerage offices and firms on generating prospective buyers and tenants.\nWhat is the difference between you and an agency? :: You deal with me directly — one person who understands your project, builds it, runs your campaigns, and reads the numbers with you, instead of a brief moving between departments.\nDoes the photography service cover inside Riyadh? :: Yes — photography, drone and video are part of the project assets I produce, with the licences and permits required in Saudi Arabia.\nDo I need a website for every project? :: Not necessarily a full site. Sometimes a single clear page per project is enough to present it and take enquiries, and it can be developed later as the work grows.",
    "ar": "كم تبلغ تكلفة التسويق العقاري في الرياض؟ :: تعتمد التكلفة على نطاق العمل: إدارة حملات فقط، أم نطاق كامل يشمل التصوير والمحتوى وموقع المشروع. وهي تُحدَّد بعد جلسة الفهم الأولى بالطبق والسعر، دون أي افتراض.\nمتى تبدأ النتائج في الظهور؟ :: في المشاريع المشابهة بدأت الاستفسارات خلال الأسبوع الأول من إطلاق الحملة. في أحد المشاريع العقارية وصلنا إلى أكثر من 800 عميل محتمل خلال 25 يومًا، ويبقى التوقيت على جاهزية المشروع والميزانية الإعلانية.\nهل تعمل مع المطورين وشركات الوساطة؟ :: نعم، أعمل مع شركات التطوير العقاري على تسويق مشاريعها، ومع مكاتب وشركات الوساطة على توليد عملاء محتملين للبيع والتأجير.\nما الفرق بينك وبين وكالة تسويق؟ :: تتعامل معي مباشرة: شخص واحد يفهم مشروعك ويبنيه ويدير حملاتك ويقرأ الأرقام معك، بدل أن ينتقل البريف بين الأقسام.\nهل تشمل خدمة التصوير بالدرون داخل الرياض؟ :: نعم، التصوير الأرضي والدرون جزء من أصول المشروع التي أنتجها، مع التراخيص والتصاريح المعمول بها في السعودية.\nهل أحتاج موقعًا إلكترونيًا لكل مشروع؟ :: ليس بالضرورة موقعًا كاملًا. أحيانًا تكفي صفحة واحدة واضحة لكل مشروع تعرضه وتستقبل الاستفسارات، ويمكن تطويرها لاحقًا مع اتساع نطاق العمل."
  },
  "closingHeading": {
    "en": "Ready to talk about your project?",
    "ar": "جاهز نتكلم عن مشروعك؟"
  },
  "closingBody": {
    "en": "Message me on WhatsApp and I will get back to you myself. One message is enough to start.",
    "ar": "راسلني على واتساب وسأرد عليك بنفسي. الرسالة الأولى تكفي، صفحة واحدة."
  },
  "seoTitle": {
    "en": "Real Estate Marketing in Riyadh | Nedal Elabid",
    "ar": "التسويق العقاري في الرياض | نضال الأبيض"
  },
  "seoDescription": {
    "en": "Real estate marketing in Riyadh with documented results: 800+ prospective leads in 25 days for Al Jafal, 2,000+ for Umam, and 80 units booked in 5 months. Paid campaigns, photography, drone and project websites.",
    "ar": "تسويق عقاري في الرياض بأرقام موثقة: أكثر من 800 عميل محتمل في 25 يومًا للجافل، و2,000+ لأمم، و80 مكتبًا محجوزًا للمغيب في 5 أشهر. حملات ممولة، تصوير ودرون، ومواقع مشاريع."
  },
  "featured": true,
  "published": true,
  "order": 0
}$landing$::jsonb
where not exists (
  select 1 from public.landing_pages
  where data->>'slug' = 'real-estate-marketing-riyadh'
);
