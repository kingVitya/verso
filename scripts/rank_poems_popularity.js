import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const CATALOG_JSON_PATH = path.join(ROOT_DIR, 'russian_poetry', 'catalog_poems.json')
const CATALOG_CSV_PATH = path.join(ROOT_DIR, 'russian_poetry', 'catalog_poems.csv')
const SAMPLE_JSON_PATH = path.join(ROOT_DIR, 'russian_poetry', 'test_sample_10.json')
const SAMPLE_CSV_PATH = path.join(ROOT_DIR, 'russian_poetry', 'test_sample_10.csv')

// Normalization helper for fuzzy title/line matching
function cleanMatchStr(str) {
  return (str || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/gi, '')
}

/**
 * Curated list of undisputed iconic Russian poems (Super-hits: score 900 - 1000).
 * Matches by author keyword + title or opening line.
 */
const SUPER_HITS = [
  // Александр Пушкин
  { author: 'Пушкин', match: 'я помню чудное мгновенье', score: 1000 },
  { author: 'Пушкин', match: 'зимнее утро', score: 1000 },
  { author: 'Пушкин', match: 'мороз и солнце', score: 1000 },
  { author: 'Пушкин', match: 'у лукоморья дуб зеленый', score: 1000 },
  { author: 'Пушкин', match: 'узник', score: 990 },
  { author: 'Пушкин', match: 'сижу за решеткой', score: 990 },
  { author: 'Пушкин', match: 'я вас любил', score: 990 },
  { author: 'Пушкин', match: 'к чаадаеву', score: 980 },
  { author: 'Пушкин', match: 'любви надежды тихой славы', score: 980 },
  { author: 'Пушкин', match: 'пророк', score: 980 },
  { author: 'Пушкин', match: 'духовной жаждою томим', score: 980 },
  { author: 'Пушкин', match: 'зимний вечер', score: 980 },
  { author: 'Пушкин', match: 'буря мглою небо кроет', score: 980 },
  { author: 'Пушкин', match: 'памятник', score: 970 },
  { author: 'Пушкин', match: 'я памятник себе воздвиг', score: 970 },
  { author: 'Пушкин', match: 'няне', score: 970 },
  { author: 'Пушкин', match: 'подруга дней моих суровых', score: 970 },
  { author: 'Пушкин', match: 'бесы', score: 960 },
  { author: 'Пушкин', match: 'мчатся тучи вьются тучи', score: 960 },
  { author: 'Пушкин', match: 'песнь о вещем олеге', score: 960 },
  { author: 'Пушкин', match: 'как ныне сбирается вещий олег', score: 960 },
  { author: 'Пушкин', match: 'туча', score: 950 },
  { author: 'Пушкин', match: 'последняя туча рассеянной бури', score: 950 },
  { author: 'Пушкин', match: 'зимняя дорога', score: 950 },
  { author: 'Пушкин', match: 'сквозь волнистые туманы', score: 950 },
  { author: 'Пушкин', match: 'элегия', score: 940 },
  { author: 'Пушкин', match: 'безумных лет угасшее веселье', score: 940 },
  { author: 'Пушкин', match: '19 октября', score: 940 },
  { author: 'Пушкин', match: 'роняет лес багряный свой убор', score: 940 },
  { author: 'Пушкин', match: 'пора мой друг пора', score: 930 },
  { author: 'Пушкин', match: 'кавказ', score: 920 },
  { author: 'Пушкин', match: 'поэт', score: 920 },
  { author: 'Пушкин', match: 'деревня', score: 920 },

  // Михаил Лермонтов
  { author: 'Лермонтов', match: 'парус', score: 1000 },
  { author: 'Лермонтов', match: 'белеет парус одинокий', score: 1000 },
  { author: 'Лермонтов', match: 'белеет парус одинокой', score: 1000 },
  { author: 'Лермонтов', match: 'бородино', score: 1000 },
  { author: 'Лермонтов', match: 'скажи ка дядя ведь не даром', score: 1000 },
  { author: 'Лермонтов', match: 'смерть поэта', score: 990 },
  { author: 'Лермонтов', match: 'погиб поэт невольник чести', score: 990 },
  { author: 'Лермонтов', match: 'выхожу один я на дорогу', score: 990 },
  { author: 'Лермонтов', match: 'тучи', score: 980 },
  { author: 'Лермонтов', match: 'тучки небесные вечные странники', score: 980 },
  { author: 'Лермонтов', match: 'и скучно и грустно', score: 980 },
  { author: 'Лермонтов', match: 'утес', score: 970 },
  { author: 'Лермонтов', match: 'ночевала тучка золотая', score: 970 },
  { author: 'Лермонтов', match: 'три пальмы', score: 960 },
  { author: 'Лермонтов', match: 'в песчаных степях аравийской земли', score: 960 },
  { author: 'Лермонтов', match: 'дума', score: 960 },
  { author: 'Лермонтов', match: 'печально я гляжу на наше поколенье', score: 960 },
  { author: 'Лермонтов', match: 'молитва', score: 950 },
  { author: 'Лермонтов', match: 'в минуту жизни трудную', score: 950 },
  { author: 'Лермонтов', match: 'когда волнуется желтеющая нива', score: 950 },
  { author: 'Лермонтов', match: 'родина', score: 950 },
  { author: 'Лермонтов', match: 'люблю отчизну я но странною любовью', score: 950 },
  { author: 'Лермонтов', match: 'нет я не байрон я другой', score: 940 },
  { author: 'Лермонтов', match: 'пророк', score: 940 },
  { author: 'Лермонтов', match: 'нищий', score: 930 },
  { author: 'Лермонтов', match: 'мцыри', score: 930 },

  // Сергей Есенин
  { author: 'Есенин', match: 'береза', score: 1000 },
  { author: 'Есенин', match: 'белая береза под моим окном', score: 1000 },
  { author: 'Есенин', match: 'не жалею не зову не плачу', score: 1000 },
  { author: 'Есенин', match: 'письмо к женщине', score: 1000 },
  { author: 'Есенин', match: 'вы помните вы все конечно помните', score: 1000 },
  { author: 'Есенин', match: 'шагане ты моя шагане', score: 990 },
  { author: 'Есенин', match: 'заметался пожар голубой', score: 990 },
  { author: 'Есенин', match: 'собаке качалова', score: 980 },
  { author: 'Есенин', match: 'дай джим на счастье лапу мне', score: 980 },
  { author: 'Есенин', match: 'отговорила роща золотая', score: 980 },
  { author: 'Есенин', match: 'письмо матери', score: 980 },
  { author: 'Есенин', match: 'ты жива еще моя старушка', score: 980 },
  { author: 'Есенин', match: 'гой ты русь моя родная', score: 970 },
  { author: 'Есенин', match: 'черный человек', score: 970 },
  { author: 'Есенин', match: 'мне осталась одна забава', score: 960 },
  { author: 'Есенин', match: 'поет зима аукает', score: 960 },
  { author: 'Есенин', match: 'черемуха', score: 950 },
  { author: 'Есенин', match: 'я покинул родимый дом', score: 950 },
  { author: 'Есенин', match: 'мы теперь уходим понемногу', score: 950 },
  { author: 'Есенин', match: 'хулиган', score: 940 },
  { author: 'Есенин', match: 'пороша', score: 930 },
  { author: 'Есенин', match: 'край любимый сердцу снятся', score: 920 },

  // Александр Блок
  { author: 'Блок', match: 'ночь улица фонарь аптека', score: 1000 },
  { author: 'Блок', match: 'незнакомка', score: 990 },
  { author: 'Блок', match: 'по вечерам над ресторанами', score: 990 },
  { author: 'Блок', match: 'о я хочу безумно жить', score: 980 },
  { author: 'Блок', match: 'россия', score: 970 },
  { author: 'Блок', match: 'опять как в годы золотые', score: 970 },
  { author: 'Блок', match: 'девушка пела в церковном хоре', score: 960 },
  { author: 'Блок', match: 'на поле куликовом', score: 950 },
  { author: 'Блок', match: 'вхожу я в темные храмы', score: 940 },
  { author: 'Блок', match: 'двенадцать', score: 930 },
  { author: 'Блок', match: 'скифы', score: 920 },

  // Федор Тютчев
  { author: 'Тютчев', match: 'весенняя гроза', score: 1000 },
  { author: 'Тютчев', match: 'люблю грозу в начале мая', score: 1000 },
  { author: 'Тютчев', match: 'умом россию не понять', score: 1000 },
  { author: 'Тютчев', match: 'silentium', score: 990 },
  { author: 'Тютчев', match: 'молчи скрывайся и таи', score: 990 },
  { author: 'Тютчев', match: 'есть в осени первоначальной', score: 990 },
  { author: 'Тютчев', match: 'зима недаром злится', score: 980 },
  { author: 'Тютчев', match: 'чародейкою зимою', score: 970 },
  { author: 'Тютчев', match: 'весенние воды', score: 970 },
  { author: 'Тютчев', match: 'еще в полях белеет снег', score: 970 },
  { author: 'Тютчев', match: 'я встретил вас', score: 960 },
  { author: 'Тютчев', match: 'о как убийственно мы любим', score: 960 },
  { author: 'Тютчев', match: 'не то что мните вы природа', score: 940 },
  { author: 'Тютчев', match: 'листья', score: 930 },

  // Афанасий Фет
  { author: 'Фет', match: 'я пришел к тебе с приветом', score: 1000 },
  { author: 'Фет', match: 'шепот робкое дыханье', score: 990 },
  { author: 'Фет', match: 'учись у них у дуба у березы', score: 970 },
  { author: 'Фет', match: 'чудная картина как ты мне родна', score: 970 },
  { author: 'Фет', match: 'мама глянь ка из окошка', score: 960 },
  { author: 'Фет', match: 'сияла ночь луной был полон сад', score: 960 },
  { author: 'Фет', match: 'это утро радость эта', score: 950 },
  { author: 'Фет', match: 'весенний дождь', score: 940 },
  { author: 'Фет', match: 'еще майская ночь', score: 930 },

  // Анна Ахматова
  { author: 'Ахматова', match: 'сжала руки под темной вуалью', score: 990 },
  { author: 'Ахматова', match: 'мужество', score: 990 },
  { author: 'Ахматова', match: 'мы знаем что ныне лежит на весах', score: 990 },
  { author: 'Ахматова', match: 'я научила женщин говорить', score: 980 },
  { author: 'Ахматова', match: 'сероглазый король', score: 970 },
  { author: 'Ахматова', match: 'мне голос был', score: 960 },
  { author: 'Ахматова', match: 'песня последней встречи', score: 960 },
  { author: 'Ахматова', match: 'реквием', score: 950 },
  { author: 'Ахматова', match: 'клятва', score: 940 },
  { author: 'Ахматова', match: 'двадцать первое ночь понедельник', score: 930 },

  // Марина Цветаева
  { author: 'Цветаева', match: 'мне нравится что вы больны не мной', score: 1000 },
  { author: 'Цветаева', match: 'моим стихам написанным так рано', score: 990 },
  { author: 'Цветаева', match: 'красною кистью рябина зажглась', score: 980 },
  { author: 'Цветаева', match: 'вчера еще в глаза глядел', score: 970 },
  { author: 'Цветаева', match: 'тоска по родине давно', score: 960 },
  { author: 'Цветаева', match: 'стихи к блоку', score: 950 },
  { author: 'Цветаева', match: 'имя твое птица в руке', score: 950 },
  { author: 'Цветаева', match: 'бабушке', score: 940 },

  // Владимир Маяковский
  { author: 'Маяковский', match: 'послушайте', score: 1000 },
  { author: 'Маяковский', match: 'ведь если звезды зажигают', score: 1000 },
  { author: 'Маяковский', match: 'лиличка', score: 990 },
  { author: 'Маяковский', match: 'вместо письма', score: 990 },
  { author: 'Маяковский', match: 'а вы могли бы', score: 990 },
  { author: 'Маяковский', match: 'я сразу смазал карту будня', score: 990 },
  { author: 'Маяковский', match: 'хорошее отношение к лошадям', score: 970 },
  { author: 'Маяковский', match: 'облако в штанах', score: 970 },
  { author: 'Маяковский', match: 'необычайное приключение', score: 960 },
  { author: 'Маяковский', match: 'стихи о советском паспорте', score: 950 },
  { author: 'Маяковский', match: 'что такое хорошо и что такое плохо', score: 950 },

  // Борис Пастернак
  { author: 'Пастернак', match: 'зимняя ночь', score: 1000 },
  { author: 'Пастернак', match: 'мело мело по всей земле', score: 1000 },
  { author: 'Пастернак', match: 'февраль достать чернил и плакать', score: 990 },
  { author: 'Пастернак', match: 'во всем мне хочется дойти до самой сути', score: 980 },
  { author: 'Пастернак', match: 'быть знаменитым некрасиво', score: 980 },
  { author: 'Пастернак', match: 'гамлет', score: 970 },
  { author: 'Пастернак', match: 'гул затих я вышел на подмостки', score: 970 },
  { author: 'Пастернак', match: 'любить иных тяжелый крест', score: 960 },
  { author: 'Пастернак', match: 'золотая осень', score: 950 },

  // Иосиф Бродский
  { author: 'Бродский', match: 'не выходи из комнаты', score: 1000 },
  { author: 'Бродский', match: 'не совершай ошибку', score: 1000 },
  { author: 'Бродский', match: 'ниоткуда с любовью', score: 980 },
  { author: 'Бродский', match: 'я входил вместо дикого зверя в клетку', score: 970 },
  { author: 'Бродский', match: 'письма римскому другу', score: 970 },
  { author: 'Бродский', match: 'пилигримы', score: 960 },
  { author: 'Бродский', match: 'рождественский романс', score: 950 },
  { author: 'Бродский', match: 'одиночество', score: 940 },

  // Константин Симонов
  { author: 'Симонов', match: 'жди меня и я вернусь', score: 1000 },
  { author: 'Симонов', match: 'жди меня', score: 1000 },
  { author: 'Симонов', match: 'ты помнишь алеша дороги смоленщины', score: 980 },
  { author: 'Симонов', match: 'майор привез мальчишку на лафете', score: 960 },

  // Владимир Высоцкий
  { author: 'Высоцкий', match: 'песня о друге', score: 1000 },
  { author: 'Высоцкий', match: 'если друг оказался вдруг', score: 1000 },
  { author: 'Высоцкий', match: 'кони привередливые', score: 990 },
  { author: 'Высоцкий', match: 'я не люблю', score: 990 },
  { author: 'Высоцкий', match: 'охота на волков', score: 980 },
  { author: 'Высоцкий', match: 'он не вернулся из боя', score: 980 },
  { author: 'Высоцкий', match: 'баллада о детстве', score: 970 },
  { author: 'Высоцкий', match: 'баллада о любви', score: 970 },
  { author: 'Высоцкий', match: 'вершина', score: 960 },
  { author: 'Высоцкий', match: 'здесь вам не равнина', score: 960 },
  { author: 'Высоцкий', match: 'парус', score: 950 },

  // Осип Мандельштам
  { author: 'Мандельштам', match: 'бессонница гомер тугие паруса', score: 980 },
  { author: 'Мандельштам', match: 'бессоница гомер', score: 980 },
  { author: 'Мандельштам', match: 'я вернулся в мой город', score: 980 },
  { author: 'Мандельштам', match: 'ленинград', score: 980 },
  { author: 'Мандельштам', match: 'мы живем под собою не чуя страны', score: 970 },
  { author: 'Мандельштам', match: 'за гремучую доблесть грядущих веков', score: 960 },

  // Николай Некрасов
  { author: 'Некрасов', match: 'железная дорога', score: 980 },
  { author: 'Некрасов', match: 'мужичок с ноготок', score: 980 },
  { author: 'Некрасов', match: 'однажды в студеную зимнюю пору', score: 980 },
  { author: 'Некрасов', match: 'дедушка мазай и зайцы', score: 980 },
  { author: 'Некрасов', match: 'размышления у парадного подъезда', score: 970 },
  { author: 'Некрасов', match: 'поэт и гражданин', score: 970 },
  { author: 'Некрасов', match: 'есть женщины в русских селеньях', score: 970 },
  { author: 'Некрасов', match: 'мороз красный нос', score: 960 },
  { author: 'Некрасов', match: 'вчерашний день часу в шестом', score: 950 },

  // Иван Крылов
  { author: 'Крылов', match: 'ворона и лисица', score: 980 },
  { author: 'Крылов', match: 'стрекоза и муравей', score: 980 },
  { author: 'Крылов', match: 'лебедь щука и рак', score: 980 },
  { author: 'Крылов', match: 'мартышка и очки', score: 970 },
  { author: 'Крылов', match: 'квартет', score: 970 },
  { author: 'Крылов', match: 'слон и моська', score: 970 },

  // Корней Чуковский
  { author: 'Чуковский', match: 'муха цокотуха', score: 980 },
  { author: 'Чуковский', match: 'мойдодыр', score: 980 },
  { author: 'Чуковский', match: 'телефон', score: 980 },
  { author: 'Чуковский', match: 'тараканище', score: 970 },
  { author: 'Чуковский', match: 'айболит', score: 970 },
  { author: 'Чуковский', match: 'федорино горе', score: 970 },

  // Агния Барто
  { author: 'Барто', match: 'бычок', score: 980 },
  { author: 'Барто', match: 'идет бычок качается', score: 980 },
  { author: 'Барто', match: 'мячик', score: 980 },
  { author: 'Барто', match: 'наша таня громко плачет', score: 980 },
  { author: 'Барто', match: 'зайка', score: 980 },
  { author: 'Барто', match: 'зайку бросила хозяйка', score: 980 },
  { author: 'Барто', match: 'мишка', score: 970 },
  { author: 'Барто', match: 'уронили мишку на пол', score: 970 },
  { author: 'Барто', match: 'козленок', score: 960 },
  { author: 'Барто', match: 'веревочка', score: 950 },

  // Самуил Маршак
  { author: 'Маршак', match: 'вот какой рассеянный', score: 980 },
  { author: 'Маршак', match: 'где обедал воробей', score: 970 },
  { author: 'Маршак', match: 'багаж', score: 970 },
  { author: 'Маршак', match: 'тихая сказка', score: 950 },

  // Эдуард Асадов
  { author: 'Асадов', match: 'я могу тебя очень ждать', score: 980 },
  { author: 'Асадов', match: 'как много тех с кем можно лечь в постель', score: 980 },
  { author: 'Асадов', match: 'стихи о рыжей дворняге', score: 970 },
  { author: 'Асадов', match: 'баллада о рыжей дворняге', score: 970 },
  { author: 'Асадов', match: 'трусиха', score: 960 },

  // Николай Заболоцкий
  { author: 'Заболоцкий', match: 'не позволяй душе лениться', score: 990 },
  { author: 'Заболоцкий', match: 'признание', score: 980 },
  { author: 'Заболоцкий', match: 'зацелована околдована', score: 980 },
  { author: 'Заболоцкий', match: 'о красоте человеческих лиц', score: 970 },
  { author: 'Заболоцкий', match: 'некрасивая девочка', score: 970 },

  // Роберт Рождественский
  { author: 'Рождественский', match: 'человеку надо мало', score: 980 },
  { author: 'Рождественский', match: 'все начинается с любви', score: 980 },
  { author: 'Рождественский', match: 'мгновения', score: 970 },
  { author: 'Рождественский', match: 'баллада о зенитчицах', score: 970 },

  // Евгений Евтушенко
  { author: 'Евтушенко', match: 'людей неинтересных в мире нет', score: 980 },
  { author: 'Евтушенко', match: 'хотят ли русские войны', score: 970 },
  { author: 'Евтушенко', match: 'дай бог', score: 970 },
  { author: 'Евтушенко', match: 'со мною вот что происходит', score: 960 },

  // Булат Окуджава
  { author: 'Окуджава', match: 'до свидания мальчики', score: 970 },
  { author: 'Окуджава', match: 'надежды маленький оркестрик', score: 960 },
  { author: 'Окуджава', match: 'песенка о синем троллейбусе', score: 960 },
  { author: 'Окуджава', match: 'ваше благородие госпожа удача', score: 960 },
]

// Author Tier base weights
const AUTHOR_TIERS = {
  // Tier 1: Pillars of classical poetry
  tier1: {
    authors: [
      'александр пушкин', 'михаил лермонтов', 'сергей есенин', 
      'александр блок', 'анна ахматова', 'марина цветаева', 
      'федор тютчев', 'афанасий фет', 'владимир маяковский', 
      'борис пастернак', 'иосиф бродский', 'владимир высоцкий'
    ],
    baseScore: 650,
  },
  // Tier 2: Major celebrated poets
  tier2: {
    authors: [
      'николай некрасов', 'осип мандельштам', 'николай заболоцкий', 
      'эдуард асадов', 'константин симонов', 'роберт рождественский', 
      'евгений евтушенко', 'булат окуджава', 'агния барто', 
      'самуил маршак', 'корней чуковский', 'иван крылов',
      'иван бунин', 'николай гумилев'
    ],
    baseScore: 500,
  },
  // Tier 3: Well-known classic poets
  tier3: {
    authors: [
      'константин бальмонт', 'василий жуковский', 'аполлон майков', 
      'алексей толстой', 'алексей к. толстой', 'максимилиан волошин', 
      'иннокентий анненский', 'владислав ходасевич', 'андрей белый', 
      'игорь северянин', 'михаил кузмин', 'арсений тарковский', 
      'давид самойлов', 'николай рубцов', 'белла ахмадулина', 
      'юрий левитанский', 'александр твардовский', 'алексей плещеев', 
      'иван суриков', 'иван никитин', 'федор сологуб', 'валерий брюсов'
    ],
    baseScore: 350,
  },
}

function calculatePoemPopularity(poem) {
  const authorNorm = cleanMatchStr(poem.author)
  const titleNorm = cleanMatchStr(poem.title)
  const firstLineNorm = cleanMatchStr((poem.text || '').split('\n')[0])

  // 1. Check Super-Hits with high-precision criteria
  for (const hit of SUPER_HITS) {
    const hitAuthor = cleanMatchStr(hit.author)
    if (authorNorm.includes(hitAuthor)) {
      const matchNorm = cleanMatchStr(hit.match)
      if (!matchNorm || matchNorm.length < 3) continue

      // A: Exact title match
      if (titleNorm === matchNorm) {
        return hit.score
      }

      // B: Title contains full match phrase (only if match is specific, >= 5 chars)
      if (matchNorm.length >= 5 && titleNorm.includes(matchNorm)) {
        return hit.score
      }

      // C: Match begins with title or vice versa, but title must be meaningful length (>= 5 chars)
      if (titleNorm.length >= 5 && matchNorm.startsWith(titleNorm)) {
        return hit.score
      }

      // D: First line contains match phrase (must be at least 7 chars to avoid false positives)
      if (matchNorm.length >= 7 && (firstLineNorm.startsWith(matchNorm) || firstLineNorm.includes(matchNorm))) {
        return hit.score
      }
    }
  }

  // 2. Author Tier base score
  let score = 100 // default base for minor authors

  if (AUTHOR_TIERS.tier1.authors.some(a => authorNorm.includes(cleanMatchStr(a)))) {
    score = AUTHOR_TIERS.tier1.baseScore
  } else if (AUTHOR_TIERS.tier2.authors.some(a => authorNorm.includes(cleanMatchStr(a)))) {
    score = AUTHOR_TIERS.tier2.baseScore
  } else if (AUTHOR_TIERS.tier3.authors.some(a => authorNorm.includes(cleanMatchStr(a)))) {
    score = AUTHOR_TIERS.tier3.baseScore
  }

  // 3. Modifiers
  // Bonus if the poem has curated tags (+30)
  if (Array.isArray(poem.tags) && poem.tags.length > 0) {
    score += Math.min(60, poem.tags.length * 30)
  }

  // Bonus if title is NOT generic first-line placeholder (i.e. has a real dedicated title)
  if (poem.title && !poem.title.endsWith('...') && !poem.title.endsWith('…')) {
    score += 20
  }

  // Cap between 10 and 880 for non-superhits
  return Math.min(880, Math.max(10, score))
}

function processCatalog() {
  console.log('Reading:', CATALOG_JSON_PATH)
  const raw = fs.readFileSync(CATALOG_JSON_PATH, 'utf8')
  const poems = JSON.parse(raw)
  console.log(`Loaded ${poems.length} poems. Calculating popularity...`)

  let superHitsCount = 0
  const scored = poems.map(p => {
    const popularity = calculatePoemPopularity(p)
    if (popularity >= 900) {
      superHitsCount++
    }
    return {
      ...p,
      popularity,
    }
  })

  console.log(`Scored ${scored.length} poems. Super-hits identified: ${superHitsCount}`)

  // Sort by popularity DESC, then author ASC, then title ASC
  scored.sort((a, b) => {
    if (b.popularity !== a.popularity) {
      return b.popularity - a.popularity
    }
    const cmpAuthor = (a.author || '').localeCompare(b.author || '', 'ru')
    if (cmpAuthor !== 0) return cmpAuthor
    return (a.title || '').localeCompare(b.title || '', 'ru')
  })

  console.log('\nTop 15 poems in new sorted catalog:')
  scored.slice(0, 15).forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.popularity}] ${p.author} — «${p.title}»`)
  })

  // Write updated JSON
  console.log('\nSaving sorted JSON to:', CATALOG_JSON_PATH)
  fs.writeFileSync(CATALOG_JSON_PATH, JSON.stringify(scored, null, 2), 'utf8')

  // Generate updated CSV
  console.log('Generating CSV to:', CATALOG_CSV_PATH)
  const csvHeaders = ['title', 'author', 'text', 'tags', 'popularity']
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""'
    const s = String(val).replace(/"/g, '""')
    return `"${s}"`
  }

  const csvLines = [csvHeaders.join(',')]
  for (const p of scored) {
    const tagsStr = Array.isArray(p.tags) ? `{${p.tags.join(',')}}` : '{}'
    const row = [
      escapeCsv(p.title),
      escapeCsv(p.author),
      escapeCsv(p.text),
      escapeCsv(tagsStr),
      p.popularity,
    ]
    csvLines.push(row.join(','))
  }
  fs.writeFileSync(CATALOG_CSV_PATH, csvLines.join('\n'), 'utf8')

  // Also update sample files
  if (fs.existsSync(SAMPLE_JSON_PATH)) {
    const sampleRaw = fs.readFileSync(SAMPLE_JSON_PATH, 'utf8')
    const samplePoems = JSON.parse(sampleRaw)
    const sampleScored = samplePoems.map(p => ({
      ...p,
      popularity: calculatePoemPopularity(p),
    }))
    sampleScored.sort((a, b) => b.popularity - a.popularity)
    fs.writeFileSync(SAMPLE_JSON_PATH, JSON.stringify(sampleScored, null, 2), 'utf8')

    const sampleCsvLines = [csvHeaders.join(',')]
    for (const p of sampleScored) {
      const tagsStr = Array.isArray(p.tags) ? `{${p.tags.join(',')}}` : '{}'
      sampleCsvLines.push([
        escapeCsv(p.title),
        escapeCsv(p.author),
        escapeCsv(p.text),
        escapeCsv(tagsStr),
        p.popularity,
      ].join(','))
    }
    fs.writeFileSync(SAMPLE_CSV_PATH, sampleCsvLines.join('\n'), 'utf8')
    console.log('Sample files updated.')
  }

  console.log('Done! All datasets ranked and sorted by popularity.')
}

processCatalog()
