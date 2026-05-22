import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Asset } from '../../core/models/inventory.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TableModule, DropdownModule, DividerModule, TagModule, TabViewModule],
  template: `
    <div class="reports-page">
      <div class="header">
        <div>
          <h1>Central de Relatórios</h1>
          <p class="text-secondary">Extração de dados e documentos oficiais do sistema</p>
        </div>
      </div>

      <div class="grid mt-4">
        <!-- Relatórios Rápidos -->
        <div class="col-12 md:col-6">
          <p-card header="Relatórios de Estoque (WMS)">
            <p class="text-sm text-secondary mb-4">Gere listagens completas do saldo atual e endereçamento físico.</p>
            <div class="flex flex-column gap-2">
              <p-button label="Inventário Geral (PDF)" icon="pi pi-file-pdf" severity="danger" (onClick)="exportStockPDF()"></p-button>
              <p-button label="Itens Abaixo do Mínimo" icon="pi pi-exclamation-triangle" [text]="true" severity="danger"></p-button>
            </div>
          </p-card>
        </div>

        <div class="col-12 md:col-6">
          <p-card header="Relatórios de Ativos (ITAM)">
            <p class="text-sm text-secondary mb-4">Listagem de hardware, números de série e termos de responsabilidade.</p>
            <div class="flex flex-column gap-2">
              <p-button label="Ativos Totais (PDF)" icon="pi pi-file-pdf" severity="warning" (onClick)="exportAssetsPDF()"></p-button>
              <p-button label="Ativos em Manutenção" icon="pi pi-wrench" [text]="true" severity="warning"></p-button>
            </div>
          </p-card>
        </div>

        <!-- Seção: Depreciação -->
        <div class="col-12 mt-4">
          <p-card header="Análise de Depreciação Patrimonial" styleClass="depreciation-card">
            <div class="flex flex-column md:flex-row justify-content-between align-items-end gap-3 mb-4">
              <div class="flex-1">
                <label class="block font-bold mb-2 text-sm">Filtrar por Produto (SKU)</label>
                <p-dropdown [options]="store.products()" [(ngModel)]="selectedDepreciationProduct" 
                            optionLabel="name" placeholder="Todas as categorias" 
                            styleClass="w-full" [showClear]="true" [filter]="true" filterBy="name,sku"></p-dropdown>
              </div>
              <p-button label="Exportar Relatório Completo" icon="pi pi-file-export" severity="success" (onClick)="exportDepreciationPDF()"></p-button>
            </div>

            <p-tabView>
              <p-tabPanel header="Resumo Consolidado">
                <p-table [value]="depreciationSummary()" styleClass="p-datatable-sm p-datatable-gridlines">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Categoria / SKU</th>
                      <th class="text-center">Qtd Ativos</th>
                      <th class="text-right">Vlr. Aquisição Total</th>
                      <th class="text-right">Vlr. Contábil Atual</th>
                      <th class="text-center">Depreciação Média</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-item>
                    <tr>
                      <td><span class="font-bold">{{ item.label }}</span></td>
                      <td class="text-center">{{ item.count }}</td>
                      <td class="text-right">{{ item.originalValue | currency:'BRL' }}</td>
                      <td class="text-right text-blue-600 font-bold">{{ item.currentValue | currency:'BRL' }}</td>
                      <td class="text-center">
                        <p-tag [value]="item.depreciationPercent + '%'" [severity]="getDepreciationSeverity(item.depreciationPercent)"></p-tag>
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="footer">
                    <tr>
                      <td colspan="2" class="text-right font-bold">TOTAL PATRIMONIAL:</td>
                      <td class="text-right font-bold">{{ totalOriginalValue() | currency:'BRL' }}</td>
                      <td class="text-right font-bold text-blue-700">{{ totalCurrentValue() | currency:'BRL' }}</td>
                      <td></td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabPanel>
              
              <p-tabPanel header="Relação de Ativos">
                <p-table [value]="detailedAssets()" [rows]="10" [paginator]="true" styleClass="p-datatable-sm p-datatable-striped">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Série (SN)</th>
                      <th>Produto</th>
                      <th class="text-center">Aquisição</th>
                      <th class="text-right">Vlr. Original</th>
                      <th class="text-right">Vlr. Atual</th>
                      <th class="text-center">% Dep.</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-asset>
                    <tr>
                      <td><code class="font-bold">{{ asset.serial_number }}</code></td>
                      <td>{{ asset.product_name }}</td>
                      <td class="text-center">{{ asset.acquisition_date | date:'dd/MM/yyyy' }}</td>
                      <td class="text-right">{{ asset.original_value | currency:'BRL' }}</td>
                      <td class="text-right font-bold text-blue-600">{{ asset.current_value | currency:'BRL' }}</td>
                      <td class="text-center">
                        <span class="text-xs" [class.text-danger]="asset.depreciation_percent > 70">
                          {{ asset.depreciation_percent }}%
                        </span>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabPanel>
            </p-tabView>
          </p-card>
        </div>

        <!-- Dossiê por SKU -->
        <div class="col-12 mt-4">
          <p-card header="Dossiê Técnico por SKU" styleClass="custom-report-card">
            <p class="text-sm text-secondary mb-4">Gere um documento completo com histórico, distribuição e custos de um produto específico.</p>
            <div class="flex flex-column md:flex-row align-items-end gap-3">
              <div class="flex-1">
                <label class="block font-bold mb-2 text-sm">Selecione o Produto</label>
                <p-dropdown [options]="store.products()" [(ngModel)]="selectedProduct" 
                            optionLabel="name" placeholder="Escolha um SKU..." 
                            styleClass="w-full" [filter]="true" filterBy="name,sku"></p-dropdown>
              </div>
              <p-button label="Gerar Dossiê PDF" icon="pi pi-file-export" 
                        [disabled]="!selectedProduct" severity="help" (onClick)="exportSKUPDF()"></p-button>
            </div>
          </p-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .grid { display: flex; flex-wrap: wrap; margin: 0 -0.5rem; }
    .col-12 { width: 100%; padding: 0.5rem; }
    @media (min-width: 768px) { .md\\:col-6 { width: 50%; } }
    ::ng-deep .depreciation-card .p-card-body { padding: 1.5rem !important; }
    ::ng-deep .p-tabview .p-tabview-panels { padding: 1.5rem 0 0 0; }
  `]
})
export class ReportsComponent {
  store = inject(StoreService);
  selectedProduct: Product | null = null;
  selectedDepreciationProduct: Product | null = null;

  private calculateCurrentValue(asset: Asset, product: Product | undefined, targetDate: Date): number {
    const purchaseDate = asset.acquisition_date ? new Date(asset.acquisition_date) : new Date(asset.created_at);
    const monthsOld = (targetDate.getFullYear() - purchaseDate.getFullYear()) * 12 + (targetDate.getMonth() - purchaseDate.getMonth());
    const lifeMonths = product?.depreciation_months || 36;
    const monthlyRate = 1 / lifeMonths;
    if (monthsOld < 0) return asset.acquisition_value || 0;
    const depreciation = Math.min(1, monthsOld * monthlyRate);
    return (asset.acquisition_value || 0) * (1 - depreciation);
  }

  depreciationSummary = computed(() => {
    let assets = this.store.assets().filter(a => a.status !== 'RETIRED');
    const filter = this.selectedDepreciationProduct;
    if (filter) assets = assets.filter(a => a.product_id === filter.id);

    const today = new Date();
    const summaryMap = new Map<string, any>();

    assets.forEach(asset => {
      const product = this.store.products().find(p => p.id === asset.product_id);
      const label = filter ? product?.name || 'N/A' : product?.category || 'OUTROS';
      const currentVal = this.calculateCurrentValue(asset, product, today);
      
      if (!summaryMap.has(label)) {
        summaryMap.set(label, { label, count: 0, originalValue: 0, currentValue: 0 });
      }
      const data = summaryMap.get(label);
      data.count++;
      data.originalValue += (asset.acquisition_value || 0);
      data.currentValue += currentVal;
    });

    return Array.from(summaryMap.values()).map(item => ({
      ...item,
      depreciationPercent: item.originalValue > 0 
        ? Math.round(((item.originalValue - item.currentValue) / item.originalValue) * 100) 
        : 0
    })).sort((a, b) => b.currentValue - a.currentValue);
  });

  detailedAssets = computed(() => {
    const assets = this.store.assets().filter(a => a.status !== 'RETIRED');
    const filter = this.selectedDepreciationProduct;
    const today = new Date();
    let filtered = filter ? assets.filter(a => a.product_id === filter.id) : assets;
    
    return filtered.map(asset => {
      const product = this.store.products().find(p => p.id === asset.product_id);
      const currentVal = this.calculateCurrentValue(asset, product, today);
      return {
        serial_number: asset.serial_number,
        product_name: product?.name || 'N/A',
        acquisition_date: asset.acquisition_date || asset.created_at,
        original_value: asset.acquisition_value || 0,
        current_value: currentVal,
        depreciation_percent: asset.acquisition_value ? Math.round(((asset.acquisition_value - currentVal) / asset.acquisition_value) * 100) : 0
      };
    }).sort((a, b) => b.current_value - a.current_value);
  });

  totalOriginalValue = computed(() => this.depreciationSummary().reduce((acc, curr) => acc + curr.originalValue, 0));
  totalCurrentValue = computed(() => this.depreciationSummary().reduce((acc, curr) => acc + curr.currentValue, 0));

  getDepreciationSeverity(percent: number): any {
    if (percent < 30) return 'success';
    if (percent < 70) return 'warning';
    return 'danger';
  }

  exportDepreciationPDF() {
    const doc = new jsPDF();
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('RELATÓRIO DE DEPRECIAÇÃO PATRIMONIAL', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });

    // Tabela 1: Resumo
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text('1. Resumo Consolidado', 14, 50);
    
    const summaryData = this.depreciationSummary().map(item => [
      item.label,
      item.count,
      'R$ ' + item.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      'R$ ' + item.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      item.depreciationPercent + '%'
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['CATEGORIA / SKU', 'QTD', 'VALOR ORIGINAL', 'VALOR ATUAL', '% DEP.']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }
    });

    // Tabela 2: Detalhamento (Nova página se necessário)
    doc.addPage();
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('2. Relação Detalhada de Ativos', 105, 13, { align: 'center' });

    const detailedData = this.detailedAssets().map(a => [
      a.serial_number,
      a.product_name,
      new Date(a.acquisition_date).toLocaleDateString('pt-BR'),
      'R$ ' + a.original_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      'R$ ' + a.current_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      a.depreciation_percent + '%'
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['SÉRIE (SN)', 'PRODUTO', 'AQUISIÇÃO', 'VLR. ORIGINAL', 'VLR. ATUAL', '% DEP.']],
      body: detailedData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8 }
    });

    doc.save('Relatorio_Depreciacao_Completo.pdf');
  }

  exportSKUPDF() {
    if (!this.selectedProduct) return;
    const doc = new jsPDF();
    const p = this.selectedProduct;
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('DOSSIÊ TÉCNICO DO PRODUTO', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`SKU: ${p.sku} | Gerado em: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text('1. Informações Gerais', 14, 55);
    autoTable(doc, {
      startY: 60,
      body: [['Nome:', p.name], ['Categoria:', p.category], ['Unidade Base:', p.base_unit_measure || p.unit_measure], ['Custo Unitário:', 'R$ ' + p.unit_cost.toLocaleString('pt-BR')], ['Estoque Mínimo:', p.min_stock.toString()]],
      theme: 'plain'
    });
    doc.text('2. Distribuição por Endereço', 14, (doc as any).lastAutoTable.finalY + 15);
    const stockData = this.store.stockLevels().filter(s => s.product_id === p.id && s.quantity > 0).map(s => [s.location_id, s.quantity]);
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 20, head: [['Endereço', 'Quantidade']], body: stockData.length ? stockData : [['-', 'Sem saldo em estoque']], headStyles: { fillColor: [79, 70, 229] } });
    doc.text('3. Histórico de Movimentações', 14, (doc as any).lastAutoTable.finalY + 15);
    const moveData = this.store.movements().filter(m => m.product_id === p.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(m => [new Date(m.timestamp).toLocaleDateString('pt-BR'), m.type, m.from_location || '-', m.to_location || '-', m.quantity, m.reason]);
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 20, head: [['Data', 'Tipo', 'Origem', 'Destino', 'Qtd', 'Motivo']], body: moveData.length ? moveData : [['-', '-', '-', '-', '-', 'Nenhuma movimentação']], headStyles: { fillColor: [79, 70, 229] } });
    doc.save(`Dossie_${p.sku}.pdf`);
  }

  exportStockPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('RELATÓRIO DE INVENTÁRIO (WMS)', 14, 20);
    const data = this.store.stockLevels().filter(s => s.quantity > 0).map(s => {
      const p = this.store.products().find(prod => prod.id === s.product_id);
      return [p?.name || 'N/A', p?.sku || 'N/A', p?.category || 'N/A', s.location_id, s.quantity];
    });
    autoTable(doc, { startY: 35, head: [['Produto', 'SKU', 'Categoria', 'Endereço', 'Qtd']], body: data, headStyles: { fillColor: [220, 38, 38] }, theme: 'grid' });
    doc.save(`Inventario_SmartInventory.pdf`);
  }

  exportAssetsPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('RELATÓRIO DE ATIVOS DE TI (ITAM)', 14, 20);
    const data = this.store.assets().map(a => {
      const p = this.store.products().find(prod => prod.id === a.product_id);
      const e = this.store.employees().find(emp => emp.id === a.employee_id);
      return [a.serial_number, p?.name || 'N/A', a.status, e ? e.full_name : (a.location_id || 'N/A'), 'R$ ' + (a.acquisition_value || 0).toLocaleString('pt-BR')];
    });
    autoTable(doc, { startY: 35, head: [['Série (SN)', 'Modelo', 'Status', 'Responsável/Local', 'Vlr. Aquisição']], body: data, headStyles: { fillColor: [249, 115, 22] }, theme: 'grid' });
    doc.save(`Ativos_SmartInventory.pdf`);
  }
}