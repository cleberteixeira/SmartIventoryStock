import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { Product } from '../../core/models/inventory.model';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, TagModule, ButtonModule, 
    DialogModule, InputTextModule, DropdownModule, InputNumberModule, 
    InputSwitchModule, InputTextareaModule, ToastModule, TooltipModule, 
    ConfirmDialogModule, ProgressBarModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="products-page">
      <div class="header">
        <div>
          <h1>Catálogo de Produtos</h1>
          <p class="text-secondary">Gerencie o mestre de materiais e parâmetros de estoque</p>
        </div>
        <div class="flex gap-2">
          <p-button icon="pi pi-refresh" [text]="true" (onClick)="store.refresh()" [loading]="store.loading()"></p-button>
          <p-button label="Novo Produto" icon="pi pi-plus" (onClick)="showDialog()"></p-button>
        </div>
      </div>

      <div class="filters mt-3 mb-3">
        <span class="p-input-icon-left w-full md:w-25rem">
          <i class="pi pi-search"></i>
          <input pInputText type="text" [(ngModel)]="searchQuery" placeholder="Filtrar produtos..." class="w-full" />
        </span>
      </div>

      <p-table [value]="filteredProducts()" [rows]="10" [paginator]="true" class="mt-4" 
               styleClass="p-datatable-sm" [loading]="store.loading()">
        <ng-template pTemplate="header">
          <tr>
            <th>SKU</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Saúde do Estoque</th>
            <th>Estoque Atual</th>
            <th>Status</th>
            <th style="width: 220px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-product>
          <tr>
            <td><strong>{{ product.sku }}</strong></td>
            <td>{{ product.name }}</td>
            <td>
              <p-tag [value]="product.category" [severity]="getCategorySeverity(product.category)"></p-tag>
            </td>
            <td>
              <div class="stock-health-container">
                <p-progressBar [value]="getStockHealth(product)" [showValue]="false" 
                               [styleClass]="getHealthClass(product)"></p-progressBar>
                <small class="health-label" [class]="getHealthClass(product)">{{ getHealthLabel(product) }}</small>
              </div>
            </td>
            <td>
              <div class="font-bold text-blue-600">
                {{ store.formatQuantity(product.id, store.getProductTotalStock(product.id)) }}
              </div>
            </td>
            <td>
              <p-tag [value]="product.status" [severity]="product.status === 'ACTIVE' ? 'success' : 'danger'"></p-tag>
            </td>
            <td>
              <div class="flex gap-1">
                <p-button icon="pi pi-history" [text]="true" size="small" severity="help"
                          (onClick)="viewHistory(product)" pTooltip="Histórico de Movimentações"></p-button>
                
                @if (product.requires_serial_number) {
                  <p-button icon="pi pi-desktop" [text]="true" size="small" severity="info"
                            (onClick)="goToAssets(product)" pTooltip="Ver Ativos (SN)"></p-button>
                }
                
                <p-button icon="pi pi-search-plus" [text]="true" size="small" 
                          (onClick)="viewStock(product)" pTooltip="Ver Distribuição"></p-button>
                <p-button icon="pi pi-pencil" [text]="true" size="small" severity="secondary"
                          (onClick)="editProduct(product)" pTooltip="Editar"></p-button>
                <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger"
                          (onClick)="confirmDelete(product)" pTooltip="Excluir"></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Dialog de Cadastro/Edição -->
      <p-dialog [header]="isEditMode ? 'Editar Produto' : 'Cadastrar Novo Produto'" [(visible)]="displayDialog" [modal]="true" 
                [style]="{width: '90vw', maxWidth: '800px'}" [draggable]="false" [resizable]="false">
        
        <div class="form-content">
          <div class="form-section">
            <h3 class="section-header"><i class="pi pi-tag"></i> IDENTIFICAÇÃO E CUSTO</h3>
            <div class="grid">
              <div class="col-12 md:col-4 field">
                <label>SKU (Código Interno)</label>
                <input pInputText [(ngModel)]="newProduct.sku" placeholder="Ex: CAFE-PILAO-250" [disabled]="isEditMode" />
              </div>
              <div class="col-12 md:col-4 field">
                <label>EAN (Cód. Barras)</label>
                <input pInputText [(ngModel)]="newProduct.ean" placeholder="789..." />
              </div>
              <div class="col-12 md:col-4 field">
                <label>Custo Unitário (R$)</label>
                <p-inputNumber [(ngModel)]="newProduct.unit_cost" mode="currency" currency="BRL" locale="pt-BR" styleClass="w-full"></p-inputNumber>
              </div>
              <div class="col-12 field">
                <label>Nome do Produto</label>
                <input pInputText [(ngModel)]="newProduct.name" placeholder="Descrição completa do item" />
              </div>
            </div>
          </div>

          <div class="form-section mt-3">
            <h3 class="section-header"><i class="pi pi-box"></i> LOGÍSTICA E CONVERSÃO</h3>
            <div class="grid">
              <div class="col-12 md:col-4 field">
                <label>Unidade de Compra (Master)</label>
                <p-dropdown [options]="unitOptions" [(ngModel)]="newProduct.unit_measure" 
                            optionLabel="label" optionValue="value"
                            placeholder="Ex: CX (Caixa)" styleClass="w-full" appendTo="body"></p-dropdown>
              </div>
              <div class="col-12 md:col-4 field">
                <label>Fator de Conversão</label>
                <p-inputNumber [(ngModel)]="newProduct.conversion_factor" [min]="1" 
                               placeholder="Ex: 10 (itens por caixa)" styleClass="w-full"></p-inputNumber>
              </div>
              <div class="col-12 md:col-4 field">
                <label>Unidade de Estoque (Base)</label>
                <p-dropdown [options]="unitOptions" [(ngModel)]="newProduct.base_unit_measure" 
                            optionLabel="label" optionValue="value"
                            placeholder="Ex: UN (Unidade)" styleClass="w-full" appendTo="body"></p-dropdown>
              </div>
            </div>
          </div>

          <div class="form-section mt-3">
            <h3 class="section-header"><i class="pi pi-sliders-h"></i> PARÂMETROS E STATUS</h3>
            <div class="grid">
              <div class="col-12 md:col-4 field">
                <label>Categoria</label>
                <p-dropdown [options]="dynamicCategories()" [(ngModel)]="newProduct.category" 
                            placeholder="Selecione" styleClass="w-full" [editable]="true"
                            appendTo="body"></p-dropdown>
              </div>
              <div class="col-12 md:col-4 field">
                <label>Estoque Mínimo (Base)</label>
                <p-inputNumber [(ngModel)]="newProduct.min_stock" [min]="0" styleClass="w-full"></p-inputNumber>
              </div>
              <div class="col-12 md:col-4 field">
                <label>Vida Útil (Depreciação)</label>
                <p-inputNumber [(ngModel)]="newProduct.depreciation_months" [min]="1" styleClass="w-full" suffix=" meses"></p-inputNumber>
              </div>
              
              <div class="col-12 md:col-6 field mt-3">
                <label>Status</label>
                <p-dropdown [options]="statuses" [(ngModel)]="newProduct.status" styleClass="w-full" 
                            optionLabel="label" optionValue="value" appendTo="body"></p-dropdown>
              </div>
              <div class="col-12 md:col-6 mt-3">
                <div class="flex align-items-center gap-3 p-2 border-round surface-100">
                  <p-inputSwitch [(ngModel)]="newProduct.requires_serial_number"></p-inputSwitch>
                  <div>
                    <div class="font-bold text-sm">Exige Número de Série</div>
                    <small class="text-secondary">Rastreamento individual (ITAM).</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <p-button label="Cancelar" (onClick)="displayDialog = false" [text]="true" severity="secondary"></p-button>
            <p-button [label]="isEditMode ? 'Atualizar Produto' : 'Salvar Produto'" icon="pi pi-check" (onClick)="saveProduct()" 
                      [disabled]="!newProduct.sku || !newProduct.name" severity="primary" [loading]="saving()"></p-button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Dialog de Distribuição -->
      <p-dialog [header]="'Distribuição de Estoque: ' + selectedProduct?.name" [(visible)]="displayStock" 
                [modal]="true" [style]="{width: '90vw', maxWidth: '500px'}" [draggable]="false">
        <p-table [value]="productStock" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Endereço</th>
              <th class="text-right">Quantidade</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td><p-tag [value]="item.location_id" severity="secondary"></p-tag></td>
              <td class="text-right font-bold">
                {{ store.formatQuantity(selectedProduct!.id, item.quantity) }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-dialog>

      <!-- Dialog de Histórico de SKU -->
      <p-dialog [header]="'Rastreabilidade de SKU: ' + selectedProduct?.name" [(visible)]="displayHistory" 
                [modal]="true" [style]="{width: '90vw', maxWidth: '900px'}" [draggable]="false">
        <p-table [value]="skuMovements" [rows]="10" [paginator]="true" styleClass="p-datatable-sm p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Data/Hora</th>
              <th>Tipo</th>
              <th>Origem</th>
              <th>Destino</th>
              <th class="text-right">Qtd</th>
              <th>Motivo</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-m>
            <tr>
              <td>{{ m.timestamp | date:'dd/MM/yy HH:mm' }}</td>
              <td>
                <p-tag [value]="m.type" [severity]="getMovementSeverity(m.type)"></p-tag>
              </td>
              <td><span class="text-xs">{{ m.from_location || 'EXTERNO' }}</span></td>
              <td><span class="text-xs">{{ m.to_location || 'SAÍDA' }}</span></td>
              <td class="text-right font-bold">{{ m.quantity }}</td>
              <td><small>{{ m.reason }}</small></td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-4">Nenhuma movimentação encontrada para este SKU.</td>
            </tr>
          </ng-template>
        </p-table>
      </p-dialog>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header { font-size: 0.7rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 6px; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.25rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.5rem; }
    .field label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 0.5rem; border-top: 1px solid #f1f5f9; }
    .grid { display: flex; flex-wrap: wrap; margin: 0 -0.5rem; }
    .col-12 { width: 100%; padding: 0.25rem 0.5rem; }
    @media (min-width: 768px) { .md\\:col-6 { width: 50%; } .md\\:col-4 { width: 33.33%; } }
    ::ng-deep .p-inputtext, ::ng-deep .p-dropdown, ::ng-deep .p-inputnumber { width: 100%; border-radius: 8px; }
    ::ng-deep .p-dialog-content { padding: 1.5rem 2rem !important; overflow: visible !important; }
    
    .stock-health-container { width: 120px; }
    .health-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-top: 4px; display: block; }
    
    /* Cores da Barra de Progresso */
    ::ng-deep .health-empty .p-progressbar { background: #fee2e2 !important; }
    ::ng-deep .health-empty .p-progressbar-value { background: #991b1b !important; }
    ::ng-deep .health-empty.health-label { color: #991b1b; }

    ::ng-deep .health-critical .p-progressbar-value { background: #ef4444 !important; }
    ::ng-deep .health-critical.health-label { color: #ef4444; }

    ::ng-deep .health-warning .p-progressbar-value { background: #f59e0b !important; }
    ::ng-deep .health-warning.health-label { color: #d97706; }

    ::ng-deep .health-good .p-progressbar-value { background: #10b981 !important; }
    ::ng-deep .health-good.health-label { color: #059669; }

    ::ng-deep .health-excess .p-progressbar-value { background: #3b82f6 !important; }
    ::ng-deep .health-excess.health-label { color: #2563eb; }
  `]
})
export class ProductListComponent implements OnInit {
  store = inject(StoreService);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  
  searchQuery = '';
  displayDialog = false;
  displayStock = false;
  displayHistory = false;
  isEditMode = false;
  saving = signal(false);
  selectedProduct: Product | null = null;
  productStock: any[] = [];
  skuMovements: any[] = [];

  unitOptions = [
    { label: 'UN (Unidade)', value: 'UN' },
    { label: 'CX (Caixa)', value: 'CX' },
    { label: 'PC (Pacote)', value: 'PC' },
    { label: 'KG (Quilo)', value: 'KG' },
    { label: 'L (Litro)', value: 'L' }
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['q']) this.searchQuery = params['q'];
    });
  }

  filteredProducts = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return this.store.products().filter(p => 
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  });

  dynamicCategories = computed(() => {
    const existing = this.store.products().map(p => p.category);
    const defaults = ['FOOD', 'ELECTRONICS', 'OFFICE', 'CLEANING', 'INFRASTRUCTURE'];
    return Array.from(new Set([...defaults, ...existing])).sort();
  });

  statuses = [
    { label: 'Ativo', value: 'ACTIVE' },
    { label: 'Inativo', value: 'INACTIVE' }
  ];

  newProduct: Partial<Product> = this.resetProduct();

  resetProduct(): Partial<Product> {
    return {
      sku: '', ean: '', name: '', description: '', category: 'OFFICE',
      unit_measure: 'UN', base_unit_measure: 'UN', conversion_factor: 1,
      unit_cost: 0, min_stock: 0, depreciation_months: 36, status: 'ACTIVE',
      requires_serial_number: false
    };
  }

  getStockHealth(product: Product): number {
    const current = this.store.getProductTotalStock(product.id);
    const min = product.min_stock || 1;
    
    if (current === 0) return 100; // Mostra a barra cheia com a cor de 'empty' (vermelho escuro)
    if (current <= min) return (current / min) * 100; 
    return 100; // Acima do mínimo a barra fica cheia (verde ou azul)
  }

  getHealthClass(product: Product): string {
    const current = this.store.getProductTotalStock(product.id);
    const min = product.min_stock;
    
    if (current === 0) return 'health-empty';
    if (current <= min * 0.5) return 'health-critical';
    if (current <= min) return 'health-warning';
    if (current >= min * 3) return 'health-excess';
    return 'health-good';
  }

  getHealthLabel(product: Product): string {
    const current = this.store.getProductTotalStock(product.id);
    const min = product.min_stock;
    
    if (current === 0) return 'Sem Estoque';
    if (current <= min * 0.5) return 'Crítico';
    if (current <= min) return 'Baixo';
    if (current >= min * 3) return 'Excesso';
    return 'Saudável';
  }

  showDialog() {
    this.newProduct = this.resetProduct();
    this.isEditMode = false;
    this.displayDialog = true;
  }

  editProduct(product: Product) {
    this.newProduct = { ...product };
    this.isEditMode = true;
    this.displayDialog = true;
  }

  confirmDelete(product: Product) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o produto <b>\${product.name}</b>?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        const { error } = await this.store.deleteProduct(product.id);
        if (error) {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não é possível excluir produtos com saldo.' });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto removido' });
        }
      }
    });
  }

  viewStock(product: Product) {
    this.selectedProduct = product;
    this.productStock = this.store.stockLevels().filter(s => s.product_id === product.id && s.quantity > 0);
    this.displayStock = true;
  }

  viewHistory(product: Product) {
    this.selectedProduct = product;
    this.skuMovements = this.store.movements()
      .filter(m => m.product_id === product.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    this.displayHistory = true;
  }

  goToAssets(product: Product) {
    this.router.navigate(['/assets'], { queryParams: { searchQuery: product.name } });
  }

  async saveProduct() {
    this.saving.set(true);
    try {
      let result = this.isEditMode ? await this.store.updateProduct(this.newProduct as Product) : await this.store.addProduct(this.newProduct as Product);
      if (result.error) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: result.error.message });
      } else {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto salvo' });
        this.displayDialog = false;
      }
    } finally {
      this.saving.set(false);
    }
  }

  getCategorySeverity(category: string): any {
    switch (category) {
      case 'FOOD': return 'warning';
      case 'ELECTRONICS': return 'info';
      case 'OFFICE': return 'secondary';
      case 'CLEANING': return 'success';
      default: return 'info';
    }
  }

  getMovementSeverity(type: string): any {
    switch (type) {
      case 'ENTRY': return 'success';
      case 'EXIT': return 'danger';
      case 'TRANSFER': return 'info';
      default: return 'warning';
    }
  }
}