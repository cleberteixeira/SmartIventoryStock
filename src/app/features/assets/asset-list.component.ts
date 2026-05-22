import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TimelineModule } from 'primeng/timeline';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, TagModule, ButtonModule, 
    InputTextModule, DropdownModule, TooltipModule, DialogModule, 
    TimelineModule, ToastModule, ConfirmDialogModule, CalendarModule, InputNumberModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="assets-page">
      <div class="header">
        <div>
          <h1>Inventário de Ativos (ITAM)</h1>
          <p class="text-secondary">Controle individualizado de hardware e equipamentos serializados</p>
        </div>
        <div class="flex gap-2">
          <p-button icon="pi pi-refresh" [text]="true" (onClick)="store.refresh()" [loading]="store.loading()"></p-button>
          <p-button label="Exportar Lista" icon="pi pi-download" severity="secondary"></p-button>
        </div>
      </div>

      <div class="filters-card mt-4">
        <div class="grid p-fluid">
          <div class="col-12 md:col-4">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input pInputText type="text" [(ngModel)]="searchQuery" placeholder="Pesquisar por SN ou Modelo..." />
            </span>
          </div>
          <div class="col-12 md:col-3">
            <p-dropdown [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="Filtrar por Status" [showClear]="true"></p-dropdown>
          </div>
        </div>
      </div>

      <p-table [value]="filteredAssets()" [rows]="10" [paginator]="true" class="mt-3" 
               styleClass="p-datatable-sm p-datatable-gridlines" [loading]="store.loading()">
        <ng-template pTemplate="header">
          <tr>
            <th>Número de Série (SN)</th>
            <th>Modelo / Equipamento</th>
            <th>Status</th>
            <th>Garantia</th>
            <th>Valor Aquisição</th>
            <th>Responsável / Local</th>
            <th style="width: 220px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-asset>
          <tr>
            <td><code class="sn-badge">{{ asset.serial_number }}</code></td>
            <td>
              <div class="font-bold">{{ getProductName(asset.product_id) }}</div>
              <div class="text-xs text-secondary">{{ getProductCategory(asset.product_id) }}</div>
            </td>
            <td>
              <p-tag [value]="getStatusLabel(asset.status)" [severity]="getStatusSeverity(asset.status)"></p-tag>
            </td>
            <td>
              @if (asset.warranty_expiry) {
                <div class="flex align-items-center gap-2" [class.text-danger]="isExpired(asset.warranty_expiry)">
                  <i class="pi pi-calendar"></i>
                  {{ asset.warranty_expiry | date:'shortDate' }}
                  @if (isExpired(asset.warranty_expiry)) {
                    <i class="pi pi-exclamation-triangle text-red-500" pTooltip="Garantia Expirada"></i>
                  }
                </div>
              } @else {
                <span class="text-secondary italic opacity-50">- não informada -</span>
              }
            </td>
            <td class="text-right font-bold">
              {{ asset.acquisition_value | currency:'BRL' }}
            </td>
            <td>
              @if (asset.employee_id) {
                <span class="flex align-items-center gap-2">
                  <i class="pi pi-user text-green-500"></i> {{ getEmployeeName(asset.employee_id) }}
                </span>
              } @else if (asset.location_id) {
                <span class="flex align-items-center gap-2">
                  <i class="pi pi-map-marker text-blue-500"></i> {{ asset.location_id }}
                </span>
              } @else {
                <span class="text-secondary italic">Indefinido</span>
              }
            </td>
            <td>
              <div class="flex gap-1">
                <p-button icon="pi pi-pencil" [text]="true" size="small" severity="secondary"
                          (onClick)="editAsset(asset)" pTooltip="Editar Garantia/Valor"></p-button>
                
                @if (asset.status === 'PENDING_CLEANING' || asset.status === 'MAINTENANCE' || asset.status === 'DAMAGED') {
                  <p-button icon="pi pi-check-circle" [text]="true" size="small" severity="success"
                            (onClick)="confirmReady(asset)" pTooltip="Liberar para Uso"></p-button>
                }
                
                <p-button icon="pi pi-qrcode" [text]="true" size="small" (onClick)="showLabel(asset)" pTooltip="Etiqueta"></p-button>
                <p-button icon="pi pi-history" [text]="true" size="small" (onClick)="showHistory(asset)" pTooltip="Histórico"></p-button>
                
                @if (asset.status !== 'RETIRED') {
                  <p-button icon="pi pi-ban" [text]="true" size="small" severity="danger" 
                            (onClick)="confirmRetire(asset)" pTooltip="Dar Baixa"></p-button>
                }
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Modal de Edição de Detalhes (Garantia/Valor/Aquisição) -->
      <p-dialog [header]="'Editar Detalhes: ' + selectedAsset?.serial_number" [(visible)]="displayEdit" 
                [modal]="true" [style]="{width: '90vw', maxWidth: '450px'}" [draggable]="false" [resizable]="false">
        @if (selectedAsset) {
          <div class="p-fluid mt-3">
            <div class="field mb-4">
              <label for="acqDate" class="font-bold block mb-2">Data de Aquisição (Para Depreciação)</label>
              <p-calendar id="acqDate" [(ngModel)]="editAcquisitionDate" [showIcon]="true" 
                          placeholder="Quando foi comprado?" appendTo="body" dateFormat="dd/mm/yy"></p-calendar>
              <small class="text-secondary">Esta data define o cálculo do valor contábil atual.</small>
            </div>
            <div class="field mb-4">
              <label for="warranty" class="font-bold block mb-2">Data de Fim da Garantia</label>
              <p-calendar id="warranty" [(ngModel)]="editWarranty" [showIcon]="true" 
                          placeholder="Vencimento da garantia" appendTo="body" dateFormat="dd/mm/yy"></p-calendar>
            </div>
            <div class="field mb-2">
              <label for="value" class="font-bold block mb-2">Valor de Aquisição (R$)</label>
              <p-inputNumber id="value" [(ngModel)]="editValue" mode="currency" currency="BRL" 
                             locale="pt-BR" placeholder="0,00"></p-inputNumber>
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          <div class="flex justify-content-end gap-2 pt-3 border-top-1 surface-border">
            <p-button label="Cancelar" (onClick)="displayEdit = false" [text]="true" severity="secondary"></p-button>
            <p-button label="Salvar Alterações" icon="pi pi-check" (onClick)="saveAssetDetails()" 
                      [loading]="savingDetails()" severity="primary"></p-button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Modal de Etiqueta -->
      <p-dialog [header]="'Etiqueta de Ativo'" [(visible)]="displayLabel" [modal]="true" [style]="{width: '350px'}" [draggable]="false">
        @if (selectedAsset) {
          <div id="print-label" class="label-container">
            <div class="label-header">abc technology</div>
            <div class="label-body">
              <div class="qr-code">
                <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + selectedAsset.serial_number" alt="QR Code">
              </div>
              <div class="label-info">
                <div class="label-sn">SN: {{ selectedAsset.serial_number }}</div>
                <div class="label-model">{{ getProductName(selectedAsset.product_id) }}</div>
                <div class="label-id">ID: {{ selectedAsset.id.substring(0,8) }}</div>
              </div>
            </div>
            <div class="label-footer">PATRIMÔNIO CONTROLADO</div>
          </div>
          <div class="flex justify-content-center mt-4">
            <p-button label="Imprimir Etiqueta" icon="pi pi-print" (onClick)="printLabel()"></p-button>
          </div>
        }
      </p-dialog>

      <!-- Modal de Histórico (Timeline) -->
      <p-dialog [header]="'Histórico do Ativo: ' + selectedAsset?.serial_number" [(visible)]="displayHistory" 
                [modal]="true" [style]="{width: '90vw', maxWidth: '600px'}" [draggable]="false">
        <div class="timeline-container p-3">
          <p-timeline [value]="assetHistory()" align="left">
            <ng-template pTemplate="marker" let-event>
              <span class="custom-marker" [style.backgroundColor]="getEventColor(event.action)">
                <i [class]="getEventIcon(event.action)"></i>
              </span>
            </ng-template>
            <ng-template pTemplate="content" let-event>
              <div class="timeline-event">
                <div class="flex justify-content-between mb-1">
                  <span class="font-bold">{{ getActionLabel(event.action) }}</span>
                  <small class="text-secondary">{{ event.timestamp | date:'dd/MM/yyyy HH:mm' }}</small>
                </div>
                <div class="text-sm text-secondary">
                  @if (event.action === 'CHECKOUT' || event.action === 'EXIT') {
                    @if (event.employee_name) {
                      Atribuído a <strong>{{ event.employee_name }}</strong>
                    } @else {
                      Saída do estoque (Local: {{ event.from_location }})
                    }
                  } @else if (event.action === 'CHECKIN' || event.action === 'ENTRY') {
                    @if (event.action === 'CHECKIN') {
                      Devolvido e armazenado em <strong>{{ event.to_location }}</strong>
                    } @else {
                      Entrada inicial no estoque (Local: {{ event.to_location }})
                    }
                  } @else if (event.action === 'MAINTENANCE') {
                    Enviado para reparo / laboratório
                  } @else if (event.action === 'TRANSFER' || event.action === 'MOVE') {
                    Movido de <strong>{{ event.from_location || 'N/A' }}</strong> para <strong>{{ event.to_location || 'N/A' }}</strong>
                  } @else if (event.action === 'RETIRE') {
                    Baixa definitiva do sistema
                  }
                  
                  @if (event.notes) {
                    <div class="mt-1 italic">"{{ event.notes }}"</div>
                  }
                  <div class="mt-2 text-xs">Operador: {{ event.operator_name }}</div>
                </div>
              </div>
            </ng-template>
          </p-timeline>
          
          @if (assetHistory().length === 0) {
            <div class="text-center p-4 text-secondary">
              <i class="pi pi-info-circle mr-2"></i> Nenhuma movimentação registrada para este ativo.
            </div>
          }
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; }
    .filters-card { background: var(--topbar-bg); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color); }
    .sn-badge { background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; color: #0f172a; font-weight: 600; }
    .text-danger { color: #ef4444; font-weight: 700; }
    .custom-marker { display: flex; width: 2rem; height: 2rem; align-items: center; justify-content: center; color: #ffffff; border-radius: 50%; z-index: 1; }
    .timeline-event { margin-bottom: 1.5rem; }
    .label-container { border: 2px solid #000; padding: 10px; background: white; color: black; width: 280px; margin: 0 auto; font-family: 'Inter', sans-serif; }
    .label-header { font-weight: 800; font-size: 1.2rem; text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
    .label-body { display: flex; gap: 15px; align-items: center; }
    .qr-code img { width: 100px; height: 100px; }
    .label-info { flex: 1; }
    .label-sn { font-weight: 800; font-size: 0.9rem; margin-bottom: 4px; }
    .label-model { font-size: 0.75rem; margin-bottom: 4px; line-height: 1.2; }
    .label-id { font-size: 0.65rem; color: #666; }
    .label-footer { margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; font-size: 0.6rem; text-align: center; font-weight: 700; }
    
    ::ng-deep .p-dialog-content { overflow: visible !important; }
    .border-top-1 { border-top: 1px solid #e2e8f0; }
  `]
})
export class AssetListComponent implements OnInit {
  store = inject(StoreService);
  auth = inject(AuthService);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  route = inject(ActivatedRoute);
  
  searchQuery = '';
  selectedStatus = null;
  displayLabel = false;
  displayHistory = false;
  displayEdit = false;
  selectedAsset: any = null;
  assetHistory = signal<any[]>([]);
  
  // Campos de edição
  editWarranty: Date | null = null;
  editAcquisitionDate: Date | null = null;
  editValue: number | null = null;
  savingDetails = signal(false);

  statusOptions = [
    { label: 'Disponível', value: 'AVAILABLE' },
    { label: 'Em Uso', value: 'IN_USE' },
    { label: 'Manutenção', value: 'MAINTENANCE' },
    { label: 'Avariado', value: 'DAMAGED' },
    { label: 'Baixado (Fim de Vida)', value: 'RETIRED' }
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['searchQuery']) this.searchQuery = params['searchQuery'];
    });
  }

  filteredAssets = computed(() => {
    return this.store.assets().filter(a => {
      const matchesSearch = !this.searchQuery || 
        a.serial_number.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        this.getProductName(a.product_id)?.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || a.status === this.selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  });

  getProductName(id: string) { return this.store.products().find(p => p.id === id)?.name; }
  getProductCategory(id: string) { return this.store.products().find(p => p.id === id)?.category; }
  getEmployeeName(id: string) { return this.store.employees().find(e => e.id === id)?.full_name; }

  isExpired(date: any) { return new Date(date) < new Date(); }

  getStatusLabel(status: string) {
    const map: any = { 'AVAILABLE': 'Disponível', 'IN_USE': 'Em Uso', 'MAINTENANCE': 'Manutenção', 'DAMAGED': 'Avariado', 'RETIRED': 'Baixado', 'PENDING_CLEANING': 'Pendente Limpeza' };
    return map[status] || status;
  }

  getStatusSeverity(status: string): any {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'IN_USE': return 'info';
      case 'MAINTENANCE': return 'warning';
      case 'DAMAGED': return 'danger';
      case 'RETIRED': return 'secondary';
      case 'PENDING_CLEANING': return 'warning';
      default: return 'secondary';
    }
  }

  editAsset(asset: any) {
    this.selectedAsset = asset;
    this.editWarranty = asset.warranty_expiry ? new Date(asset.warranty_expiry) : null;
    this.editAcquisitionDate = asset.acquisition_date ? new Date(asset.acquisition_date) : new Date(asset.created_at);
    this.editValue = asset.acquisition_value || 0;
    this.displayEdit = true;
  }

  async saveAssetDetails() {
    this.savingDetails.set(true);
    try {
      const { error } = await this.store.updateAssetDetails(this.selectedAsset.id, {
        warranty_expiry: this.editWarranty,
        acquisition_date: this.editAcquisitionDate,
        acquisition_value: this.editValue || 0
      });

      if (error) throw error;

      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Dados do ativo atualizados' });
      this.displayEdit = false;
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message });
    } finally {
      this.savingDetails.set(false);
    }
  }

  showLabel(asset: any) {
    this.selectedAsset = asset;
    this.displayLabel = true;
  }

  async showHistory(asset: any) {
    this.selectedAsset = asset;
    const history = await this.store.getAssetTimeline(asset.id, asset.serial_number);
    this.assetHistory.set(history);
    this.displayHistory = true;
  }

  getEventIcon(action: string) {
    switch (action) {
      case 'CHECKOUT': return 'pi pi-external-link';
      case 'CHECKIN': return 'pi pi-download';
      case 'MAINTENANCE': return 'pi pi-wrench';
      case 'RETIRE': return 'pi pi-ban';
      case 'TRANSFER': return 'pi pi-sync';
      case 'ENTRY': return 'pi pi-plus';
      case 'EXIT': return 'pi pi-minus';
      default: return 'pi pi-sync';
    }
  }

  getEventColor(action: string) {
    switch (action) {
      case 'CHECKOUT': return '#3b82f6';
      case 'CHECKIN': return '#22c55e';
      case 'MAINTENANCE': return '#f59e0b';
      case 'RETIRE': return '#ef4444';
      case 'TRANSFER': return '#6366f1';
      case 'ENTRY': return '#10b981';
      case 'EXIT': return '#ef4444';
      default: return '#f59e0b';
    }
  }

  getActionLabel(action: string) {
    switch (action) {
      case 'CHECKOUT': return 'Atribuição (Saída)';
      case 'CHECKIN': return 'Devolução (Entrada)';
      case 'MAINTENANCE': return 'Manutenção';
      case 'RETIRE': return 'Baixa Definitiva';
      case 'TRANSFER': return 'Transferência de Local';
      case 'ENTRY': return 'Entrada em Estoque';
      case 'EXIT': return 'Saída de Estoque';
      default: return 'Movimentação';
    }
  }

  printLabel() {
    window.print();
  }

  confirmReady(asset: any) {
    this.confirmationService.confirm({
      message: `Deseja marcar o ativo <b>\${asset.serial_number}</b> como <b>Disponível</b> para uso?`,
      header: 'Liberar Ativo',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sim, Liberar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        const { error } = await this.store.updateAssetStatus(
          asset.id, 
          'AVAILABLE', 
          this.auth.user()?.id!, 
          'Limpeza/Manutenção concluída. Item pronto para uso.'
        );
        if (error) {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar status' });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ativo liberado para o estoque' });
        }
      }
    });
  }

  confirmRetire(asset: any) {
    this.confirmationService.confirm({
      message: `Deseja realizar a <b>BAIXA DEFINITIVA</b> do ativo SN: \${asset.serial_number}? Esta ação removerá o item do estoque ativo e o marcará como fim de vida.`,
      header: 'Confirmar Baixa de Ativo',
      icon: 'pi pi-exclamation-circle',
      acceptLabel: 'Confirmar Baixa',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        const { error } = await this.store.retireAsset(asset.id, this.auth.user()?.id!, 'Obsolescência / Dano Irreparável');
        if (error) {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao processar baixa' });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ativo baixado com sucesso' });
        }
      }
    });
  }
}