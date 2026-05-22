import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Product, Asset } from '../../core/models/inventory.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, ChartModule, ButtonModule, SidebarModule, RouterLink, DividerModule, TableModule, DialogModule, TooltipModule, TranslateModule],
  template: `
    <div class="dashboard">
      <div class="header-mb">
        <h1>{{ 'MENU.DASHBOARD' | translate }}</h1>
        <p class="text-secondary">Visão consolidada de Ativos de TI e Logística</p>
      </div>
      
      <div class="quick-actions mb-4">
        <p-button [label]="'MENU.STOCK' | translate" icon="pi pi-sync" routerLink="/stock" severity="primary"></p-button>
        <p-button [label]="'MENU.ASSIGNMENT' | translate" icon="pi pi-external-link" routerLink="/assignment" severity="success"></p-button>
        <p-button [label]="'MENU.CHECKIN' | translate" icon="pi pi-download" routerLink="/checkin" severity="info"></p-button>
        <p-button label="Atividades" icon="pi pi-history" (onClick)="store.displayTimeline.set(true)" severity="secondary"></p-button>
      </div>

      <!-- KPIs -->
      <div class="grid">
        <div class="col-12 md:col-3">
          <div class="kpi-card total clickable" (click)="openDrilldown('STOCK')" pTooltip="Clique para ver detalhes do estoque">
            <div class="kpi-icon"><i class="pi pi-box"></i></div>
            <div class="kpi-content">
              <span class="label">Total em Estoque</span>
              <span class="value">{{ store.totalStockValue() }}</span>
            </div>
            <i class="pi pi-arrow-up-right drilldown-icon"></i>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="kpi-card success clickable" (click)="openDrilldown('IN_USE')" pTooltip="Clique para ver quem está com cada ativo">
            <div class="kpi-icon"><i class="pi pi-user-check"></i></div>
            <div class="kpi-content">
              <span class="label">Ativos em Uso</span>
              <span class="value">{{ inUseCount() }}</span>
            </div>
            <i class="pi pi-arrow-up-right drilldown-icon"></i>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="kpi-card warning clickable" (click)="openDrilldown('MAINTENANCE')" pTooltip="Clique para ver itens em reparo">
            <div class="kpi-icon"><i class="pi pi-wrench"></i></div>
            <div class="kpi-content">
              <span class="label">Em Manutenção</span>
              <span class="value">{{ maintenanceCount() }}</span>
            </div>
            <i class="pi pi-arrow-up-right drilldown-icon"></i>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="kpi-card info clickable" (click)="openDrilldown('VALUE')" pTooltip="Clique para ver o valor individual depreciado">
            <div class="kpi-icon"><i class="pi pi-dollar"></i></div>
            <div class="kpi-content">
              <span class="label">Valor Contábil</span>
              <span class="value">{{ store.totalDepreciatedValue() | currency:'BRL' }}</span>
            </div>
            <i class="pi pi-arrow-up-right drilldown-icon"></i>
          </div>
        </div>
      </div>

      <div class="grid mt-4">
        <!-- Alertas Críticos -->
        <div class="col-12 lg:col-4">
          <p-card header="Alertas de Atenção" styleClass="alerts-card h-full">
            <div class="flex flex-column gap-3">
              @if (store.lowStockProducts().length === 0 && store.expiringWarranties().length === 0) {
                <div class="empty-alerts">
                  <i class="pi pi-check-circle text-green-500 text-3xl"></i>
                  <p>Nenhuma pendência crítica detectada.</p>
                </div>
              }

              @for (p of store.lowStockProducts(); track p.id) {
                <div class="alert-item low-stock" routerLink="/products" [queryParams]="{q: p.sku}">
                  <i class="pi pi-exclamation-triangle"></i>
                  <div class="flex-1">
                    <div class="alert-title">Estoque Crítico: {{ p.name }}</div>
                    <div class="alert-sub">Saldo: {{ p.current_stock }} (Mínimo: {{ p.min_stock }})</div>
                  </div>
                  <i class="pi pi-chevron-right text-xs"></i>
                </div>
              }

              @for (a of store.expiringWarranties(); track a.id) {
                <div class="alert-item warranty" routerLink="/assets" [queryParams]="{searchQuery: a.serial_number}">
                  <i class="pi pi-calendar-times"></i>
                  <div class="flex-1">
                    <div class="alert-title">Garantia Expirando: {{ a.serial_number }}</div>
                    <div class="alert-sub">Vence em: {{ a.warranty_expiry | date:'shortDate' }}</div>
                  </div>
                  <i class="pi pi-chevron-right text-xs"></i>
                </div>
              }
            </div>
          </p-card>
        </div>

        <!-- Gráfico de Depreciação -->
        <div class="col-12 lg:col-8">
          <p-card header="Projeção de Depreciação (Próximos 12 meses)">
            <p-chart type="line" [data]="depreciationTimelineData()" [options]="lineOptions" height="300px"></p-chart>
          </p-card>
        </div>
      </div>

      <!-- Gráficos Secundários -->
      <div class="grid mt-4">
        <div class="col-12 lg:col-4">
          <p-card header="Valor por Centro de Custo">
            <p-chart type="bar" [data]="costCenterData()" [options]="barOptions" height="250px"></p-chart>
          </p-card>
        </div>
        <div class="col-12 lg:col-4">
          <p-card header="Status da Frota ITAM">
            <p-chart type="doughnut" [data]="itamChartData()" [options]="chartOptions" height="250px"></p-chart>
          </p-card>
        </div>
        <div class="col-12 lg:col-4">
          <p-card header="Giro de Estoque (Top 5)">
            <p-chart type="bar" [data]="topSkusChartData()" [options]="barOptions" height="250px"></p-chart>
          </p-card>
        </div>
      </div>

      <!-- Modal de Drilldown -->
      <p-dialog [header]="drilldownTitle()" [(visible)]="displayDrilldown" [modal]="true" 
                [style]="{width: '90vw', maxWidth: '1100px'}" [maximizable]="true" [draggable]="false">
        <p-table [value]="drilldownData()" [rows]="10" [paginator]="true" 
                 styleClass="p-datatable-sm p-datatable-gridlines custom-drilldown-table">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="product_name">PRODUTO / MODELO <p-sortIcon field="product_name"></p-sortIcon></th>
              @if (currentDrilldownType() !== 'STOCK') {
                <th pSortableColumn="serial_number">NÚMERO DE SÉRIE <p-sortIcon field="serial_number"></p-sortIcon></th>
              }
              @if (currentDrilldownType() === 'IN_USE') {
                <th pSortableColumn="employee_name">RESPONSÁVEL <p-sortIcon field="employee_name"></p-sortIcon></th>
              } @else {
                <th pSortableColumn="location_id">LOCALIZAÇÃO <p-sortIcon field="location_id"></p-sortIcon></th>
              }
              @if (currentDrilldownType() === 'VALUE') {
                <th pSortableColumn="original_value" class="text-right">VLR. ORIGINAL <p-sortIcon field="original_value"></p-sortIcon></th>
                <th pSortableColumn="current_value" class="text-right">VLR. ATUAL <p-sortIcon field="current_value"></p-sortIcon></th>
              } @else {
                <th pSortableColumn="quantity" class="text-center" style="width: 120px">QTD <p-sortIcon field="quantity"></p-sortIcon></th>
              }
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>
                <div class="flex flex-column gap-1">
                  <span class="font-bold text-primary-dark">{{ item.product_name }}</span>
                  <span class="sku-label">SKU: {{ item.sku }}</span>
                </div>
              </td>
              @if (currentDrilldownType() !== 'STOCK') {
                <td><code class="sn-code">{{ item.serial_number }}</code></td>
              }
              <td>
                @if (item.employee_name) {
                  <div class="flex align-items-center gap-2">
                    <div class="avatar-mini">{{ item.employee_name.substring(0,1) }}</div>
                    <span class="font-medium">{{ item.employee_name }}</span>
                  </div>
                } @else {
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-map-marker text-blue-500"></i>
                    <p-tag [value]="item.location_id || 'N/A'" severity="secondary" styleClass="text-xs font-bold"></p-tag>
                  </div>
                }
              </td>
              <td [class.text-right]="currentDrilldownType() === 'VALUE'" [class.text-center]="currentDrilldownType() !== 'VALUE'">
                @if (currentDrilldownType() === 'VALUE') {
                  <div class="flex flex-column align-items-end">
                    <span class="text-xs text-secondary strike">{{ item.original_value | currency:'BRL' }}</span>
                    <span class="font-bold text-blue-600">{{ item.current_value | currency:'BRL' }}</span>
                  </div>
                } @else {
                  <span class="qty-badge">{{ item.quantity }}</span>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-dialog>
    </div>
  `,
  styles: [`
    .header-mb { margin-bottom: 2rem; }
    .quick-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
    .kpi-card { background: var(--topbar-bg); padding: 1.5rem; border-radius: 16px; display: flex; align-items: center; gap: 1.5rem; border: 1px solid var(--border-color); position: relative; transition: all 0.2s ease; }
    .kpi-card.clickable { cursor: pointer; }
    .kpi-card.clickable:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); border-color: var(--primary-color); }
    .drilldown-icon { position: absolute; top: 1rem; right: 1rem; font-size: 0.7rem; color: #94a3b8; opacity: 0; transition: 0.2s; }
    .kpi-card:hover .drilldown-icon { opacity: 1; }
    .kpi-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .total .kpi-icon { background: #eff6ff; color: #3b82f6; }
    .success .kpi-icon { background: #dcfce7; color: #16a34a; }
    .warning .kpi-icon { background: #fff7ed; color: #f97316; }
    .info .kpi-icon { background: #f0fdfa; color: #0d9488; }
    .kpi-content .label { font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-content .value { font-size: 1.75rem; font-weight: 800; color: var(--text-main); display: block; }
    
    .alert-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
    .alert-item:hover { background: #f8fafc; border-color: #e2e8f0; }
    .alert-item i:first-child { font-size: 1.2rem; }
    .alert-item.low-stock { color: #dc2626; }
    .alert-item.warranty { color: #d97706; }
    .alert-title { font-size: 0.85rem; font-weight: 700; }
    .alert-sub { font-size: 0.75rem; color: #64748b; }
    .empty-alerts { text-align: center; padding: 2rem 0; color: #64748b; }

    .sn-code { background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-weight: 700; font-size: 0.85rem; border: 1px solid #dbeafe; }
    .qty-badge { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.9rem; }
    .avatar-mini { width: 24px; height: 24px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; }
    
    .grid { display: flex; flex-wrap: wrap; margin: 0 -0.5rem; }
    .col-12 { width: 100%; padding: 0.5rem; }
    @media (min-width: 768px) { .md\\:col-3 { width: 25%; } }
  `]
})
export class DashboardComponent {
  store = inject(StoreService);
  
  displayDrilldown = false;
  drilldownTitle = signal('');
  currentDrilldownType = signal('');
  drilldownData = signal<any[]>([]);

  chartColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  inUseCount = computed(() => this.store.assets().filter(a => a.status === 'IN_USE').length);
  maintenanceCount = computed(() => this.store.assets().filter(a => a.status === 'MAINTENANCE' || a.status === 'PENDING_CLEANING').length);

  openDrilldown(type: string) {
    this.currentDrilldownType.set(type);
    let data: any[] = [];

    switch (type) {
      case 'STOCK':
        this.drilldownTitle.set('Detalhamento de Itens em Estoque');
        data = this.store.stockLevels()
          .filter(s => s.quantity > 0)
          .map(s => {
            const p = this.store.products().find(prod => prod.id === s.product_id);
            return { product_name: p?.name, sku: p?.sku, location_id: s.location_id, quantity: s.quantity };
          });
        break;
      case 'IN_USE':
        this.drilldownTitle.set('Ativos Atribuídos a Colaboradores');
        data = this.store.assets()
          .filter(a => a.status === 'IN_USE')
          .map(a => {
            const p = this.store.products().find(prod => prod.id === a.product_id);
            const e = this.store.employees().find(emp => emp.id === a.employee_id);
            return { product_name: p?.name, sku: p?.sku, serial_number: a.serial_number, employee_name: e?.full_name, quantity: 1 };
          });
        break;
      case 'MAINTENANCE':
        this.drilldownTitle.set('Ativos em Intervenção Técnica');
        data = this.store.assets()
          .filter(a => a.status === 'MAINTENANCE' || a.status === 'PENDING_CLEANING')
          .map(a => {
            const p = this.store.products().find(prod => prod.id === a.product_id);
            return { product_name: p?.name, sku: p?.sku, serial_number: a.serial_number, location_id: a.location_id || 'LABORATÓRIO', quantity: 1 };
          });
        break;
      case 'VALUE':
        this.drilldownTitle.set('Análise de Valor Contábil (Depreciação)');
        const today = new Date();
        data = this.store.assets()
          .filter(a => a.status !== 'RETIRED')
          .map(a => {
            const p = this.store.products().find(prod => prod.id === a.product_id);
            const currentVal = this.calculateCurrentValue(a, p, today);
            return { product_name: p?.name, sku: p?.sku, serial_number: a.serial_number, location_id: a.location_id || 'EM USO', original_value: a.acquisition_value, current_value: currentVal };
          }).sort((a, b) => b.current_value - a.current_value);
        break;
    }

    this.drilldownData.set(data);
    this.displayDrilldown = true;
  }

  private calculateCurrentValue(asset: Asset, product: Product | undefined, targetDate: Date): number {
    const purchaseDate = asset.acquisition_date ? new Date(asset.acquisition_date) : new Date(asset.created_at);
    const monthsOld = (targetDate.getFullYear() - purchaseDate.getFullYear()) * 12 + (targetDate.getMonth() - purchaseDate.getMonth());
    const lifeMonths = product?.depreciation_months || 36;
    const monthlyRate = 1 / lifeMonths;
    const depreciation = Math.min(1, Math.max(0, monthsOld * monthlyRate));
    return (asset.acquisition_value || 0) * (1 - depreciation);
  }

  depreciationTimelineData = computed(() => {
    const today = new Date();
    const labels = [];
    for (let i = 0; i < 12; i++) {
      const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      labels.push(futureDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
    }
    const assets = this.store.assets().filter(a => a.status !== 'RETIRED');
    const productsWithAssets = Array.from(new Set(assets.map(a => a.product_id)));
    const skuValues = productsWithAssets.map(pid => {
      const productAssets = assets.filter(a => a.product_id === pid);
      const currentVal = productAssets.reduce((acc, a) => {
        const p = this.store.products().find(prod => prod.id === a.product_id);
        return acc + this.calculateCurrentValue(a, p, today);
      }, 0);
      return { pid, value: currentVal };
    }).sort((a, b) => b.value - a.value);
    const topSkus = skuValues.slice(0, 7);
    const datasets = topSkus.map((sku, index) => {
      const product = this.store.products().find(p => p.id === sku.pid);
      const productAssets = assets.filter(a => a.product_id === sku.pid);
      const data = [];
      for (let i = 0; i < 12; i++) {
        const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        data.push(productAssets.reduce((acc, a) => acc + this.calculateCurrentValue(a, product, futureDate), 0));
      }
      return { label: product?.name || 'Desconhecido', data: data, fill: true, borderColor: this.chartColors[index % this.chartColors.length], backgroundColor: this.chartColors[index % this.chartColors.length] + '44', tension: 0.4 };
    });
    return { labels, datasets };
  });

  costCenterData = computed(() => {
    const ccs = Array.from(new Set(this.store.employees().map(e => e.cost_center).filter(c => c)));
    const values = ccs.map(cc => {
      const empIds = this.store.employees().filter(e => e.cost_center === cc).map(e => e.id);
      return this.store.assets().filter(a => a.employee_id && empIds.includes(a.employee_id)).reduce((acc, curr) => acc + (Number(curr.acquisition_value) || 0), 0);
    });
    return { labels: ccs, datasets: [{ label: 'Valor Alocado (R$)', data: values, backgroundColor: '#4f46e5', borderRadius: 6 }] };
  });

  itamChartData = computed(() => {
    return {
      labels: ['Disponível', 'Em Uso', 'Manutenção'],
      datasets: [{ data: [this.availableCount(), this.inUseCount(), this.maintenanceCount()], backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b'], borderWidth: 0 }]
    };
  });

  topSkusChartData = computed(() => {
    const movements = this.store.movements();
    const counts: any = {};
    movements.forEach(m => { counts[m.product_id] = (counts[m.product_id] || 0) + m.quantity; });
    const sorted = Object.entries(counts).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5);
    return {
      labels: sorted.map(([id]) => this.getProductName(id)),
      datasets: [{ label: 'Volume', data: sorted.map(([, qty]) => qty), backgroundColor: '#8b5cf6', borderRadius: 6 }]
    };
  });

  availableCount = computed(() => this.store.assets().filter(a => a.status === 'AVAILABLE').length);
  getProductName(id: string) { return this.store.products().find(p => p.id === id)?.name || 'Produto'; }
  
  lineOptions = { plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } }, tooltip: { mode: 'index', intersect: false } }, scales: { y: { stacked: true, beginAtZero: true, ticks: { callback: (v: any) => 'R$ ' + v.toLocaleString() } }, x: { stacked: true } }, maintainAspectRatio: false };
  chartOptions = { plugins: { legend: { position: 'bottom' } }, cutout: '70%', maintainAspectRatio: false };
  barOptions = { plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } };
}