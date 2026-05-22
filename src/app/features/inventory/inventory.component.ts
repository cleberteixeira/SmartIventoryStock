import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InventorySession, InventoryItem } from '../../core/models/inventory.model';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, DialogModule, InputNumberModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="inventory">
      <div class="header">
        <div>
          <h1>Auditoria de Inventário</h1>
          <p class="text-secondary">Realize contagens cíclicas e ajuste divergências de estoque</p>
        </div>
        <div class="flex gap-2">
          <p-button icon="pi pi-refresh" [text]="true" (onClick)="store.refresh()" [loading]="store.loading()"></p-button>
          <p-button label="Abrir Nova Sessão" icon="pi pi-play" severity="success" 
                    (onClick)="startNewSession()" [loading]="creatingSession()"></p-button>
        </div>
      </div>

      <div class="mt-4">
        <p-table [value]="store.inventorySessions()" class="mt-4" styleClass="p-datatable-sm" [loading]="store.loading()">
          <ng-template pTemplate="header">
            <tr>
              <th>ID Sessão</th>
              <th>Início</th>
              <th>Término</th>
              <th>Status</th>
              <th style="width: 250px">Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-session>
            <tr>
              <td><strong>{{ session.id }}</strong></td>
              <td>{{ session.start_date | date:'short' }}</td>
              <td>{{ session.end_date ? (session.end_date | date:'short') : '-' }}</td>
              <td>
                <p-tag [value]="session.status" [severity]="session.status === 'OPEN' ? 'info' : 'success'"></p-tag>
              </td>
              <td>
                <div class="flex gap-2">
                  @if (session.status === 'OPEN') {
                    <p-button icon="pi pi-print" label="Folha" [text]="true" size="small" severity="secondary" (onClick)="printAuditSheet(session)"></p-button>
                    <p-button icon="pi pi-search" label="Auditar" size="small" (onClick)="openAudit(session)"></p-button>
                  } @else {
                    <p-button icon="pi pi-file-pdf" label="Relatório" [text]="true" size="small" severity="secondary"></p-button>
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Dialog de Auditoria -->
      <p-dialog [header]="'Auditoria: ' + activeSession?.id" [(visible)]="displayAudit" [modal]="true" 
                [style]="{width: '90vw', maxWidth: '1000px'}" [maximizable]="true" [draggable]="false">
        
        <p-table [value]="auditItems" styleClass="p-datatable-gridlines p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Produto</th>
              <th>Endereço</th>
              <th style="width: 120px">Saldo Sistema</th>
              <th style="width: 150px">Contagem Física</th>
              <th style="width: 100px">Diferença</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>
                <div class="font-bold">{{ getProductName(item.product_id) }}</div>
                <div class="text-xs text-secondary">ID: {{ item.product_id.substring(0,8) }}</div>
              </td>
              <td><p-tag [value]="item.location_id" severity="secondary"></p-tag></td>
              <td class="text-center">{{ item.expected_quantity }}</td>
              <td>
                <p-inputNumber [(ngModel)]="item.counted_quantity" (onInput)="calculateDiff(item)" 
                               [min]="0" inputStyleClass="w-full text-center font-bold"></p-inputNumber>
              </td>
              <td class="text-center">
                <span [class.text-danger]="item.difference < 0" [class.text-success]="item.difference > 0" class="font-bold">
                  {{ item.difference > 0 ? '+' : '' }}{{ item.difference }}
                </span>
              </td>
            </tr>
          </ng-template>
        </p-table>

        <ng-template pTemplate="footer">
          <div class="flex justify-content-between align-items-center w-full">
            <div class="text-secondary text-sm">
              <i class="pi pi-info-circle"></i> Ao finalizar, o sistema criará movimentos de ajuste automaticamente.
            </div>
            <div class="flex gap-2">
              <p-button label="Cancelar" (onClick)="displayAudit = false" [text]="true" severity="secondary"></p-button>
              <p-button label="Finalizar e Ajustar Estoque" icon="pi pi-check" severity="warning" 
                        (onClick)="finishAudit()" [loading]="processing()"></p-button>
            </div>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .text-danger { color: #ef4444; }
    .text-success { color: #22c55e; }
    ::ng-deep .p-inputnumber-input { padding: 0.5rem !important; }
  `]
})
export class InventoryComponent {
  store = inject(StoreService);
  messageService = inject(MessageService);
  
  displayAudit = false;
  processing = signal(false);
  creatingSession = signal(false);
  activeSession: InventorySession | null = null;
  auditItems: InventoryItem[] = [];

  async startNewSession() {
    this.creatingSession.set(true);
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    const id = `INV-${year}-${random}`;
    
    const { error } = await this.store.startInventorySession(id);
    if (error) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: error.message });
    } else {
      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Sessão ${id} aberta` });
    }
    this.creatingSession.set(false);
  }

  openAudit(session: InventorySession) {
    this.activeSession = session;
    this.auditItems = this.store.stockLevels().map(stock => ({
      session_id: session.id,
      product_id: stock.product_id,
      location_id: stock.location_id,
      expected_quantity: stock.quantity,
      counted_quantity: stock.quantity,
      difference: 0
    }));
    this.displayAudit = true;
  }

  calculateDiff(item: InventoryItem) {
    setTimeout(() => {
      item.difference = (item.counted_quantity || 0) - item.expected_quantity;
    }, 10);
  }

  getProductName(id: string) {
    return this.store.products().find(p => p.id === id)?.name || 'Produto';
  }

  printAuditSheet(session: InventorySession) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('FOLHA DE CONTAGEM DE INVENTÁRIO', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Sessão: ${session.id} | Data: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

    const data = this.store.stockLevels().map(s => [
      s.location_id,
      this.getProductName(s.product_id),
      '________________' // Espaço para contagem física
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['ENDEREÇO', 'PRODUTO / DESCRIÇÃO', 'CONTAGEM FÍSICA']],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }
    });

    doc.save(`Folha_Contagem_${session.id}.pdf`);
  }

  async finishAudit() {
    if (!this.activeSession) return;
    this.processing.set(true);
    const { error } = await this.store.finishInventory(this.activeSession.id, this.auditItems);
    if (error) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: error.message });
    } else {
      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Inventário finalizado' });
      this.displayAudit = false;
    }
    this.processing.set(false);
  }
}