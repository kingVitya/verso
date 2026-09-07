import { useState } from 'react'
import { 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  Sliders, 
  Palette, 
  Clock, 
  Hand
} from 'lucide-react'
import clsx from 'clsx'

export default function ProfileView({ 
  theme, 
  setTheme, 
  poemsCount = 0,
  sliderStep = 5,
  setSliderStep = () => {},
  revealDuration = 5,
  setRevealDuration = () => {}
}) {
  const [isThemeOpen, setIsThemeOpen] = useState(false)

  const themeOptions = [
    {
      id: 'light',
      title: 'Светлая',
      badge: 'Светлая',
      description: 'Чистый светлый фон для дневного чтения',
      icon: Sun,
    },
    {
      id: 'dark',
      title: 'Тёмная',
      badge: 'Тёмная',
      description: 'Глубокий тёмный фон для комфорта глаз',
      icon: Moon,
    },
    {
      id: 'system',
      title: 'Как в системе',
      badge: 'Системная',
      description: 'Автоматическая смена по настройкам устройства',
      icon: Monitor,
    },
  ]

  const activeThemeObj = themeOptions.find(o => o.id === theme) || themeOptions[2]
  const ActiveThemeIcon = activeThemeObj.icon

  const presetSteps = [1, 5, 10, 20, 25, 50]
  const durationPresets = [2, 3, 5, 10]

  const handleStepChange = (val) => {
    const num = parseInt(val, 10)
    if (!isNaN(num)) {
      setSliderStep(Math.min(100, Math.max(1, num)))
    }
  }

  const handleDurationChange = (val) => {
    const num = parseInt(val, 10)
    if (!isNaN(num)) {
      setRevealDuration(Math.min(30, Math.max(1, num)))
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Profile Header */}
      <div className="flex items-center gap-3.5 p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-serif text-xl font-bold shrink-0">
          V
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            Профиль
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">
            Настройки приложения и тренировок
          </p>
        </div>
      </div>

      {/* Settings Group */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase px-1">
          Настройки интерфейса
        </h3>

        {/* 1. Theme Expandable Plate ("Плашка выбора темы") */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden transition-all">
          <button
            id="theme-toggle-plate"
            type="button"
            onClick={() => setIsThemeOpen(prev => !prev)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer hover:bg-zinc-50/75 dark:hover:bg-zinc-800/40 transition-colors select-none"
          >
            <div className="flex items-center gap-3 min-w-0 mr-2">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                  Тема оформления
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:block truncate">
                  {activeThemeObj.description}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700/70">
                <ActiveThemeIcon className="w-3.5 h-3.5" />
                <span>{activeThemeObj.badge}</span>
              </span>
              <ChevronDown className={clsx(
                "w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200",
                isThemeOpen && "rotate-180"
              )} />
            </div>
          </button>

          {/* Theme Dropdown Options */}
          {isThemeOpen && (
            <div className="p-2.5 sm:p-3 pt-0 border-t border-zinc-100 dark:border-zinc-800/70 flex flex-col gap-1.5 animate-in fade-in duration-200">
              {themeOptions.map((opt) => {
                const Icon = opt.icon
                const isSelected = theme === opt.id

                return (
                  <button
                    key={opt.id}
                    id={`theme-${opt.id}`}
                    type="button"
                    onClick={() => {
                      setTheme(opt.id)
                      setIsThemeOpen(false)
                    }}
                    className={clsx(
                      "flex items-center justify-between p-3 rounded-xl sm:rounded-2xl text-left transition-all cursor-pointer",
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium shadow-sm"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={clsx(
                        "p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0",
                        isSelected
                          ? "bg-white/15 dark:bg-zinc-900/10 text-white dark:text-zinc-900"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold">{opt.title}</span>
                        <span className={clsx(
                          "text-xs truncate",
                          isSelected ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400 dark:text-zinc-500"
                        )}>
                          {opt.description}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 stroke-[2.5] shrink-0 ml-2" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 2. Word Reveal Duration Plate ("Время показа слова") */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 mr-2">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                  Время показа слова
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                  {revealDuration === 0 ? 'Исчезает по повторному тапу' : `Автоскрытие через ${revealDuration} сек`}
                </span>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shrink-0 font-mono">
              {revealDuration === 0 ? 'По тапу' : `${revealDuration} с`}
            </div>
          </div>

          {/* Quick presets row */}
          <div className="grid grid-cols-4 gap-1.5 w-full">
            {durationPresets.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => setRevealDuration(dur)}
                className={clsx(
                  "py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 text-center",
                  revealDuration === dur
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {dur} сек
              </button>
            ))}
          </div>

          {/* Tap-to-hide button */}
          <button
            type="button"
            onClick={() => setRevealDuration(0)}
            className={clsx(
              "w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 border",
              revealDuration === 0
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-sm"
                : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>По тапу (показывается пока не нажмёте снова)</span>
          </button>

          {/* Stepper (when timer mode is active) */}
          {revealDuration > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/70">
              <button
                type="button"
                onClick={() => handleDurationChange(revealDuration - 1)}
                className="w-10 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold flex items-center justify-center transition-colors active:scale-95 cursor-pointer select-none text-sm"
              >
                -1с
              </button>

              <div className="flex-1 text-center font-mono font-semibold text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/60 py-2 rounded-xl border border-zinc-200/70 dark:border-zinc-700/70">
                {revealDuration} секунд
              </div>

              <button
                type="button"
                onClick={() => handleDurationChange(revealDuration + 1)}
                className="w-10 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold flex items-center justify-center transition-colors active:scale-95 cursor-pointer select-none text-sm"
              >
                +1с
              </button>
            </div>
          )}
        </div>

        {/* 3. Slider Step Configuration Plate ("Шаг кнопок скрытия") */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 mr-2">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0">
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                  Шаг кнопок скрытия
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                  Шаг изменения кнопок -/+ у ползунка
                </span>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shrink-0 font-mono">
              ±{sliderStep}%
            </div>
          </div>

          {/* Preset buttons grid - 6 columns on mobile */}
          <div className="grid grid-cols-6 gap-1.5 w-full">
            {presetSteps.map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setSliderStep(step)}
                className={clsx(
                  "py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 text-center",
                  sliderStep === step
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {step}%
              </button>
            ))}
          </div>

          {/* Stepper with custom input */}
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/70">
            <button
              type="button"
              onClick={() => handleStepChange(sliderStep - 1)}
              className="w-10 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold flex items-center justify-center transition-colors active:scale-95 cursor-pointer select-none text-sm"
            >
              -1%
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                id="slider-step-input"
                type="number"
                min="1"
                max="100"
                value={sliderStep}
                onChange={(e) => handleStepChange(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-center text-zinc-900 dark:text-zinc-100 font-semibold font-mono text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none transition-all"
              />
              <span className="absolute right-3 text-xs font-semibold text-zinc-400 pointer-events-none">%</span>
            </div>

            <button
              type="button"
              onClick={() => handleStepChange(sliderStep + 1)}
              className="w-10 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold flex items-center justify-center transition-colors active:scale-95 cursor-pointer select-none text-sm"
            >
              +1%
            </button>
          </div>
        </div>
      </div>

      {/* Library Stats Section */}
      <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Сохранено стихов
            </div>
            <div className="text-xs text-zinc-400 dark:text-zinc-500">
              Доступны офлайн в памяти браузера
            </div>
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
          {poemsCount}
        </div>
      </div>

      {/* Tips / Info Section */}
      <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl sm:rounded-3xl flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">
          <Sparkles className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>Умное заучивание</span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {revealDuration === 0 
            ? 'Скрытые слова открываются по тапу и остаются видимыми, пока вы не нажмёте на них снова.' 
            : `Скрытые слова открываются на ${revealDuration} сек с плавно уменьшающейся полосой таймера снизу слова.`}
        </p>
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-400 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Все тексты и настройки сохраняются локально на телефоне</span>
        </div>
      </div>
    </div>
  )
}
