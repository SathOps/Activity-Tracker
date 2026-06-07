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
              rounded-full border border-transparent
              text-[11px] font-bold cursor-pointer whitespace-nowrap
              bg-slate-500/[0.06] text-slate-500
              hover:bg-slate-500/[0.12] hover:text-slate-850 hover:scale-[1.04]
              dark:bg-white/[0.07] dark:text-white/55
              dark:hover:bg-white/[0.13] dark:hover:text-white/85
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
          bg-blue-500/10 text-blue-700 border border-blue-500/35 shadow-sm shadow-blue-500/10
          dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/25 dark:shadow-none
          hover:bg-blue-500/20 dark:hover:bg-blue-400/20 hover:scale-[1.02]
          transition-all duration-200
        "
      >
        {activeLanguage.toUpperCase()}
      </button>
    </div>
  );
}
