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
  popularity integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. Indexes for instant searching, filtering, and popularity sorting
CREATE INDEX IF NOT EXISTS idx_catalog_poems_author ON public.catalog_poems (author);
CREATE INDEX IF NOT EXISTS idx_catalog_poems_title ON public.catalog_poems (title);
CREATE INDEX IF NOT EXISTS idx_catalog_poems_popularity ON public.catalog_poems (popularity DESC);

-- NOTE: If your table already exists, run this single migration line in Supabase SQL Editor:
-- ALTER TABLE public.catalog_poems ADD COLUMN IF NOT EXISTS popularity integer DEFAULT 0;
-- CREATE INDEX IF NOT EXISTS idx_catalog_poems_popularity ON public.catalog_poems (popularity DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.catalog_poems ENABLE ROW LEVEL SECURITY;

-- Allow public read access to everyone
DROP POLICY IF EXISTS "Allow public read catalog_poems" ON public.catalog_poems;
CREATE POLICY "Allow public read catalog_poems" 
  ON public.catalog_poems 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- (Writing is forbidden for anon; admin/author adds poems via Supabase Table Editor or batch scripts)

-- 4. Initial seed of popular classical poems
INSERT INTO public.catalog_poems (author, title, text, tags, popularity) VALUES
('Александр Пушкин', 'Зимнее утро', 'Мороз и солнце; день чудесный!\nЕще ты дремлешь, друг прелестный —\nПора, красавица, проснись:\nОткрой сомкнуты негой взоры\nНавстречу северной Авроры,\nЗвездою севера явись!', ARRAY['зима', 'природа', 'классика'], 1000),
('Михаил Лермонтов', 'Парус', 'Белеет парус одинокой\nВ тумане моря голубом!..\nЧто ищет он в стране далекой?\nЧто кинул он в краю родном?..\n\nИграют волны — ветер свищет,\nИ мачта гнется и скрыпит...\nУвы! он счастия не ищет\nИ не от счастия бежит!', ARRAY['школа', 'размышления'], 1000),
('Сергей Есенин', 'Берёза', 'Белая берёза\nПод моим окном\nПринакрылась снегом,\nТочно серебром.\n\nНа пушистых ветках\nСнежною каймой\nРаспустились кисти\nБелой бахромой.', ARRAY['школа', 'природа', 'зима'], 1000),
('Александр Грибоедов', 'А судьи кто? (Монолог Чацкого)', 'А судьи кто? — За древностию лет\nК свободной жизни их вражда непримирима,\nСужденья черпают из забытых газет\nВремен Очаковских и покоренья Крыма;\nВсегда готовые к журьбе,\nПоют всё песнь одну и ту же,\nНе замечая об себе:\nЧто старее, то хуже.\n\nГде? укажите нам, отечества отцы,\nКоторых мы должны принять за образцы?\nНе эти ли, грабительством богаты?\nЗащиту от суда в друзьях нашли, в родстве,\nВеликолепные соорудя палаты,\nГде разливаются в пирах и мотовстве,\nИ где не воскресят клиенты-иностранцы\nПрошедшего житья подлейшие черты.\nДа и кому в Москве не зажимали рты\nОбеды, ужины и танцы?\n\nНе тот ли вы, к кому меня еще с пелён,\nДля замыслов каких-то непонятных,\nДитёй возили на поклон?\nТот Нестор негодяев знатных,\nТолпою окруженный слуг;\nУсердствуя, они в часы вина и драки\nИ честь и жизнь его не раз спасали: вдруг\nНа них он выменил борзые три собаки!!!\n\nИли вон тот еще, который для затей\nНа крепостной балет согнал на многих фурах\nОт матерей, отцов отторженных детей?!\nСам погружен умом в Зефирах и в Амурах,\nЗаставил всю Москву дивиться их красе!\nНо должников не согласил к отсрочке:\nАмуры и Зефиры все\nРаспроданы поодиночке!!\n\nВот те, которые дожили до седин!\nВот уважать кого должны мы на безлюдьи!\nВот наши строгие ценители и судьи!\nТеперь пускай из нас один,\nИз молодых людей, найдется — враг исканий,\nНе требуя ни мест, ни повышенья в чин,\nВ науки он вперит ум, алчущий познаний;\nК искусствам творческим, высоким и прекрасным,\nОни тотчас: разбой! пожар!\nИ прослывет у них мечтателем! опасным!!—\n\nМундир! один мундир! Он в прежнем их быту\nКогда-то укрывал, расшитый и красивый,\nИх слабодушие, рассудка нищету;\nИ нам за ними в путь счастливый!\nИ в женах, дочерях — к мундиру та же страсть!\nЯ сам к нему давно ль от нежности отрекся?!\nТеперь уж в это мне ребячество не впасть;\nНо кто б тогда за всеми не повлекся?\nКогда из гвардии, иные от двора\nСюда на время приезжали, —\nКричали женщины: ура!\nИ в воздух чепчики бросали!', ARRAY['школа', 'классика', 'монолог'], 1000);

