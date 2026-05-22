import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  darkMode = signal<boolean>(false);

  toggleTheme() {
    this.darkMode.update(v => !v);
    const theme = this.darkMode() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Atualiza o link do PrimeNG no index.html se necessário, 
    // mas aqui usaremos variáveis CSS para maior fluidez.
    if (this.darkMode()) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}