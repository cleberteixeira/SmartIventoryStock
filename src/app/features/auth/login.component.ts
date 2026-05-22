import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../../integrations/supabase/client';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, MessageModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <img src="assets/logo.png" alt="ABC Technology" class="login-logo">
        </div>
        
        <div class="header-section">
          <h2>SmartInventory</h2>
          <p>Entre para gerenciar o armazém</p>
        </div>

        <div class="form-section">
          <div class="field">
            <label for="email">Email address</label>
            <input pInputText id="email" [(ngModel)]="email" type="email" 
                   placeholder="paulo.rogerio@abctechnology.com.br" class="w-full" />
          </div>

          <div class="field mt-4">
            <label for="password">Your Password</label>
            <input pInputText id="password" [(ngModel)]="password" type="password" 
                   placeholder="••••••••" class="w-full" />
          </div>

          @if (error()) {
            <p-message severity="error" [text]="error()" styleClass="w-full mt-3"></p-message>
          }

          <div class="action-section mt-5">
            <p-button label="Sign in" (onClick)="handleLogin()" [loading]="loading()" 
                      styleClass="login-btn"></p-button>
          </div>
        </div>

        <div class="footer-section">
          <a href="#" class="forgot-link">Forgot your password?</a>
          <div class="signup-text">
            Don't have an account? <a href="#" class="signup-link">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      min-height: 80vh;
      margin: 0;
    }

    .login-card {
      background: white;
      width: 100%;
      max-width: 450px;
      padding: 3rem 2.5rem;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      border: 1px solid #e2e8f0;
    }

    .logo-section { text-align: center; margin-bottom: 1.5rem; }
    .login-logo { width: 200px; max-width: 100%; height: auto; }

    .header-section { text-align: center; margin-bottom: 2.5rem; }
    .header-section h2 { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .header-section p { color: #64748b; font-size: 0.95rem; }

    .form-section { display: flex; flex-direction: column; }
    .field { display: flex; flex-direction: column; gap: 0.6rem; }
    .field label { font-size: 0.875rem; font-weight: 600; color: #334155; }
    
    ::ng-deep .w-full { width: 100%; }
    ::ng-deep .p-inputtext {
      padding: 0.8rem 1rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      font-size: 0.95rem;
    }

    .action-section { display: flex; }
    ::ng-deep .login-btn {
      background: #2563eb !important;
      border: none !important;
      padding: 0.75rem 1.5rem !important;
      font-weight: 700 !important;
      border-radius: 8px !important;
      font-size: 1rem !important;
      width: 100%;
    }

    .footer-section {
      text-align: center;
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .forgot-link { color: #2563eb; text-decoration: none; font-size: 0.9rem; font-weight: 600; }
    .signup-text { font-size: 0.9rem; color: #64748b; }
    .signup-link { color: #2563eb; text-decoration: none; font-weight: 700; }

    .mt-4 { margin-top: 1rem; }
    .mt-5 { margin-top: 1.5rem; }
  `]
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  ngOnInit() {
    // Se o componente carregar e o usuário já estiver autenticado, pula para o dashboard
    if (this.auth.isAuthenticated) {
      this.router.navigate(['/']);
    }
  }

  async handleLogin() {
    if (!this.email || !this.password) {
      this.error.set('Preencha todos os campos');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: this.email.trim(),
        password: this.password
      });

      if (error) throw error;
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set('E-mail ou senha incorretos.');
    } finally {
      this.loading.set(false);
    }
  }
}