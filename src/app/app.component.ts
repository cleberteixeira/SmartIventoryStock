import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { StoreService } from './core/services/store.service';
import { LanguageService } from './core/services/language.service';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DividerModule } from 'primeng/divider';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    ButtonModule, 
    OverlayPanelModule, 
    DividerModule, 
    SidebarModule,
    TooltipModule,
    BadgeModule,
    InputTextModule,
    DialogModule,
    TagModule,
    DropdownModule,
    FormsModule,
    TranslateModule
  ],
  template: `
    <div class="layout-wrapper" [class.dark-mode]="theme.darkMode()" [class.sidebar-collapsed]="isCollapsed()">
      @if (auth.isAuthenticated) {
        <aside class="sidebar">
          <div class="brand">
            <div class="logo-wrapper" [class.logo-dark-bg]="theme.darkMode()">
              <img src="assets/logo.png" alt="ABC Technology" class="main-logo">
            </div>
            @if (!isCollapsed()) {
              <div class="brand-text">
                <div class="sub-brand">SmartInventory</div>
                <div class="erp-badge">ITAM & WMS</div>
              </div>
            }
          </div>

          <nav class="nav-container">
            <div class="nav-section">
              <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" [pTooltip]="isCollapsed() ? ('MENU.DASHBOARD' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-th-large"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.DASHBOARD' | translate }}</span>
              </a>
            </div>

            <div class="nav-label" *ngIf="!isCollapsed()">CADASTRO</div>
            <div class="nav-section">
              <a routerLink="/products" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.PRODUCTS' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-box"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.PRODUCTS' | translate }}</span>
              </a>
              <a routerLink="/assets" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.ASSETS' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-desktop"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.ASSETS' | translate }}</span>
              </a>
              <a routerLink="/locations" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.LOCATIONS' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-map-marker"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.LOCATIONS' | translate }}</span>
              </a>
              <a routerLink="/employees" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.EMPLOYEES' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-id-card"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.EMPLOYEES' | translate }}</span>
              </a>
            </div>

            <div class="nav-label" *ngIf="!isCollapsed()">OPERAÇÃO</div>
            <div class="nav-section">
              <a routerLink="/stock" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.STOCK' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-sync"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.STOCK' | translate }}</span>
              </a>
              <a routerLink="/assignment" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.ASSIGNMENT' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-external-link"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.ASSIGNMENT' | translate }}</span>
              </a>
              <a routerLink="/checkin" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.CHECKIN' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-download"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.CHECKIN' | translate }}</span>
              </a>
              <a routerLink="/maintenance" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.MAINTENANCE' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-wrench"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.MAINTENANCE' | translate }}</span>
              </a>
              <a routerLink="/traceability" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.TRACEABILITY' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-history"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.TRACEABILITY' | translate }}</span>
              </a>
              <a routerLink="/inventory" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.INVENTORY' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-check-square"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.INVENTORY' | translate }}</span>
              </a>
            </div>

            <div class="nav-label" *ngIf="!isCollapsed()">GESTÃO</div>
            <div class="nav-section">
              <a routerLink="/audit" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.AUDIT' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-shield"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.AUDIT' | translate }}</span>
              </a>
              <a routerLink="/reports" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.REPORTS' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-chart-bar"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.REPORTS' | translate }}</span>
              </a>
              <a routerLink="/users" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.USERS' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-users"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.USERS' | translate }}</span>
              </a>
              <a routerLink="/help" routerLinkActive="active" [pTooltip]="isCollapsed() ? ('MENU.HELP' | translate) : ''" tooltipPosition="right">
                <i class="pi pi-question-circle"></i> <span *ngIf="!isCollapsed()">{{ 'MENU.HELP' | translate }}</span>
              </a>
            </div>
          </nav>

          <div class="sidebar-footer">
            <p-button [icon]="isCollapsed() ? 'pi pi-chevron-right' : 'pi pi-chevron-left'" 
                      [text]="true" (onClick)="toggleSidebar()" styleClass="toggle-btn"></p-button>
          </div>
        </aside>
      }
      
      <main class="content">
        @if (auth.isAuthenticated) {
          <header class="topbar">
            <div class="topbar-left"></div>

            <div class="topbar-right">
              <div class="flex align-items-center gap-2">
                <p-button [label]="getCurrentFlag()" [text]="true" (onClick)="langPanel.toggle($event)" styleClass="topbar-icon-btn"></p-button>
                
                <p-overlayPanel #langPanel styleClass="lang-popover">
                  <div class="flex flex-column gap-1 p-2">
                    @for (lang of langService.getAvailableLanguages(); track lang.value) {
                      <button class="lang-item" [class.active]="langService.currentLang() === lang.value" (click)="changeLang(lang.value); langPanel.hide()">
                        <span class="flag">{{ lang.flag }}</span>
                        <span class="label">{{ lang.label }}</span>
                      </button>
                    }
                  </div>
                </p-overlayPanel>

                <p-button icon="pi pi-history" [text]="true" (onClick)="store.displayTimeline.set(true)" 
                          styleClass="topbar-icon-btn" pTooltip="Atividades Recentes"></p-button>

                <p-button icon="pi pi-bell" [text]="true" (onClick)="notif.toggle($event)" styleClass="topbar-icon-btn">
                   <p-badge *ngIf="(store.lowStockProducts().length + store.expiringWarranties().length) > 0" 
                            [value]="(store.lowStockProducts().length + store.expiringWarranties().length).toString()" 
                            severity="danger"></p-badge>
                </p-button>

                <p-overlayPanel #notif styleClass="notif-popover">
                   <div class="p-3" style="width: 300px">
                      <div class="font-bold mb-3 border-bottom-1 surface-border pb-2">Alertas do Sistema</div>
                      
                      <div class="flex flex-column gap-3">
                        @for (p of store.lowStockProducts(); track p.id) {
                          <div class="notif-item flex align-items-start gap-2">
                             <i class="pi pi-exclamation-triangle text-red-500 mt-1"></i>
                             <div>
                                <div class="text-sm font-bold">Estoque Baixo</div>
                                <div class="text-xs text-secondary">{{ p.name }} ({{ p.current_stock }} un)</div>
                             </div>
                          </div>
                        }

                        @for (a of store.expiringWarranties(); track a.id) {
                          <div class="notif-item flex align-items-start gap-2">
                             <i class="pi pi-calendar-times text-orange-500 mt-1"></i>
                             <div>
                                <div class="text-sm font-bold">Garantia Expirando</div>
                                <div class="text-xs text-secondary">SN: {{ a.serial_number }}</div>
                             </div>
                          </div>
                        }

                        @if (store.lowStockProducts().length === 0 && store.expiringWarranties().length === 0) {
                          <div class="text-sm text-secondary p-2 text-center">Nenhum alerta no momento.</div>
                        }
                      </div>
                   </div>
                </p-overlayPanel>

                <p-button [icon]="theme.darkMode() ? 'pi pi-sun' : 'pi pi-moon'" [text]="true" (onClick)="theme.toggleTheme()" styleClass="topbar-icon-btn"></p-button>
                
                <div class="topbar-divider"></div>

                <div class="user-menu-trigger" (click)="op.toggle($event)">
                  <div class="user-initials-box">{{ auth.userInitials }}</div>
                </div>
              </div>

              <p-overlayPanel #op styleClass="user-popover">
                <div class="popover-header">
                  <div class="user-name">{{ auth.profile()?.full_name || 'Usuário' }}</div>
                  <div class="user-role">{{ auth.profile()?.role || '' }}</div>
                </div>
                <p-divider></p-divider>
                <div class="popover-content">
                  <button class="menu-item" (click)="displayProfile.set(true); op.hide()">
                    <i class="pi pi-user"></i> <span>Meu Perfil</span>
                  </button>
                  <button class="menu-item logout" (click)="handleLogout()">
                    <i class="pi pi-sign-out"></i> <span>Sair do Sistema</span>
                  </button>
                </div>
              </p-overlayPanel>
            </div>
          </header>
        }
        <div class="page-container">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Painel Lateral de Atividades (Global) -->
      <p-sidebar [visible]="store.displayTimeline()" (onHide)="store.displayTimeline.set(false)" 
                 position="right" styleClass="w-full md:w-25rem" [appendTo]="'body'">
        <div class="sidebar-header mb-4">
          <h2 class="m-0"><i class="pi pi-history mr-2"></i>Atividades Recentes</h2>
          <p class="text-secondary text-sm">Últimas 10 movimentações do sistema</p>
        </div>

        <div class="activity-container">
          @for (m of store.movements().slice(0, 10); track m.id) {
            <div class="activity-item">
              <div class="activity-icon" [class]="m.type.toLowerCase()">
                <i [class]="getMovementIcon(m.type)"></i>
              </div>
              <div class="activity-details">
                <div class="activity-title">
                  <strong>{{ getProductName(m.product_id) }}</strong>
                  <span class="qty ml-2">({{ m.quantity }} un)</span>
                </div>
                <div class="activity-sub">
                  {{ getMovementText(m) }} • {{ m.timestamp | date:'HH:mm' }}
                </div>
              </div>
              <div class="activity-tag">
                <p-tag [value]="m.type" [severity]="getMovementSeverity(m.type)" styleClass="text-xs"></p-tag>
              </div>
            </div>
          }
        </div>
      </p-sidebar>

      <!-- Modal de Perfil -->
      <p-dialog header="Meu Perfil" [(visible)]="displayProfile" [modal]="true" 
                [style]="{width: '90vw', maxWidth: '450px'}" [draggable]="false" [resizable]="false"
                styleClass="profile-dialog">
        @if (auth.profile(); as p) {
          <div class="profile-modal-content">
            <div class="flex justify-content-center mb-5">
              <div class="profile-avatar-large">{{ auth.userInitials }}</div>
            </div>
            
            <div class="profile-info-list">
              <div class="info-item">
                <span class="info-label">Nome Completo</span>
                <span class="info-value">{{ p.full_name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Idioma Preferido</span>
                <p-dropdown [options]="langService.getAvailableLanguages()" 
                            [(ngModel)]="p.language" 
                            (onChange)="changeLang($event.value)"
                            optionLabel="label" optionValue="value"
                            styleClass="w-full mt-1">
                  <ng-template let-lang pTemplate="item">
                    <div class="flex align-items-center gap-2">
                      <span>{{ lang.flag }}</span>
                      <span>{{ lang.label }}</span>
                    </div>
                  </ng-template>
                </p-dropdown>
              </div>
              <div class="info-item">
                <span class="info-label">Especialidade</span>
                <span class="info-value">{{ p.specialty }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Perfil de Acesso</span>
                <div class="mt-1">
                  <p-tag [value]="p.role === 'ADMIN' ? 'Administrador' : 'Recurso'" 
                         [severity]="p.role === 'ADMIN' ? 'danger' : 'info'"></p-tag>
                </div>
              </div>
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          <div class="flex justify-content-center w-full pt-3 border-top-1 surface-border">
            <p-button label="Fechar" (onClick)="displayProfile.set(false)" styleClass="p-button-outlined p-button-secondary w-full"></p-button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .layout-wrapper { display: flex; min-height: 100vh; background: var(--page-bg); }
    .sidebar { width: 260px; background: var(--sidebar-bg); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; }
    .sidebar-collapsed .sidebar { width: 80px; padding: 1.5rem 0.5rem; }
    .brand { padding: 0 0 2rem 0; display: flex; flex-direction: column; align-items: center; text-align: center; overflow: hidden; }
    .logo-wrapper { padding: 8px; border-radius: 12px; display: inline-block; margin-bottom: 0.5rem; }
    .logo-dark-bg { background: white; }
    .main-logo { width: 140px; display: block; transition: width 0.3s; }
    .sidebar-collapsed .main-logo { width: 40px; }
    .sub-brand { font-weight: 800; font-size: 1.1rem; color: var(--text-main); white-space: nowrap; }
    .erp-badge { font-size: 0.65rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.15em; text-transform: uppercase; }
    .nav-container { flex: 1; overflow-y: auto; overflow-x: hidden; }
    .nav-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; margin: 1.5rem 0 0.5rem 0.75rem; letter-spacing: 0.05em; }
    .nav-section a { color: var(--sidebar-color); text-decoration: none; padding: 0.75rem 1rem; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; }
    .sidebar-collapsed .nav-section a { justify-content: center; padding: 0.75rem 0; }
    .nav-section a:hover { background: var(--sidebar-active-bg); color: var(--sidebar-active-color); }
    .nav-section a.active { background: var(--sidebar-active-bg); color: var(--sidebar-active-color); font-weight: 600; }
    .sidebar-footer { padding-top: 1rem; border-top: 1px solid var(--border-color); text-align: center; }
    .content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .topbar { height: 64px; background: var(--topbar-bg); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem; }
    .topbar-divider { width: 1px; height: 24px; background-color: var(--border-color); margin: 0 8px; }
    .user-menu-trigger { display: flex; align-items: center; cursor: pointer; padding: 4px; }
    .user-initials-box { width: 42px; height: 42px; background: #2563eb; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    .page-container { padding: 2rem; flex: 1; overflow-y: auto; }
    .lang-item { width: 100%; padding: 0.6rem 1rem; border: none; background: none; display: flex; align-items: center; gap: 10px; cursor: pointer; border-radius: 8px; color: #475569; font-weight: 600; transition: 0.2s; }
    .lang-item:hover { background: #f1f5f9; color: #2563eb; }
    .lang-item.active { background: #eff6ff; color: #2563eb; }
    .menu-item { width: 100%; padding: 0.75rem; border: none; background: none; display: flex; align-items: center; gap: 10px; cursor: pointer; border-radius: 8px; color: #475569; font-weight: 600; font-size: 0.9rem; transition: 0.2s; }
    .menu-item:hover { background: #f1f5f9; color: #2563eb; }
    .menu-item.logout { color: #ef4444; }
    .menu-item.logout:hover { background: #fef2f2; color: #dc2626; }
    .profile-avatar-large { width: 80px; height: 80px; background: #2563eb; color: white; border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }
    .profile-info-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .info-item { display: flex; flex-direction: column; gap: 6px; }
    .info-label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 1rem; font-weight: 600; color: #1e293b; line-height: 1.4; }
    
    .activity-container { display: flex; flex-direction: column; gap: 0.5rem; }
    .activity-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .activity-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
    .activity-icon.entry { background: #dcfce7; color: #16a34a; }
    .activity-icon.exit { background: #fee2e2; color: #dc2626; }
    .activity-icon.transfer { background: #e0e7ff; color: #4f46e5; }
    .activity-icon.adjustment { background: #fef3c7; color: #d97706; }
    .activity-details { flex: 1; min-width: 0; }
    .activity-title { font-size: 0.85rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
    .activity-sub { font-size: 0.7rem; color: #64748b; margin-top: 1px; }
    .qty { color: #2563eb; font-weight: 700; font-size: 0.8rem; }
  `]
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  store = inject(StoreService);
  langService = inject(LanguageService);
  router = inject(Router);
  
  isCollapsed = signal(false);
  displayProfile = signal(false);

  ngOnInit() {}

  getCurrentFlag() {
    return this.langService.languages.find(l => l.value === this.langService.currentLang())?.flag || '🇧🇷';
  }

  changeLang(lang: string) {
    this.langService.setLanguage(lang, this.auth.user()?.id);
  }

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }

  async handleLogout() {
    await this.auth.signOut();
  }

  getProductName(id: string) { return this.store.products().find(p => p.id === id)?.name || 'Produto'; }
  
  getMovementIcon(type: string) {
    switch (type) {
      case 'ENTRY': return 'pi pi-arrow-down-left';
      case 'EXIT': return 'pi pi-arrow-up-right';
      case 'TRANSFER': return 'pi pi-sync';
      case 'ADJUSTMENT': return 'pi pi-sliders-h';
      default: return 'pi pi-circle';
    }
  }

  getMovementText(m: any) {
    if (m.type === 'ENTRY') return `Entrada em ${m.to_location || 'Estoque'}`;
    if (m.type === 'EXIT') return `Saída de ${m.from_location || 'Estoque'}`;
    if (m.type === 'TRANSFER') return `De ${m.from_location} para ${m.to_location}`;
    return m.reason || 'Ajuste de sistema';
  }

  getMovementSeverity(type: string): any {
    switch (type) {
      case 'ENTRY': return 'success';
      case 'EXIT': return 'danger';
      case 'TRANSFER': return 'info';
      case 'ADJUSTMENT': return 'warning';
      default: return 'secondary';
    }
  }
}