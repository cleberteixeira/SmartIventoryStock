import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { UserProfile } from '../../core/models/inventory.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, TagModule, 
    DialogModule, InputTextModule, DropdownModule, RadioButtonModule, 
    ToastModule, DividerModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="users-page">
      <div class="header">
        <div>
          <h1>Gestão de Usuários</h1>
          <p class="text-secondary">Administre os acessos e competências da equipe</p>
        </div>
        <p-button label="Novo Usuário" icon="pi pi-user-plus" (onClick)="showDialog()"></p-button>
      </div>

      <p-table [value]="store.users()" class="mt-4" [rows]="10" [paginator]="true" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Especialidade</th>
            <th>Perfil</th>
            <th>Status</th>
            <th style="width: 150px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-user>
          <tr>
            <td><strong>{{ user.full_name }}</strong></td>
            <td>{{ user.email }}</td>
            <td>{{ user.specialty }}</td>
            <td>
              <p-tag [value]="user.role === 'ADMIN' ? 'Administrador' : 'Recurso'" 
                     [severity]="user.role === 'ADMIN' ? 'danger' : 'info'"></p-tag>
            </td>
            <td>
              <p-tag [value]="user.status" [severity]="user.status === 'ACTIVE' ? 'success' : 'warning'"></p-tag>
            </td>
            <td>
              <div class="flex gap-2">
                <p-button icon="pi pi-search" [text]="true" size="small" (onClick)="viewUser(user)" pTooltip="Detalhes"></p-button>
                <p-button icon="pi pi-pencil" [text]="true" size="small" (onClick)="editUser(user)" pTooltip="Editar"></p-button>
                <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" (onClick)="confirmDelete(user)" pTooltip="Excluir"></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog [header]="dialogHeader()" [(visible)]="displayDialog" [modal]="true" 
                [style]="{width: '90vw', maxWidth: '800px'}" [draggable]="false" [resizable]="false">
        
        <div class="form-content" [class.read-only]="isViewMode">
          <div class="form-section">
            <h3 class="section-header"><i class="pi pi-id-card"></i> INFORMAÇÕES BÁSICAS</h3>
            <div class="grid">
              <div class="col-12 field">
                <label>Nome Completo</label>
                <input pInputText [(ngModel)]="newUser.full_name" [disabled]="isViewMode" placeholder="Digite o nome completo" />
              </div>
              <div class="col-12 md:col-7 field">
                <label>E-mail Corporativo</label>
                <input pInputText [(ngModel)]="newUser.email" [disabled]="isViewMode || isEditMode" placeholder="email@abctechnology.com.br" />
              </div>
              @if (!isEditMode && !isViewMode) {
                <div class="col-12 md:col-5 field">
                  <label>Senha Inicial</label>
                  <input pInputText type="password" [(ngModel)]="initialPassword" placeholder="******" />
                </div>
              }
            </div>
          </div>

          <div class="form-section mt-4">
            <h3 class="section-header"><i class="pi pi-bookmark"></i> ESPECIALIDADES E COMPETÊNCIAS</h3>
            <div class="specialties-container">
              <div class="flex gap-2 mb-3" *ngIf="!isViewMode">
                <input pInputText [(ngModel)]="customSpecialty" placeholder="Adicionar nova especialidade..." class="flex-1" 
                       (keyup.enter)="addCustomSpecialty()" />
                <p-button icon="pi pi-plus" label="Adicionar" (onClick)="addCustomSpecialty()" [disabled]="!customSpecialty"></p-button>
              </div>
              <div class="specialties-grid">
                @for (spec of store.allSpecialties(); track spec) {
                  <div class="spec-card" 
                       [class.selected]="newUser.specialty === spec" 
                       [class.disabled]="isViewMode"
                       (click)="!isViewMode && newUser.specialty = spec">
                    <div class="flex align-items-center gap-2 flex-1">
                      <p-radioButton [name]="'spec'" [value]="spec" [(ngModel)]="newUser.specialty" [disabled]="isViewMode"></p-radioButton>
                      <span>{{ spec }}</span>
                    </div>
                    <p-button *ngIf="!isViewMode" icon="pi pi-times" [text]="true" severity="danger" 
                              size="small" (onClick)="removeSpecialty($event, spec)" pTooltip="Remover opção"></p-button>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="form-section mt-4">
            <h3 class="section-header"><i class="pi pi-phone"></i> CONTATO E LOCALIZAÇÃO</h3>
            <div class="grid">
              <div class="col-12 md:col-4 field">
                <label>Celular</label>
                <input pInputText [(ngModel)]="newUser.cellphone" [disabled]="isViewMode" placeholder="(00) 00000-0000" />
              </div>
              <div class="col-12 md:col-4 field">
                <label>WhatsApp</label>
                <input pInputText [(ngModel)]="newUser.whatsapp" [disabled]="isViewMode" placeholder="(00) 00000-0000" />
              </div>
              <div class="col-12 md:col-4 field">
                <label>Telefone Fixo</label>
                <input pInputText [(ngModel)]="newUser.landline" [disabled]="isViewMode" placeholder="(00) 0000-0000" />
              </div>
              <div class="col-12 field">
                <label>Localidade (Cidade/UF)</label>
                <input pInputText [(ngModel)]="newUser.location" [disabled]="isViewMode" placeholder="Ex: São Paulo / SP" />
              </div>
            </div>
          </div>

          <div class="form-section mt-4">
            <h3 class="section-header"><i class="pi pi-shield"></i> CONFIGURAÇÕES DE ACESSO</h3>
            <div class="grid">
              <div class="col-12 md:col-8 field">
                <label>Perfil de Acesso</label>
                <p-dropdown [options]="roles" [(ngModel)]="newUser.role" [disabled]="isViewMode" optionLabel="label" optionValue="value" styleClass="w-full"></p-dropdown>
              </div>
              <div class="col-12 md:col-4 field">
                <label>Status da Conta</label>
                <p-dropdown [options]="statuses" [(ngModel)]="newUser.status" [disabled]="isViewMode" optionLabel="label" optionValue="value" styleClass="w-full"></p-dropdown>
              </div>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <p-button label="Fechar" (onClick)="displayDialog = false" [text]="true" severity="secondary"></p-button>
            @if (!isViewMode) {
              <p-button [label]="isEditMode ? 'Atualizar Cadastro' : 'Salvar Usuário'" 
                        icon="pi pi-check" (onClick)="save()" 
                        [disabled]="!newUser.full_name || !newUser.email" severity="primary"
                        [loading]="saving()"></p-button>
            }
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .form-content { padding: 0.5rem; }
    .section-header { 
      font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 1rem; 
      display: flex; align-items: center; gap: 8px; letter-spacing: 0.05em;
      border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;
    }
    .field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
    .field label { font-size: 0.85rem; font-weight: 600; color: #475569; }
    .specialties-container { background: #f8fafc; border-radius: 12px; padding: 1rem; border: 1px solid #e2e8f0; }
    .specialties-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; max-height: 250px; overflow-y: auto; }
    .spec-card {
      background: white; border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; border-radius: 8px;
      display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: 0.2s; font-size: 0.85rem; color: #475569;
    }
    .spec-card:hover:not(.disabled) { border-color: #3b82f6; background: #eff6ff; }
    .spec-card.selected { border-color: #3b82f6; background: #eff6ff; color: #1e40af; font-weight: 600; }
    .spec-card.disabled { cursor: default; opacity: 0.8; }
    
    .dialog-footer { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    .grid { display: flex; flex-wrap: wrap; margin: 0 -0.5rem; }
    .col-12 { width: 100%; padding: 0.5rem; }
    @media (min-width: 768px) { .md\\:col-4 { width: 33.33%; } .md\\:col-5 { width: 41.66%; } .md\\:col-7 { width: 58.33%; } .md\\:col-8 { width: 66.66%; } }
    ::ng-deep .p-dialog-content { padding: 1.5rem 2rem !important; }
    ::ng-deep .p-inputtext { width: 100%; border-radius: 8px; padding: 0.6rem 0.8rem; }
  `]
})
export class UserListComponent {
  store = inject(StoreService);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  
  displayDialog = false;
  isEditMode = false;
  isViewMode = false;
  saving = signal(false);
  customSpecialty = '';
  initialPassword = ''; // Corrigido: Adicionada a propriedade faltante

  roles = [
    { label: 'Recurso (Consultor)', value: 'RESOURCE' },
    { label: 'Administrador (Gestão)', value: 'ADMIN' }
  ];

  statuses = [
    { label: 'Ativo', value: 'ACTIVE' },
    { label: 'Inativo', value: 'INACTIVE' }
  ];

  newUser: UserProfile = this.resetUser();

  resetUser(): UserProfile {
    this.customSpecialty = '';
    return {
      full_name: '',
      email: '',
      specialty: '',
      cellphone: '',
      whatsapp: '',
      landline: '',
      location: '',
      role: 'RESOURCE',
      status: 'ACTIVE'
    };
  }

  addCustomSpecialty() {
    if (this.customSpecialty) {
      this.store.addSpecialty(this.customSpecialty);
      this.newUser.specialty = this.customSpecialty;
      this.customSpecialty = '';
      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Especialidade adicionada à lista' });
    }
  }

  removeSpecialty(event: Event, spec: string) {
    event.stopPropagation(); // Evita selecionar a especialidade ao clicar no X
    this.store.removeSpecialty(spec);
    if (this.newUser.specialty === spec) {
      this.newUser.specialty = '';
    }
  }

  dialogHeader() {
    if (this.isViewMode) return 'Detalhes do Usuário';
    return this.isEditMode ? 'Editar Usuário' : 'Novo Usuário';
  }

  showDialog() {
    this.newUser = this.resetUser();
    this.initialPassword = '';
    this.isEditMode = false;
    this.isViewMode = false;
    this.displayDialog = true;
  }

  viewUser(user: UserProfile) {
    this.newUser = { ...user };
    this.isEditMode = false;
    this.isViewMode = true;
    this.displayDialog = true;
  }

  editUser(user: UserProfile) {
    this.newUser = { ...user };
    this.isEditMode = true;
    this.isViewMode = false;
    this.displayDialog = true;
  }

  confirmDelete(user: UserProfile) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir permanentemente o usuário <b>\${user.full_name}</b>? Esta ação removerá também a conta de acesso.`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        const { error } = await this.store.deleteUser(user.id!);
        if (error) {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o usuário' });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário removido do sistema' });
        }
      }
    });
  }

  async save() {
    this.saving.set(true);
    
    if (this.isEditMode) {
      const { error } = await this.store.updateProfile(this.newUser);
      if (error) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar perfil' });
      } else {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Cadastro atualizado' });
        this.displayDialog = false;
      }
    } else {
      if (!this.initialPassword || this.initialPassword.length < 6) {
        this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'A senha deve ter pelo menos 6 caracteres' });
        this.saving.set(false);
        return;
      }
      const { error } = await this.store.createUserWithAuth(this.newUser, this.initialPassword);
      if (error) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: error.message || 'Falha ao criar usuário' });
      } else {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário e conta criados' });
        this.displayDialog = false;
      }
    }
    
    this.saving.set(false);
  }
}