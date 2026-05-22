import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TimelineModule } from 'primeng/timeline';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-traceability',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, CardModule, TimelineModule, TagModule, AutoCompleteModule, BadgeModule, DividerModule],
  template: `
    <div class="traceability-container">
      <div class="page-header mb-4">
        <h1>Rastreabilidade de Ativos</h1>
        <p class="text-secondary">Histórico completo de ciclo de vida e movimentações</p>
      </div>

      <!-- Barra de Busca -->
      <div class="search-section mb-4">
        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <p-autoComplete 
            [(ngModel)]="selectedAssetItem" 
            [suggestions]="filteredAssetSuggestions" 
            (completeMethod)="filterAssets($event)" 
            field="serial_number" 
            placeholder="Bipe ou digite o Número de Série (SN)..." 
            styleClass="w-full"
            inputStyleClass="search-input"
            (onSelect)="onAssetSelect($event)">
            <ng-template let-asset pTemplate="item">
              <div class="flex align-items-center gap-3 py-1">
                <i class="pi pi-desktop text-blue-500"></i>
                <div class="flex flex-column">
                  <span class="font-bold">{{ asset.serial_number }}</span>
                  <small class="text-secondary">{{ getProductName(asset.product_id) }}</small>
                </div>
              </div>
            </ng-template>
          </p-autoComplete>
        </div>
      </div>

      @if (foundAsset()) {
        <!-- Cabeçalho Horizontal de Informações -->
        <p-card styleClass="info-header-card mb-4">
          <div class="flex flex-column md:flex-row gap-4">
            
            <!-- Seção do Ativo -->
            <div class="flex-1 asset-summary">
              <div class="section-label mb-3"><i class="pi pi-box mr-2"></i>DADOS DO ATIVO</div>
              <div class="flex align-items-center gap-3 mb-3">
                <div class="asset-avatar">
                  <i class="pi pi-desktop"></i>
                </div>
                <div>
                  <h2 class="m-0 text-xl">{{ getProductName(foundAsset()!.product_id) }}</h2>
                  <code class="text-blue-600 font-bold">SN: {{ foundAsset()!.serial_number }}</code>
                </div>
              </div>
              <div class="grid-info">
                <div class="info-block">
                  <span class="label">Status</span>
                  <p-tag [value]="getStatusLabel(foundAsset()!.status)" [severity]="getStatusSeverity(foundAsset()!.status)"></p-tag>
                </div>
                <div class="info-block">
                  <span class="label">Categoria</span>
                  <span class="value">{{ getProductCategory(foundAsset()!.product_id) }}</span>
                </div>
                <div class="info-block">
                  <span class="label">Valor Aquisição</span>
                  <span class="value font-bold">{{ foundAsset()!.acquisition_value | currency:'BRL' }}</span>
                </div>
                <div class="info-block">
                  <span class="label">Localização Atual</span>
                  <span class="value">
                    <i class="pi pi-map-marker mr-1"></i>
                    {{ getCurrentLocation() }}
                  </span>
                </div>
              </div>
            </div>

            <p-divider layout="vertical" styleClass="hidden md:block"></p-divider>
            <p-divider styleClass="block md:hidden"></p-divider>

            <!-- Seção do Responsável -->
            <div class="flex-1 user-summary">
              <div class="section-label mb-3"><i class="pi pi-user mr-2"></i>DETENTOR ATUAL</div>
              @if (currentEmployee(); as emp) {
                <div class="flex align-items-center gap-3 mb-3">
                  <div class="user-avatar-circle">
                    {{ getUserInitials(emp.full_name) }}
                  </div>
                  <div>
                    <h2 class="m-0 text-xl">{{ emp.full_name }}</h2>
                    <span class="text-secondary text-sm">{{ emp.email }}</span>
                  </div>
                </div>
                <div class="grid-info">
                  <div class="info-block">
                    <span class="label">Documento (CPF)</span>
                    <span class="value">{{ emp.document }}</span>
                  </div>
                  <div class="info-block">
                    <span class="label">Departamento</span>
                    <span class="value">{{ emp.department }}</span>
                  </div>
                  <div class="info-block">
                    <span class="label">Centro de Custo</span>
                    <span class="value"><code class="cc-code">{{ emp.cost_center || 'N/A' }}</code></span>
                  </div>
                  <div class="info-block">
                    <span class="label">Desde</span>
                    <span class="value">{{ getAssignmentDate() | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
              } @else {
                <div class="empty-user-state">
                  <i class="pi pi-info-circle mr-2"></i>
                  Ativo disponível em estoque. Sem atribuição a colaborador no momento.
                </div>
              }
            </div>
          </div>
        </p-card>

        <!-- Timeline de Atividades -->
        <p-card header="Linha do Tempo de Atividades" styleClass="timeline-card">
          <div class="timeline-header-info mb-4">
            <p-badge [value]="timeline().length.toString()" severity="info"></p-badge>
            <span class="ml-2 text-secondary font-medium">operações registradas no ciclo de vida</span>
          </div>

          <div class="timeline-wrapper">
            <p-timeline [value]="timeline()" align="left" styleClass="compact-timeline">
              <ng-template pTemplate="marker" let-event>
                <span class="marker-dot" [style.backgroundColor]="getEventColor(event.action)">
                  <i [class]="getEventIcon(event.action)"></i>
                </span>
              </ng-template>
              <ng-template pTemplate="content" let-event>
                <div class="event-card">
                  <div class="event-meta">
                    <span class="event-type" [style.color]="getEventColor(event.action)">
                      {{ getActionLabel(event.action) }}
                    </span>
                    <span class="event-time">{{ event.timestamp | date:'dd MMM yyyy, HH:mm' }}</span>
                  </div>
                  
                  <div class="event-desc">
                    @if (event.action === 'CHECKOUT') {
                      Ativo entregue ao colaborador <strong>{{ event.employee_name }}</strong>.
                    } @else if (event.action === 'CHECKIN') {
                      Ativo devolvido e armazenado no endereço <strong>{{ event.to_location }}</strong>.
                    } @else if (event.action === 'TRANSFER') {
                      Movimentação física de <strong>{{ event.from_location }}</strong> para <strong>{{ event.to_location }}</strong>.
                    } @else if (event.action === 'ENTRY') {
                      Entrada inicial no estoque (Endereço: {{ event.to_location }}).
                    } @else if (event.action === 'EXIT') {
                      Saída do estoque (Endereço: {{ event.from_location }}).
                    } @else if (event.action === 'MAINTENANCE') {
                      Enviado para o laboratório de manutenção.
                    }
                  </div>

                  @if (event.notes) {
                    <div class="event-notes">
                      <i class="pi pi-comment mr-1"></i> {{ event.notes }}
                    </div>
                  }
                  
                  <div class="event-footer">
                    <i class="pi pi-user-edit mr-1"></i> Operador: {{ event.operator_name }}
                  </div>
                </div>
              </ng-template>
            </p-timeline>
          </div>
        </p-card>
      } @else if (searched()) {
        <div class="empty-state mt-5">
          <i class="pi pi-search-minus"></i>
          <p>Nenhum ativo encontrado com este Número de Série.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .traceability-container { max-width: 1300px; margin: 0 auto; }
    
    /* Busca */
    .search-section { display: flex; justify-content: center; }
    .search-box { 
      position: relative; width: 100%; max-width: 600px; 
      background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }
    .search-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: #94a3b8; z-index: 1; font-size: 1.2rem; }
    ::ng-deep .search-input { padding: 1.25rem 1.25rem 1.25rem 3.5rem !important; border: none !important; background: transparent !important; font-size: 1.1rem !important; font-weight: 500; }

    /* Header Card */
    ::ng-deep .info-header-card { border-radius: 20px !important; border: none !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important; }
    .section-label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.1em; }
    
    .asset-avatar { width: 48px; height: 48px; background: #eff6ff; color: #2563eb; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .user-avatar-circle { width: 48px; height: 48px; background: #f0fdf4; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; border: 2px solid #dcfce7; }

    .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .info-block { display: flex; flex-direction: column; gap: 2px; }
    .info-block .label { font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .info-block .value { font-size: 0.9rem; color: #1e293b; font-weight: 600; }
    .cc-code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; }

    .empty-user-state { background: #f8fafc; padding: 2rem; border-radius: 12px; border: 1px dashed #cbd5e1; color: #64748b; text-align: center; font-size: 0.9rem; }

    /* Timeline */
    .timeline-wrapper { max-height: 60vh; overflow-y: auto; padding-right: 1rem; }
    .marker-dot { display: flex; width: 2.2rem; height: 2.2rem; align-items: center; justify-content: center; color: #ffffff; border-radius: 50%; font-size: 0.9rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    .event-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; }
    .event-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .event-type { font-weight: 800; font-size: 0.8rem; text-transform: uppercase; }
    .event-time { font-size: 0.75rem; color: #94a3b8; }
    .event-desc { font-size: 0.9rem; color: #334155; }
    .event-notes { margin-top: 0.75rem; padding: 0.5rem 0.75rem; background: white; border-radius: 8px; font-size: 0.85rem; color: #64748b; font-style: italic; border-left: 3px solid #cbd5e1; }
    .event-footer { margin-top: 0.75rem; font-size: 0.75rem; color: #94a3b8; }

    .empty-state { text-align: center; padding: 4rem 0; color: #94a3b8; }
    .empty-state i { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
  `]
})
export class TraceabilityComponent {
  store = inject(StoreService);
  
  selectedAssetItem: any;
  filteredAssetSuggestions: any[] = [];
  
  searched = signal(false);
  foundAsset = signal<any>(null);
  timeline = signal<any[]>([]);

  currentEmployee = computed(() => {
    const asset = this.foundAsset();
    if (!asset || !asset.employee_id) return null;
    return this.store.employees().find(e => e.id === asset.employee_id);
  });

  filterAssets(event: any) {
    const query = event.query.toLowerCase();
    this.filteredAssetSuggestions = this.store.assets().filter(a => 
      a.serial_number.toLowerCase().includes(query) ||
      this.getProductName(a.product_id).toLowerCase().includes(query)
    );
  }

  onAssetSelect(event: any) {
    this.search();
  }

  getProductName(id: string) { return this.store.products().find(p => p.id === id)?.name || 'Produto'; }
  getProductCategory(id: string) { return this.store.products().find(p => p.id === id)?.category || 'N/A'; }
  getEmployeeName(id: string) { return this.store.employees().find(e => e.id === id)?.full_name || 'Desconhecido'; }

  getCurrentLocation() {
    const asset = this.foundAsset();
    if (!asset) return 'N/A';
    
    // Se estiver com funcionário, pega a localização do cadastro dele
    if (asset.employee_id) {
      const emp = this.store.employees().find(e => e.id === asset.employee_id);
      return emp?.location || 'Com Colaborador (Local não definido)';
    }
    
    // Se não, pega o endereço físico do armazém
    return asset.location_id || 'Em Trânsito';
  }

  getUserInitials(name: string) { 
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getAssignmentDate() {
    const lastCheckout = this.timeline().find(e => e.action === 'CHECKOUT');
    return lastCheckout ? lastCheckout.timestamp : null;
  }

  async search() {
    const asset = typeof this.selectedAssetItem === 'string' 
      ? this.store.assets().find(a => a.serial_number.toLowerCase() === this.selectedAssetItem.toLowerCase())
      : this.selectedAssetItem;

    if (asset) {
      this.foundAsset.set(asset);
      this.searched.set(true);
      const history = await this.store.getAssetTimeline(asset.id, asset.serial_number);
      this.timeline.set(history);
    } else {
      this.foundAsset.set(null);
      this.searched.set(true);
    }
  }

  getStatusLabel(status: string) {
    const map: any = { 'AVAILABLE': 'Disponível', 'IN_USE': 'Em Uso', 'MAINTENANCE': 'Manutenção', 'DAMAGED': 'Avariado', 'RETIRED': 'Baixado' };
    return map[status] || status;
  }

  getStatusSeverity(status: string): any {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'IN_USE': return 'info';
      case 'MAINTENANCE': return 'warning';
      case 'DAMAGED': return 'danger';
      default: return 'warning';
    }
  }

  getEventIcon(action: string) {
    switch (action) {
      case 'CHECKOUT': return 'pi pi-external-link';
      case 'CHECKIN': return 'pi pi-download';
      case 'TRANSFER': return 'pi pi-sync';
      case 'ENTRY': return 'pi pi-plus';
      case 'EXIT': return 'pi pi-minus';
      case 'MAINTENANCE': return 'pi pi-wrench';
      default: return 'pi pi-sync';
    }
  }

  getEventColor(action: string) {
    switch (action) {
      case 'CHECKOUT': return '#3b82f6';
      case 'CHECKIN': return '#22c55e';
      case 'TRANSFER': return '#6366f1';
      case 'ENTRY': return '#10b981';
      case 'EXIT': return '#ef4444';
      case 'MAINTENANCE': return '#f59e0b';
      default: return '#94a3b8';
    }
  }

  getActionLabel(action: string) {
    switch (action) {
      case 'CHECKOUT': return 'Atribuição (Saída)';
      case 'CHECKIN': return 'Devolução (Entrada)';
      case 'TRANSFER': return 'Transferência de Local';
      case 'ENTRY': return 'Entrada em Estoque';
      case 'EXIT': return 'Saída de Estoque';
      case 'MAINTENANCE': return 'Manutenção';
      default: return 'Movimentação';
    }
  }
}