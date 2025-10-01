// Local storage service for app data

export type Language = 'en' | 'it' | 'fr';

export class StorageService {
  // Language management
  static getLang(): Language {
    const lang = localStorage.getItem('lang');
    if (lang === 'it' || lang === 'fr') return lang;
    return 'en';
  }

  static setLangStorage(lang: Language): void {
    localStorage.setItem('lang', lang);
  }

  // User session management
  static getLoggedInUser(): string | null {
    return localStorage.getItem('loggedInUser');
  }

  static setLoggedInUser(username: string | null): void {
    if (username) {
      localStorage.setItem('loggedInUser', username);
    } else {
      localStorage.removeItem('loggedInUser');
    }
  }

  static getLoggedInUserAvatar(): string | null {
    return localStorage.getItem('loggedInUserAvatar');
  }

  static setLoggedInUserAvatar(avatarUrl: string | null): void {
    if (avatarUrl) {
      localStorage.setItem('loggedInUserAvatar', avatarUrl);
    } else {
      localStorage.removeItem('loggedInUserAvatar');
    }
  }

  // Friends counts management  
  static getCurrentOnlineFriendsCount(): number {
    return parseInt(localStorage.getItem('currentOnlineFriendsCount') || '0');
  }

  static setCurrentOnlineFriendsCount(count: number): void {
    localStorage.setItem('currentOnlineFriendsCount', count.toString());
  }

  static getCurrentPendingRequestsCount(): number {
    return parseInt(localStorage.getItem('currentPendingRequestsCount') || '0');
  }

  static setCurrentPendingRequestsCount(count: number): void {
    localStorage.setItem('currentPendingRequestsCount', count.toString());
  }

  // Avatar cache management
  static getAvatarCacheBuster(): string {
    return localStorage.getItem('avatarCacheBuster') || Date.now().toString();
  }

  static setAvatarCacheBuster(): void {
    localStorage.setItem('avatarCacheBuster', Date.now().toString());
  }

  // Clear all user data on logout
  static clearUserData(): void {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('loggedInUserAvatar');
    localStorage.removeItem('currentOnlineFriendsCount');
    localStorage.removeItem('currentPendingRequestsCount');
  }
}