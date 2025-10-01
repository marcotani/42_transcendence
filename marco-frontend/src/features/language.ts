// Language/i18n module
import { translations } from '../config/translations.js';
import { StorageService, Language } from '../services/storage.js';

export { Language } from '../services/storage.js';

export class LanguageManager {
  static getLang(): Language {
    return StorageService.getLang();
  }

  static setLang(lang: Language, renderCallback: () => void): void {
    StorageService.setLangStorage(lang);
    renderCallback();
  }

  static langSwitcherUI(currentLang: Language): string {
    return `<div class='fixed top-4 left-4 z-50'>
      <label for='lang-select' class='mr-2'>${translations[currentLang].langLabel}:</label>
      <select id='lang-select' class='px-2 py-1 rounded bg-gray-800 text-white border border-gray-600'>
        <option value='en' ${currentLang === 'en' ? 'selected' : ''}>English</option>
        <option value='it' ${currentLang === 'it' ? 'selected' : ''}>Italiano</option>
        <option value='fr' ${currentLang === 'fr' ? 'selected' : ''}>Français</option>
      </select>
    </div>`;
  }

  static attachLangListener(renderCallback: () => void): void {
    document.getElementById('lang-select')?.addEventListener('change', (e) => {
      const lang = (e.target as HTMLSelectElement).value as Language;
      this.setLang(lang, renderCallback);
    });
  }
}