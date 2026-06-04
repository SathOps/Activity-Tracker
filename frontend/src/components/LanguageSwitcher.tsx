import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type LanguageOption = {
  code: 'en' | 'te' | 'hi';
  label: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English (English)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'en')
    .toLowerCase()
    .slice(0, 2) as 'en' | 'te' | 'hi';

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        containerRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const changeLanguage = (languageCode: LanguageOption['code']) => {
    void i18n.changeLanguage(languageCode);
    localStorage.setItem('preferredLanguage', languageCode);
    setIsMenuOpen(false);
  };

  return (
    <div className="language-switcher" ref={containerRef}>
      <button
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label={t('nav.language')}
        className="language-switcher-button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        type="button"
      >
        <span aria-hidden="true" className="language-switcher-globe">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 18, height: 18 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </span>
      </button>

      {isMenuOpen ? (
        <div className="language-switcher-menu" role="menu">
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.code === activeLanguage;

            return (
              <button
                aria-checked={isSelected}
                className="language-switcher-option"
                key={option.code}
                onClick={() => changeLanguage(option.code)}
                role="menuitemradio"
                type="button"
              >
                <span>{option.label}</span>
                <span aria-hidden="true" className="language-switcher-check">
                  {isSelected ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 12, height: 12 }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
