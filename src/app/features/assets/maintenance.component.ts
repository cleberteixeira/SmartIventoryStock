import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MaintenanceLog } from '../../core/models/inventory.model';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, DialogModule, InputTextareaModule, DropdownModule, ToastModule, DividerModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="maintenance-page">
      <div class="header">
        <div>
          <h1>Fila de Intervenção Técnica</h1>
          <p class="text-secondary">Equipamentos em reparo ou aguardando limpeza/formatação</p>
        </div>
        <p-button label="Enviar para Manutenção" icon="pi pi-wrench" severity="warning" (onClick)="showSendDialog()"></p-button>
      </div>

      <div class="grid mt-4">
        <div class="col-12">
          <p-table [value]="maintenanceAssets()" styleClass="p-datatable-sm" [rows]="10" [paginator]="true">
            <ng-template pTemplate="header">
              <tr>
                <th>Ativo (SN)</th>
                <th>Modelo</th>
                <th>Localização</th>
                <th>Status Atual</th>
                <th style="width: 150px">Ações</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-asset>
              <tr>
                <td><strong>{{ asset.serial_number }}</strong></td>
                <td>{{ getProductName(asset.product_id) }}</td>
                <td><p-tag [value]="asset.location_id || 'LABORATÓRIO'" severity="secondary"></p-tag></td>
                <td>
                  <p-tag [value]="getStatusLabel(asset.status)" [severity]="getStatusSeverity(asset.status)"></p-tag>
                </td>
                <td>
                  <p-button label="Liberar" icon="pi pi-check" size="small" severity="success" (onClick)="showReturnDialog(asset)"></p-button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="text-center p-5 text-secondary">
                  <i class="pi pi-check-circle mr-2"></i> Tudo limpo! Nenhum equipamento pendente de intervenção.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>

      <!-- Dialog: Enviar para Manutenção -->
      <p-dialog header="Enviar Ativo para Manutenção" [(visible)]="displaySend" [modal]="true" [style]="{width: '500px'}">
        <div class="flex flex-column gap-3 mt-2">
          <div class="field">
            <label class="font-bold block mb-2">Selecione o Ativo (Disponível)</label>
            <p-dropdown [options]="availableAssets()" [(ngModel)]="selectedAsset" 
                        optionLabel="serial_number" placeholder="Bipe ou selecione o SN" 
                        styleClass="w-full" [filter]="true" filterBy="serial_number">
              <ng-template let-asset pTemplate="item">
                <div class="flex flex-column">
                  <span><strong>SN: {{ asset.serial_number }}</strong></span>
                  <small>{{ getProductName(asset.product_id) }}</small>
                </div>
              </ng-template>
            </p-dropdown>
          </div>
          <div class="field">
            <label class="font-bold block mb-2">Motivo / Defeito Relatado</label>
            <textarea pInputTextarea [(ngModel)]="maintenanceNotes" rows="3" class="w-full" placeholder="Ex: Tela quebrada, não liga..."></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancelar" (onClick)="displaySend = false" [text]="true" severity="secondary"></p-button>
          <p-button label="Confirmar Envio" icon="pi pi-send" (onClick)="confirmSend()" 
                    [disabled]="!selectedAsset || !maintenanceNotes" [loading]="processing()" severity="warning"></p-button>
        </ng-template>
      </p-dialog>

      <!-- Dialog: Retornar da Manutenção (COM LAUDO) -->
      <p-dialog header="Concluir Intervenção e Liberar Ativo" [(visible)]="displayReturn" [modal]="true" 
                [style]="{width: '90vw', maxWidth: '600px'}" [draggable]="false">
        <div class="flex flex-column gap-3 mt-2">
          <div class="asset-info-banner p-3 border-round mb-2">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-desktop text-3xl text-blue-500"></i>
              <div>
                <div class="text-sm text-secondary">Equipamento</div>
                <div class="font-bold text-lg">{{ selectedAsset?.serial_number }} - {{ getProductName(selectedAsset?.product_id) }}</div>
              </div>
            </div>
          </div>

          <p-divider align="left"><b>LAUDO TÉCNICO</b></p-divider>

          <div class="field">
            <label class="font-bold block mb-2">Descrição do Serviço Executado</label>
            <textarea pInputTextarea [(ngModel)]="serviceDescription" rows="3" class="w-full" 
                      placeholder="Descreva o que foi feito (ex: Formatação, limpeza interna, troca de pasta térmica...)"></textarea>
          </div>

          <div class="field">
            <label class="font-bold block mb-2">Peças Relacionadas / Trocadas (Opcional)</label>
            <textarea pInputTextarea [(ngModel)]="partsReplaced" rows="2" class="w-full" 
                      placeholder="Ex: 1x SSD 480GB Kingston, 1x Teclado ABNT2..."></textarea>
          </div>

          <p-divider align="left"><b>DESTINAÇÃO</b></p-divider>

          <div class="grid">
            <div class="col-12 md:col-6 field">
              <label class="font-bold block mb-2">Status Pós-Intervenção</label>
              <p-dropdown [options]="returnStatuses" [(ngModel)]="targetStatus" 
                          optionLabel="label" optionValue="value" styleClass="w-full" appendTo="body"></p-dropdown>
            </div>
            <div class="col-12 md:col-6 field">
              <label class="font-bold block mb-2">Endereço de Destino (Estoque)</label>
              <p-dropdown [options]="store.locations()" [(ngModel)]="targetLocation" 
                          optionLabel="id" placeholder="Onde será guardado?" styleClass="w-full" appendTo="body"></p-dropdown>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="flex justify-content-between align-items-center w-full pt-3 border-top-1 surface-border">
            <small class="text-secondary italic">* O laudo será gravado permanentemente no histórico do ativo.</small>
            <div class="flex gap-2">
              <p-button label="Cancelar" (onClick)="displayReturn = false" [text]="true" severity="secondary"></p-button>
              <p-button label="Finalizar e Liberar" icon="pi pi-check" (onClick)="confirmReturn()" 
                        [disabled]="!targetLocation || !serviceDescription" [loading]="processing()" severity="success"></p-button>
            </div>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .asset-info-banner { background: #f8fafc; border: 1px solid #e2e8f0; }
    ::ng-deep .p-inputtextarea { border-radius: 8px; padding: 0.75rem; }
    .field label { font-size: 0.85rem; color: #475569; }
    ::ng-deep .p-divider.p-divider-horizontal { margin: 1rem 0; }
    ::ng-deep .p-divider .p-divider-content { font-size: 0.7rem; color: #94a3b8; letter-spacing: 0.1em; }
  `]
})
export class MaintenanceComponent {
  store = inject(StoreService);
  auth = inject(AuthService);
  messageService = inject(MessageService);

  displaySend = false;
  displayReturn = false;
  processing = signal(false);
  
  selectedAsset: any;
  maintenanceNotes = '';
  
  // Campos do Laudo
  serviceDescription = '';
  partsReplaced = '';
  targetLocation: any;
  targetStatus = 'AVAILABLE';

  maintenanceAssets = computed(() => 
    this.store.assets().filter(a => a.status === 'MAINTENANCE' || a.status === 'PENDING_CLEANING')
  );
  
  availableAssets = computed(() => this.store.assets().filter(a => a.status === 'AVAILABLE'));

  returnStatuses = [
    { label: 'Disponível (Pronto para uso)', value: 'AVAILABLE' },
    { label: 'Avariado (Sem Conserto)', value: 'DAMAGED' }
  ];

  getProductName(id: string) { return this.store.products().find(p => p.id === id)?.name; }

  getStatusLabel(status: string) {
    if (status === 'MAINTENANCE') return 'EM MANUTENÇÃO';
    if (status === 'PENDING_CLEANING') return 'AGUARDANDO LIMPEZA';
    return status;
  }

  getStatusSeverity(status: string): any {
    return status === 'MAINTENANCE' ? 'danger' : 'warning';
  }

  showSendDialog() {
    this.selectedAsset = null;
    this.maintenanceNotes = '';
    this.displaySend = true;
  }

  showReturnDialog(asset: any) {
    this.selectedAsset = asset;
    this.targetLocation = null;
    this.targetStatus = 'AVAILABLE';
    this.serviceDescription = '';
    this.partsReplaced = '';
    this.displayReturn = true;
  }

  async confirmSend() {
    this.processing.set(true);
    try {
      const { error } = await this.store.sendToMaintenance(
        this.selectedAsset.id,
        this.auth.user()?.id!,
        this.maintenanceNotes
      );
      if (error) throw error;
      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ativo enviado para o laboratório' });
      this.displaySend = false;
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message });
    } finally {
      this.processing.set(false);
    }
  }

  async confirmReturn() {
    this.processing.set(true);
    try {
      const userId = this.auth.user()?.id!;
      
      const log: MaintenanceLog = {
        asset_id: this.selectedAsset.id,
        user_id: userId,
        service_description: this.serviceDescription,
        parts_replaced: this.partsReplaced
      };

      const { error } = await this.store.completeMaintenance(
        this.selectedAsset.id,
        userId,
        log,
        this.targetStatus,
        this.targetLocation.id
      );

      if (error) throw error;
      
      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ativo liberado com laudo técnico' });
      this.displayReturn = false;
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message });
    } finally {
      this.processing.set(false);
    }
  }
}