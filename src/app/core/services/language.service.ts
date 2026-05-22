import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { supabase } from '../../../integrations/supabase/client';

export interface LanguageOption {
  label: string;
  value: string;
  flag: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);

  currentLang = signal<string>('pt-BR');

  languages: LanguageOption[] = [
    { label: 'Português (Brasil)', value: 'pt-BR', flag: '🇧🇷' },
    { label: 'Português (Portugal)', value: 'pt-PT', flag: '🇵🇹' },
    { label: 'English (UK)', value: 'en-GB', flag: '🇬🇧' },
    { label: 'Español (Argentina)', value: 'es-AR', flag: '🇦🇷' },
    { label: 'Español (Uruguay)', value: 'es-UY', flag: '🇺🇾' }
  ];

  constructor() {
    this.translate.addLangs(this.languages.map(l => l.value));
    this.translate.setDefaultLang('pt-BR');
  }

  async setLanguage(lang: string, userId?: string) {
    this.translate.use(lang);
    this.currentLang.set(lang);
    
    // Se um ID de usuário for fornecido, salva a preferência no banco
    if (userId) {
      await supabase.from('profiles')
        .update({ language: lang })
        .eq('id', userId);
    }
  }

  getAvailableLanguages() {
    return this.languages;
  }
}