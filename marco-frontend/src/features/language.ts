// Language/i18n module
import { translations } from '../config/translations.js';
import { StorageService, Language } from '../services/storage.js';

export { Language } from '../services/storage.js';

export class LanguageManager {
  static getLang(): Language {
    return StorageService.getLang();
  }

  static setLang(lang: Language, renderCallback: () => void): void {
    // Persist language
    StorageService.setLangStorage(lang);
    // Apply translations in-place to update elements marked with data-i18n
    this.applyTranslations(lang);

    // Decide whether to perform a full re-render. Full re-render will replace DOM
    // nodes and may wipe async-loaded content (profile avatar, match history, etc.).
    // For routes that display user-specific dynamic content we avoid re-rendering.
    try {
      const route = window.location.hash.replace('#', '').split('?')[0];
      const preserveRoutes = new Set(['profile', 'edit-profile']);
      if (!preserveRoutes.has(route)) {
        // Most pages: call render callback to re-generate templates (ensures all
        // strings produced by route functions are translated).
        renderCallback();
      }
    } catch (err) {
      // If anything goes wrong, fall back to calling the render callback so the
      // UI updates (safer default for unknown contexts).
      try { renderCallback(); } catch (e) { /* swallow */ }
    }
  }

  /**
   * Update visible texts in-place using `data-i18n` attributes.
   * Elements can have:
   * - data-i18n="some.nested.key" -> sets textContent to that translation
   * - data-i18n-attr="attr:key,attr2:key2" -> sets attributes (e.g. placeholder:title.label)
   */
  static applyTranslations(lang: Language): void {
    const t = translations[lang] as any;

    const getNested = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : null, obj);
    };

    // textContent replacements
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      try {
        const key = el.getAttribute('data-i18n') as string;
        const val = getNested(t, key);
        if (val !== null && val !== undefined) {
          // Preserve existing HTML structure for elements that are not plain text
          if (el.childElementCount === 0) {
            el.textContent = String(val);
          } else {
            // If element has children, replace only text nodes directly under it
            for (const node of Array.from(el.childNodes)) {
              if (node.nodeType === Node.TEXT_NODE) {
                node.textContent = String(val);
              }
            }
          }
        }
      } catch (err) {
        // ignore per-element errors
        // console.warn('i18n text apply error', err);
      }
    });

    // attribute replacements (placeholder, title, value, aria-label, etc.)
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      try {
        const spec = el.getAttribute('data-i18n-attr') as string; // e.g. "placeholder:login.placeholder, title:login.title"
        const parts = spec.split(',').map(s => s.trim()).filter(Boolean);
        for (const p of parts) {
          const [attr, key] = p.split(':').map(s => s.trim());
          if (!attr || !key) continue;
          const val = getNested(t, key);
          if (val !== null && val !== undefined) {
            (el as HTMLElement).setAttribute(attr, String(val));
            // special-case for inputs where placeholder/value should also update the element's property
            if (attr === 'placeholder' && (el as HTMLInputElement).placeholder !== undefined) {
              (el as HTMLInputElement).placeholder = String(val);
            }
            if (attr === 'value' && (el as HTMLInputElement).value !== undefined) {
              (el as HTMLInputElement).value = String(val);
            }
          }
        }
      } catch (err) {
        // ignore
      }
    });
  }

  static langSwitcherUI(currentLang: Language): string {
    return `<div class='fixed top-4 left-4 z-50'>
      <label for='lang-select' class='mr-2' data-i18n='langLabel'>${translations[currentLang].langLabel}:</label>
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