import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { WarehouseLocation, LocationType } from '../../core/models/inventory.model';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, TagModule, 
    DialogModule, InputTextModule, DropdownModule, ToastModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="locations-page">
      <div class="header">
        <div>
          <h1>Layout do Armazém</h1>
          <p class="text-secondary">Gerencie as posições físicas e suas finalidades lógicas</p>
        </div>
        <div class="flex gap-2">
          <p-button icon="pi pi-refresh" [text]="true" (onClick)="store.refresh()" [loading]="store.loading()"></p-button>
          <p-button label="Novo Endereço" icon="pi pi-map-marker" (onClick)="showDialog()"></p-button>
        </div>
      </div>

      <p-table [value]="store.locations()" class="mt-4" styleClass="p-datatable-sm" [rows]="10" [paginator]="true">
        <ng-template pTemplate="header">
          <tr>
            <th>ID Endereço</th>
            <th>Zona Lógica</th>
            <th>Status</th>
            <th>Ocupação (Itens)</th>
            <th style="width: 150px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-loc>
          <tr>
            <td><strong>{{ loc.id }}</strong></td>
            <td>
              <p-tag [value]="getLocationLabel(loc.type)" [severity]="getTypeSeverity(loc.type)"></p-tag>
            </td>
            <td>
              <p-tag [value]="loc.status" [severity]="loc.status === 'ACTIVE' ? 'success' : 'warning'"></p-tag>
            </td>
            <td>
              <div class="capacity-container">
                <div class="capacity-bar">
                  <div class="fill" [style.width]="getFillPercentage(loc.id)"></div>
                </div>
                <span class="capacity-text">{{ store.getLocationOccupancy(loc.id) }} un</span>
              </div>
            </td>
            <td>
              <div class="flex gap-2">
                <p-button icon="pi pi-eye" [text]="true" size="small" (onClick)="viewContent(loc)" pTooltip="Conteúdo"></p-button>
                <p-button icon="pi pi-pencil" [text]="true" size="small" severity="secondary"
                          (onClick)="editLocation(loc)" pTooltip="Editar"></p-button>
                <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger"
                          (onClick)="confirmDelete(loc)" pTooltip="Excluir"></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog [header]="'Conteúdo do Endereço: ' + selectedLoc?.id" [(visible)]="displayContent" [modal]="true" 
                [style]="{width: '90vw', maxWidth: '700px'}" [draggable]="false">
        <p-table [value]="currentContent" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Produto</th>
              <th>Números de Série (SN)</th>
              <th style="width: 100px" class="text-right">Quantidade</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>
                <div class="font-bold">{{ item.product_name }}</div>
                <div class="text-xs text-secondary">ID: {{ item.product_id.substring(0,8) }}</div>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  @for (sn of item.serials; track sn) {
                    <code class="sn-mini-badge">{{ sn }}</code>
                  } @empty {
                    <span class="text-xs text-secondary italic">Item não serializado</span>
                  }
                </div>
              </td>
              <td class="text-right">
                <p-tag [value]="item.quantity.toString()" severity="info"></p-tag>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="3" class="text-center p-4 text-secondary">
                <i class="pi pi-info-circle mr-2"></i> Este endereço está vazio.
              </td>
            </tr>
          </ng-template>
        </p-table>
        <ng-template pTemplate="footer">
          <p-button label="Fechar" (onClick)="displayContent = false" [text]="true" severity="secondary"></p-button>
        </ng-template>
      </p-dialog>

      <p-dialog [header]="isEditMode ? 'Editar Endereço' : 'Cadastrar Novo Endereço'" [(visible)]="displayDialog" [modal]="true" 
                [style]="{width: '90vw', maxWidth: '450px'}" [draggable]="false" [resizable]="false">
        <div class="form-content">
          <div class="form-section">
            <h3 class="section-header"><i class="pi pi-map"></i> DADOS DO ENDEREÇO</h3>
            <div class="grid">
              <div class="col-12 field">
                <label>Código do Endereço</label>
                <input pInputText [(ngModel)]="newLoc.id" placeholder="Ex: ARUJA-01-RECEBIMENTO" [disabled]="isEditMode" />
              </div>
              <div class="col-12 field mt-2">
                <label>Zona Lógica (Finalidade)</label>
                <p-dropdown [options]="typeOptions" [(ngModel)]="newLoc.type" 
                            styleClass="w-full" appendTo="body" optionLabel="label" optionValue="value"></p-dropdown>
              </div>
              <div class="col-12 field mt-2">
                <label>Status</label>
                <p-dropdown [options]="statuses" [(ngModel)]="newLoc.status" 
                            styleClass="w-full" appendTo="body" optionLabel="label" optionValue="value"></p-dropdown>
              </div>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <p-button label="Cancelar" (onClick)="displayDialog = false" [text]="true" severity="secondary"></p-button>
            <p-button [label]="isEditMode ? 'Atualizar Endereço' : 'Salvar Endereço'" icon="pi pi-check" 
                      (onClick)="save()" severity="primary" [loading]="saving()"></p-button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .capacity-container { display: flex; align-items: center; gap: 10px; }
    .capacity-bar { flex: 1; min-width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .fill { height: 100%; background: #3b82f6; transition: width 0.5s ease; }
    .capacity-text { font-size: 0.75rem; color: #64748b; font-weight: 600; white-space: nowrap; }
    .section-header { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field label { font-size: 0.85rem; font-weight: 600; color: #475569; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    .grid { display: flex; flex-wrap: wrap; margin: 0; }
    .col-12 { width: 100%; padding: 0; }
    ::ng-deep .p-inputtext, ::ng-deep .p-dropdown { width: 100%; border-radius: 8px; }
    ::ng-deep .p-dialog-content { padding: 1.5rem 2rem !important; overflow: visible !important; }
    .sn-mini-badge { background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-size: 0.7rem; font-family: monospace; color: #2563eb; border: 1px solid #e2e8f0; }
  `]
})
export class LocationListComponent {
  store = inject(StoreService);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  
  displayDialog = false;
  displayContent = false;
  isEditMode = false;
  saving = signal(false);
  selectedLoc: WarehouseLocation | null = null;
  currentContent: any[] = [];
  
  typeOptions = [
    { label: 'Estoque Disponível', value: 'PICKING' },
    { label: 'Recurso Interno', value: 'BULK' },
    { label: 'Recebimento / Trânsito', value: 'QUARANTINE' }
  ];

  statuses = [
    { label: 'Ativo', value: 'ACTIVE' },
    { label: 'Inativo', value: 'INACTIVE' },
    { label: 'Lotado', value: 'FULL' }
  ];

  newLoc: WarehouseLocation = this.resetLoc();

  resetLoc(): WarehouseLocation {
    return { id: '', warehouse_id: 'WH-01', type: 'PICKING', status: 'ACTIVE' };
  }

  showDialog() {
    this.newLoc = this.resetLoc();
    this.isEditMode = false;
    this.displayDialog = true;
  }

  editLocation(loc: WarehouseLocation) {
    this.newLoc = { ...loc };
    this.isEditMode = true;
    this.displayDialog = true;
  }

  confirmDelete(loc: WarehouseLocation) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o endereço <b>${loc.id}</b>? Esta ação não poderá ser desfeita se houver saldo vinculado.`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        const { error } = await this.store.deleteLocation(loc.id);
        if (error) {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não é possível excluir endereços com saldo ou histórico.' });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Endereço removido' });
        }
      }
    });
  }

  viewContent(loc: WarehouseLocation) {
    this.selectedLoc = loc;
    this.currentContent = this.store.getLocationContent(loc.id);
    this.displayContent = true;
  }

  getLocationLabel(type: string) {
    return this.typeOptions.find(o => o.value === type)?.label || type;
  }

  getFillPercentage(locationId: string): string {
    const qty = this.store.getLocationOccupancy(locationId);
    const percent = Math.min(100, (qty / 500) * 100);
    return `${percent}%`;
  }

  async save() {
    if (!this.newLoc.id) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o código do endereço' });
      return;
    }

    this.saving.set(true);
    try {
      let result;
      if (this.isEditMode) {
        result = await this.store.updateLocation(this.newLoc);
      } else {
        result = await this.store.addLocation(this.newLoc);
      }

      if (result.error) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: result.error.message });
      } else {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Endereço ${this.isEditMode ? 'atualizado' : 'cadastrado'} com sucesso` });
        this.displayDialog = false;
      }
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Erro Inesperado', detail: err.message });
    } finally {
      this.saving.set(false);
    }
  }

  getTypeSeverity(type: string): any {
    switch (type) {
      case 'QUARANTINE': return 'info';
      case 'PICKING': return 'success';
      case 'BULK': return 'warning';
      default: return null;
    }
  }
}