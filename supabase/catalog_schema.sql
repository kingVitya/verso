-- ==============================================================================
-- VERSO: Supabase Catalog Poems Schema
-- ==============================================================================

-- 1. Create table for public catalog of poems
CREATE TABLE IF NOT EXISTS public.catalog_poems (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  author text NOT NULL,
  text text NOT NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 2. Indexes for instant searching and filtering
CREATE INDEX IF NOT EXISTS idx_catalog_poems_author ON public.catalog_poems (author);
CREATE INDEX IF NOT EXISTS idx_catalog_poems_title ON public.catalog_poems (title);

-- 3. Row Level Security (RLS)
ALTER TABLE public.catalog_poems ENABLE ROW LEVEL SECURITY;

-- Allow public read access to everyone
DROP POLICY IF EXISTS "Allow public read catalog_poems" ON public.catalog_poems;
CREATE POLICY "Allow public read catalog_poems" 
  ON public.catalog_poems 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- (Writing is forbidden for anon; admin/author adds poems via Supabase Table Editor)

-- 4. Initial seed of popular classical poems
INSERT INTO public.catalog_poems (author, title, text, tags) VALUES
('Александр Пушкин', 'Зимнее утро', 'Мороз и солнце; день чудесный!\nЕще ты дремлешь, друг прелестный —\nПора, красавица, проснись:\nОткрой сомкнуты негой взоры\nНавстречу северной Авроры,\nЗвездою севера явись!', ARRAY['зима', 'природа', 'классика']),
('Михаил Лермонтов', 'Парус', 'Белеет парус одинокой\nВ тумане моря голубом!..\nЧто ищет он в стране далекой?\nЧто кинул он в краю родном?..\n\nИграют волны — ветер свищет,\nИ мачта гнется и скрыпит...\nУвы! он счастия не ищет\nИ не от счастия бежит!', ARRAY['школа', 'размышления']),
('Сергей Есенин', 'Берёза', 'Белая берёза\nПод моим окном\nПринакрылась снегом,\nТочно серебром.\n\nНа пушистых ветках\nСнежною каймой\nРаспустились кисти\nБелой бахромой.', ARRAY['школа', 'природа', 'зима']);
