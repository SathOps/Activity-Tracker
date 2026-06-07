import { useTranslation } from 'react-i18next';

const LANGS = ['en', 'te', 'hi'] as const;
type LangCode = (typeof LANGS)[number];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'en')
    .toLowerCase()
    .slice(0, 2) as LangCode;

  const changeLanguage = (code: LangCode) => {
    void i18n.changeLanguage(code);
    localStorage.setItem('preferredLanguage', code);
  };

  // Inactive langs in order (they will appear to the left of the active one)
  const inactiveLangs = LANGS.filter((l) => l !== activeLanguage);

  return (
    <div
      className="group flex flex-row items-center gap-1 h-9 relative"
      role="radiogroup"
      aria-label="Select Language"
    >
      {/* Inactive pills — hidden by default, slide in from left on hover */}
      <div
        className="
          flex flex-row gap-1 overflow-hidden
          max-w-0 opacity-0
          group-hover:max-w-[100px] group-hover:opacity-100
          focus-within:max-w-[100px] focus-within:opacity-100
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        "
      >
        {inactiveLangs.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => changeLanguage(code)}
            className="
              h-9 min-w-[42px] px-2.5
              rounded-full border border-slate-200/50 dark:border-transparent
              text-[11px] font-bold cursor-pointer whitespace-nowrap
              bg-slate-100 text-slate-650 hover:bg-slate-200/80 hover:text-slate-800
              dark:bg-white/[0.07] dark:text-white/55 dark:hover:bg-white/[0.13] dark:hover:text-white/85 dark:hover:scale-[1.04]
              transition-all duration-200
            "
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Active language — always visible, royal blue highlight */}
      <button
        type="button"
        aria-pressed={true}
        onClick={() => changeLanguage(activeLanguage)}
        aria-label={`Current language: ${activeLanguage.toUpperCase()}`}
        className="
          h-9 min-w-[42px] px-2.5
          rounded-full
          text-[11px] font-bold cursor-pointer whitespace-nowrap
          bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-500/20 shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)]
          dark:bg-[rgba(65,120,255,0.25)] dark:text-[#7eb8ff] dark:border dark:border-[rgba(65,120,255,0.4)] dark:shadow-[0_0_10px_rgba(65,120,255,0.15)] dark:hover:bg-[rgba(65,120,255,0.35)] dark:hover:text-[#a8d0ff]
          transition-all duration-200
        "
      >
        {activeLanguage.toUpperCase()}
      </button>
    </div>
  );
}
