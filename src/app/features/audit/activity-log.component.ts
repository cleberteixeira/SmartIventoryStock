import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TagModule, ButtonModule, InputTextModule, TooltipModule, CardModule],
  template: `
    <div class="audit-page">
      <div class="header">
        <div>
          <h1>Log de Auditoria Global</h1>
          <p class="text-secondary">Rastro completo de todas as operações realizadas no sistema</p>
        </div>
        <div class="flex gap-2">
          <p-button icon="pi pi-refresh" label="Atualizar" [text]="true" (onClick)="store.refresh()"></p-button>
        </div>
      </div>

      <div class="filters-bar mt-4 mb-3">
        <span class="p-input-icon-left w-full md:w-30rem">
          <i class="pi pi-search"></i>
          <input type="text" pInputText [(ngModel)]="filterText" 
                 placeholder="Filtrar por operador, produto ou SN..." class="w-full" />
        </span>
      </div>

      <div class="audit-container">
        <p-table [value]="filteredMovements()" [rows]="15" [paginator]="true" 
                 styleClass="p-datatable-sm p-datatable-striped" [loading]="store.loading()"
                 [showCurrentPageReport]="true" currentPageReportTemplate="{first} a {last} de {totalRecords}">
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 160px">Data/Hora</th>
              <th style="width: 200px">Operador</th>
              <th style="width: 120px">Operação</th>
              <th>Item / Equipamento</th>
              <th>Fluxo Logístico</th>
              <th style="width: 80px" class="text-center">Qtd</th>
              <th>Motivo da Ação</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-m>
            <tr>
              <td>
                <div class="flex flex-column">
                  <span class="font-bold text-sm">{{ m.timestamp | date:'dd/MM/yyyy' }}</span>
                  <span class="text-xs text-secondary">{{ m.timestamp | date:'HH:mm:ss' }}</span>
                </div>
              </td>
              <td>
                <div class="operator-cell">
                  <div class="user-avatar">{{ getUserInitials(m.user_id) }}</div>
                  <div class="flex flex-column" style="line-height: 1.2">
                    <span class="text-sm font-bold">{{ getUserName(m.user_id) }}</span>
                    <span class="text-xs text-secondary mt-1">ID: {{ m.user_id ? m.user_id.substring(0,6) : 'SYS' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <p-tag [value]="getMovementLabel(m.type)" [severity]="getMovementSeverity(m.type)"></p-tag>
              </td>
              <td>
                <div class="flex flex-column">
                  <span class="font-bold text-sm">{{ getProductName(m.product_id) }}</span>
                  @if (m.serial_number) {
                    <span class="sn-badge">SN: {{ m.serial_number }}</span>
                  }
                </div>
              </td>
              <td>
                <div class="flow-container">
                  <span class="loc-tag from">{{ m.from_location || 'EXTERNO' }}</span>
                  <i class="pi pi-arrow-right text-xs text-secondary"></i>
                  <span class="loc-tag to">{{ m.to_location || 'SAÍDA' }}</span>
                </div>
              </td>
              <td class="text-center">
                <span class="qty-circle">{{ m.quantity }}</span>
              </td>
              <td>
                <div class="reason-cell" [pTooltip]="m.reason">
                  {{ m.reason }}
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; }
    .audit-page { padding-bottom: 2rem; }
    
    .operator-cell { display: flex; align-items: center; gap: 12px; }
    .user-avatar { 
      width: 36px; height: 36px; background: #2563eb; color: white; 
      border-radius: 10px; display: flex; align-items: center; justify-content: center; 
      font-size: 0.8rem; font-weight: 800; flex-shrink: 0;
    }

    .sn-badge { 
      font-family: monospace; font-size: 0.7rem; color: #2563eb; 
      background: #eff6ff; padding: 2px 6px; border-radius: 4px; 
      width: fit-content; margin-top: 2px; font-weight: 600;
    }

    .flow-container { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
    .loc-tag { padding: 2px 8px; border-radius: 6px; font-weight: 600; }
    .loc-tag.from { background: #f1f5f9; color: #64748b; }
    .loc-tag.to { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }

    .qty-circle { 
      display: inline-block; width: 24px; height: 24px; line-height: 24px; 
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 50%; 
      font-size: 0.75rem; font-weight: 700; color: #1e293b;
    }

    .reason-cell { 
      font-size: 0.8rem; color: #475569; font-style: italic;
      max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    ::ng-deep .p-datatable .p-datatable-tbody > tr > td { padding: 0.75rem 0.5rem !important; }
  `]
})
export class ActivityLogComponent {
  store = inject(StoreService);
  filterText = '';

  filteredMovements = computed(() => {
    const search = this.filterText.toLowerCase();
    return this.store.movements().filter(m => {
      const prodName = this.getProductName(m.product_id).toLowerCase();
      const userName = this.getUserName(m.user_id).toLowerCase();
      const sn = (m.serial_number || '').toLowerCase();
      const reason = (m.reason || '').toLowerCase();
      
      return prodName.includes(search) || userName.includes(search) || 
             sn.includes(search) || reason.includes(search);
    });
  });

  getProductName(id: string) { return this.store.products().find(p => p.id === id)?.name || 'Produto'; }
  
  getUserName(id: string | undefined) { 
    if (!id) return 'Sistema';
    return this.store.users().find(u => u.id === id)?.full_name || 'Sistema'; 
  }
  
  getUserInitials(id: string | undefined) { 
    const name = this.getUserName(id);
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getMovementLabel(type: string) {
    const map: any = { 'ENTRY': 'ENTRADA', 'EXIT': 'SAÍDA', 'TRANSFER': 'TRANSF.', 'ADJUSTMENT': 'AJUSTE' };
    return map[type] || type;
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