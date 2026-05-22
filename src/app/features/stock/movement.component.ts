import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MovementType, Product } from '../../core/models/inventory.model';

@Component({
  selector: 'app-movement',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DropdownModule, MultiSelectModule, InputNumberModule, 
    InputTextModule, InputTextareaModule, CalendarModule, ButtonModule, CardModule, 
    TagModule, ToastModule, TooltipModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="movement-page">
      <div class="header-compact flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Movimentação de Estoque</h1>
          <p class="text-secondary">Registre entradas, saídas e transferências entre endereços</p>
        </div>
        <p-button icon="pi pi-refresh" [text]="true" (onClick)="store.refresh()" pTooltip="Sincronizar Dados"></p-button>
      </div>
      
      <div class="grid mt-2">
        <div class="col-12 lg:col-7">
          <p-card styleClass="compact-card">
            <div class="form-content">
              <div class="form-section">
                <h3 class="section-header"><i class="pi pi-box"></i> ITEM E OPERAÇÃO</h3>
                <div class="grid">
                  <div class="col-12 md:col-6 field">
                    <label>Produto</label>
                    <p-dropdown [options]="store.products()" 
                                [ngModel]="selectedProduct()" 
                                (ngModelChange)="onProductChange($event)"
                                optionLabel="name" placeholder="Selecione um produto" 
                                styleClass="w-full" [filter]="true" filterBy="name,sku"
                                appendTo="body"></p-dropdown>
                  </div>
                  <div class="col-12 md:col-6 field">
                    <label>Tipo de Movimento</label>
                    <div class="movement-type-selector">
                      <button class="type-btn entry" [class.active]="selectedType() === 'ENTRY'" (click)="setType('ENTRY')">
                        <i class="pi pi-plus-circle"></i> <span>Entrada</span>
                      </button>
                      <button class="type-btn transfer" [class.active]="selectedType() === 'TRANSFER'" (click)="setType('TRANSFER')">
                        <i class="pi pi-sync"></i> <span>Transf.</span>
                      </button>
                      <button class="type-btn exit" [class.active]="selectedType() === 'EXIT'" (click)="setType('EXIT')">
                        <i class="pi pi-minus-circle"></i> <span>Saída</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-section mt-3">
                <h3 class="section-header"><i class="pi pi-file"></i> DOCUMENTAÇÃO E LOGÍSTICA</h3>
                <div class="grid">
                  <div class="col-12 md:col-6 field">
                    <label>Nota Fiscal / Pedido / Chamado</label>
                    <input pInputText [(ngModel)]="referenceDoc" placeholder="Ex: NF-123456 ou REQ-789" class="w-full" />
                  </div>

                  @if (selectedType() === 'TRANSFER') {
                    <div class="col-12 md:col-3 field">
                      <label>Endereço Origem</label>
                      <p-dropdown [options]="availableOrigins()" 
                                  [ngModel]="fromLocation()" 
                                  (ngModelChange)="onOriginChange($event)"
                                  optionLabel="label" placeholder="De onde sai?" 
                                  styleClass="w-full" appendTo="body"></p-dropdown>
                    </div>
                    <div class="col-12 md:col-3 field">
                      <label>Endereço Destino</label>
                      <p-dropdown [options]="store.locations()" 
                                  [ngModel]="targetLocation()"
                                  (ngModelChange)="targetLocation.set($event)"
                                  optionLabel="id" placeholder="Para onde vai?" 
                                  styleClass="w-full" appendTo="body"></p-dropdown>
                    </div>
                  } @else if (selectedType() === 'EXIT') {
                    <div class="col-12 md:col-6 field">
                      <label>Endereço Origem (Saída)</label>
                      <p-dropdown [options]="availableOrigins()" 
                                  [ngModel]="fromLocation()" 
                                  (ngModelChange)="onOriginChange($event)"
                                  optionLabel="label" placeholder="Selecione a origem" 
                                  styleClass="w-full" appendTo="body"></p-dropdown>
                    </div>
                  } @else {
                    <div class="col-12 md:col-6 field">
                      <label>Endereço Destino (Entrada)</label>
                      <p-dropdown [options]="store.locations()" 
                                  [ngModel]="targetLocation()"
                                  (ngModelChange)="targetLocation.set($event)"
                                  optionLabel="id" placeholder="Onde será guardado?" 
                                  styleClass="w-full" appendTo="body"></p-dropdown>
                    </div>
                  }

                  @if (selectedType() === 'ENTRY' && selectedProduct()?.requires_serial_number) {
                    <div class="col-12 md:col-4 field mt-2">
                      <label>Data de Aquisição</label>
                      <p-calendar [(ngModel)]="acquisitionDate" [showIcon]="true" styleClass="w-full" appendTo="body" dateFormat="dd/mm/yy"></p-calendar>
                    </div>
                    <div class="col-12 md:col-4 field mt-2">
                      <label>Fim da Garantia (Opcional)</label>
                      <p-calendar [(ngModel)]="warrantyExpiry" [showIcon]="true" styleClass="w-full" appendTo="body" dateFormat="dd/mm/yy"></p-calendar>
                    </div>
                    <div class="col-12 md:col-4 field mt-2">
                      <label>Valor de Aquisição (Unitário)</label>
                      <p-inputNumber [(ngModel)]="acquisitionValue" mode="currency" currency="BRL" locale="pt-BR" styleClass="w-full"></p-inputNumber>
                    </div>
                  }

                  @if (selectedProduct()?.requires_serial_number) {
                    <div class="col-12 field mt-2">
                      @if (selectedType() === 'ENTRY') {
                        <label>Bipagem de Novos SNs (Um por linha)</label>
                        <textarea pInputTextarea [(ngModel)]="serialList" rows="3" 
                                  placeholder="Bipe os novos itens aqui..." class="compact-textarea"></textarea>
                      } @else {
                        <label>Selecionar SNs Disponíveis na Origem</label>
                        <p-multiSelect [options]="availableSerials()" [(ngModel)]="selectedSerials" 
                                       optionLabel="serial_number" optionValue="serial_number"
                                       placeholder="Selecione os itens para mover" styleClass="w-full"
                                       display="chip" [filter]="true" appendTo="body"></p-multiSelect>
                        @if (fromLocation() && availableSerials().length === 0) {
                          <small class="text-danger font-bold">Não há SNs disponíveis neste endereço.</small>
                        }
                      }
                      
                      <div class="flex justify-content-between mt-2">
                        <small class="text-secondary">
                          {{ selectedType() === 'ENTRY' ? getSerialCount() : selectedSerials.length }} itens selecionados
                        </small>
                        <p-button label="Confirmar" icon="pi pi-check" (onClick)="save()" 
                                  [disabled]="isInvalid()" [loading]="saving()" size="small"></p-button>
                      </div>
                    </div>
                  } @else {
                    <div class="col-12 md:col-4 field mt-2">
                      <label>Quantidade</label>
                      <p-inputNumber [ngModel]="quantity()" 
                                     (ngModelChange)="quantity.set($event)"
                                     [showButtons]="true" styleClass="w-full" [min]="1"
                                     [max]="selectedType() !== 'ENTRY' ? maxAvailable() : 99999"></p-inputNumber>
                      @if (selectedType() !== 'ENTRY' && fromLocation()) {
                        <small class="text-blue-600">Máximo disponível: {{ maxAvailable() }}</small>
                      }
                    </div>
                    <div class="col-12 md:col-8 flex align-items-end justify-content-end mt-2">
                       <p-button label="Confirmar Movimentação" icon="pi pi-check" (onClick)="save()" 
                                [disabled]="isInvalid()" [loading]="saving()"></p-button>
                    </div>
                  }
                </div>
              </div>
            </div>
          </p-card>
        </div>

        <div class="col-12 lg:col-5">
          <p-card header="Histórico Recente" styleClass="compact-card history-card">
            <div class="history-scroll">
              @for (m of store.movements(); track m.id) {
                <div class="history-item-compact">
                  <div class="flex justify-content-between align-items-start">
                    <div class="flex-1">
                      <div class="prod-name">{{ getProductName(m.product_id) }}</div>
                      <div class="move-info">
                        <span class="loc">{{ m.from_location || 'EXT' }}</span>
                        <i class="pi pi-arrow-right mx-1"></i>
                        <span class="loc">{{ m.to_location || 'SAÍDA' }}</span>
                      </div>
                      @if (m.serial_number) { <div class="text-xs font-mono text-blue-500">SN: {{ m.serial_number }}</div> }
                    </div>
                    <div class="text-right">
                      <div class="qty-val" [class.plus]="m.type === 'ENTRY'" [class.transf]="m.type === 'TRANSFER'">
                        {{ m.type === 'ENTRY' ? '+' : (m.type === 'EXIT' ? '-' : '') }}{{ m.quantity }}
                      </div>
                      <div class="time-val">{{ m.timestamp | date:'HH:mm' }}</div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </p-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-compact { margin-bottom: 1rem; }
    .section-header { font-size: 0.7rem; font-weight: 700; color: #64748b; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 6px; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.25rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
    .field label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .movement-type-selector { display: flex; gap: 8px; }
    .type-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; font-weight: 700; color: #64748b; font-size: 0.85rem; transition: 0.2s; }
    .type-btn.entry.active { background: #059669; color: white; border-color: #059669; }
    .type-btn.exit.active { background: #ef4444; color: white; border-color: #ef4444; }
    .type-btn.transfer.active { background: #3b82f6; color: white; border-color: #3b82f6; }
    .compact-textarea { height: 80px !important; font-family: monospace; font-size: 0.85rem; padding: 0.5rem; border-radius: 8px; width: 100%; border: 1px solid #e2e8f0; }
    .history-scroll { height: 450px; overflow-y: auto; }
    .history-item-compact { padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
    .prod-name { font-weight: 700; font-size: 0.85rem; color: #1e293b; }
    .move-info { font-size: 0.75rem; color: #64748b; margin: 2px 0; }
    .qty-val { font-weight: 800; font-size: 1rem; color: #ef4444; }
    .qty-val.plus { color: #22c55e; }
    .qty-val.transf { color: #3b82f6; }
    .time-val { font-size: 0.7rem; color: #94a3b8; }
    .text-danger { color: #ef4444; }
  `]
})
export class MovementComponent {
  store = inject(StoreService);
  auth = inject(AuthService);
  messageService = inject(MessageService);
  
  selectedProduct = signal<Product | null>(null);
  fromLocation = signal<any>(null); 
  targetLocation = signal<any>(null);
  selectedType = signal<MovementType>('ENTRY');
  quantity = signal<number>(1);

  referenceDoc = '';
  serialList = '';
  selectedSerials: string[] = [];
  warrantyExpiry: Date | null = null;
  acquisitionDate: Date | null = new Date();
  acquisitionValue: number | null = null;
  saving = signal(false);

  availableOrigins = computed(() => {
    const prod = this.selectedProduct();
    if (!prod || this.selectedType() === 'ENTRY') return [];
    
    return this.store.stockLevels()
      .filter(s => s.product_id === prod.id && s.quantity > 0)
      .map(s => ({
        label: `${s.location_id} (Saldo: ${s.quantity})`,
        id: s.location_id,
        quantity: s.quantity
      }));
  });

  availableSerials = computed(() => {
    const prod = this.selectedProduct();
    const origin = this.fromLocation();
    if (!prod?.requires_serial_number || !origin || this.selectedType() === 'ENTRY') return [];
    
    return this.store.assets().filter(a => 
      a.product_id === prod.id && 
      a.location_id === origin.id &&
      a.status === 'AVAILABLE'
    );
  });

  maxAvailable = computed(() => this.fromLocation()?.quantity || 0);

  onProductChange(prod: Product) {
    this.selectedProduct.set(prod);
    this.fromLocation.set(null);
    this.targetLocation.set(null);
    this.selectedSerials = [];
    this.quantity.set(1);
  }

  onOriginChange(loc: any) {
    this.fromLocation.set(loc);
    this.selectedSerials = [];
    this.quantity.set(1);
  }

  setType(type: MovementType) {
    this.selectedType.set(type);
    this.fromLocation.set(null);
    this.targetLocation.set(null);
    this.selectedSerials = [];
    this.quantity.set(1);
  }

  getSerialCount() { return this.serialList.split('\n').filter(s => s.trim()).length; }

  isInvalid() { 
    const prod = this.selectedProduct();
    const type = this.selectedType();
    const from = this.fromLocation();
    const target = this.targetLocation();
    const qty = this.quantity();

    if (!prod) return true;
    
    if (type === 'TRANSFER') {
      if (!from || !target || from.id === target.id) return true;
    } else if (type === 'EXIT') {
      if (!from) return true;
    } else {
      if (!target) return true;
    }

    if (prod.requires_serial_number) {
      return type === 'ENTRY' ? this.getSerialCount() === 0 : this.selectedSerials.length === 0;
    }
    
    return qty <= 0 || (type !== 'ENTRY' && qty > this.maxAvailable());
  }

  async save() {
    this.saving.set(true);
    const prod = this.selectedProduct()!;
    const type = this.selectedType();
    const from = this.fromLocation();
    const target = this.targetLocation();
    const qty = this.quantity();

    const serialsToProcess = type === 'ENTRY' 
      ? this.serialList.split('\n').map(s => s.trim()).filter(s => s)
      : this.selectedSerials;

    try {
      if (prod.requires_serial_number) {
        for (const sn of serialsToProcess) {
          const result = await this.store.registerMovement({
            product_id: prod.id,
            type: type,
            quantity: 1,
            from_location: type === 'ENTRY' ? null : from?.id,
            to_location: type === 'EXIT' ? null : target?.id,
            serial_number: sn,
            reference_doc: this.referenceDoc,
            reason: type === 'TRANSFER' ? 'Transferência interna' : (type === 'ENTRY' ? 'Recebimento' : 'Saída de estoque'),
            user_id: this.auth.user()?.id,
            value: this.acquisitionValue || prod.unit_cost,
            acquisition_date: this.acquisitionDate,
            warranty: this.warrantyExpiry
          }, true);
          if (result.error) throw result.error;
        }
        await this.store.refresh();
      } else {
        const result = await this.store.registerMovement({
          product_id: prod.id,
          type: type,
          quantity: qty,
          from_location: type === 'ENTRY' ? null : from?.id,
          to_location: type === 'EXIT' ? null : target?.id,
          reference_doc: this.referenceDoc,
          reason: type === 'TRANSFER' ? 'Transferência interna' : 'Movimentação manual',
          user_id: this.auth.user()?.id
        });
        if (result.error) throw result.error;
      }
      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Movimentações registradas' });
      this.resetForm();
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha ao processar movimentação' });
    } finally {
      this.saving.set(false);
    }
  }

  resetForm() {
    this.quantity.set(1);
    this.serialList = '';
    this.selectedSerials = [];
    this.referenceDoc = '';
    this.fromLocation.set(null);
    this.targetLocation.set(null);
    this.warrantyExpiry = null;
    this.acquisitionDate = new Date();
    this.acquisitionValue = null;
  }

  getProductName(id: string) { return this.store.products().find(p => p.id === id)?.name; }
}