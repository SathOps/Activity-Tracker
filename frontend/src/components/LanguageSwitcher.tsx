import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'en')
    .toLowerCase()
    .slice(0, 2) as 'en' | 'te' | 'hi';

  const changeLanguage = (code: 'en' | 'te' | 'hi') => {
    void i18n.changeLanguage(code);
    localStorage.setItem('preferredLanguage', code);
  };

  return (
    <div className="language-slider-container" role="radiogroup" aria-label="Select Language">
      {/* Sliding active background indicator */}
      <div
        className="language-slider-indicator"
        style={{
          transform: `translateX(${
            activeLanguage === 'en' ? '0%' : activeLanguage === 'te' ? '100%' : '200%'
          })`,
        }}
      />
      <button
        type="button"
        role="radio"
        aria-checked={activeLanguage === 'en'}
        onClick={() => changeLanguage('en')}
        className={`language-slider-btn ${activeLanguage === 'en' ? 'active' : ''}`}
      >
        EN
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={activeLanguage === 'te'}
        onClick={() => changeLanguage('te')}
        className={`language-slider-btn ${activeLanguage === 'te' ? 'active' : ''}`}
      >
        TE
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={activeLanguage === 'hi'}
        onClick={() => changeLanguage('hi')}
        className={`language-slider-btn ${activeLanguage === 'hi' ? 'active' : ''}`}
      >
        HI
      </button>
    </div>
  );
}
