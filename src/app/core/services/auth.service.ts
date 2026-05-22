import { Injectable, signal, inject, NgZone } from '@angular/core';
import { supabase } from '../../../integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { UserProfile } from '../models/inventory.model';
import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private langService = inject(LanguageService);
  
  session = signal<Session | null | undefined>(undefined);
  user = signal<User | null>(null);
  profile = signal<UserProfile | null>(null);

  constructor() {
    this.init();
  }

  private async init() {
    // Pega a sessão inicial de forma síncrona se possível
    const { data: { session } } = await supabase.auth.getSession();
    this.handleSessionChange(session);

    // Escuta mudanças futuras
    supabase.auth.onAuthStateChange((event, session) => {
      // Evita processar eventos redundantes que podem causar loops
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        this.handleSessionChange(session);
      }
    });
  }

  private async handleSessionChange(session: Session | null) {
    const currentSession = this.session();
    
    // Se a sessão não mudou de fato, ignora para evitar loops de navegação
    if (currentSession !== undefined && currentSession?.user?.id === session?.user?.id) {
      return;
    }

    this.session.set(session);
    this.user.set(session?.user ?? null);

    if (session) {
      await this.ensureProfile(session.user);
      await this.loadProfile(session.user.id);
      
      if (window.location.pathname === '/login') {
        this.ngZone.run(() => this.router.navigate(['/']));
      }
    } else {
      this.profile.set(null);
      if (window.location.pathname !== '/login') {
        this.ngZone.run(() => this.router.navigate(['/login']));
      }
    }
  }

  async loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      this.profile.set(data as any);
      if (data.language) {
        this.langService.setLanguage(data.language);
      }
    }
  }

  async refreshProfile() {
    const userId = this.user()?.id;
    if (userId) await this.loadProfile(userId);
  }

  private async ensureProfile(user: User) {
    const { data } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    
    if (!data) {
      const newProfile = {
        id: user.id,
        full_name: user.user_metadata['full_name'] || user.email?.split('@')[0],
        email: user.email,
        role: 'ADMIN',
        status: 'ACTIVE',
        specialty: 'Administrador do Sistema',
        language: 'pt-BR'
      };
      await supabase.from('profiles').insert([newProfile]);
    }
  }

  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Erro ao comunicar logout com servidor, limpando estado local...');
    } finally {
      this.session.set(null);
      this.user.set(null);
      this.profile.set(null);
      this.ngZone.run(() => this.router.navigate(['/login']));
    }
  }

  get isAuthenticated() {
    return !!this.session();
  }

  get isInitializing() {
    return this.session() === undefined;
  }

  get userInitials() {
    const name = this.profile()?.full_name || 'User';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}