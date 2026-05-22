import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ButtonModule, CardModule, ToastModule, TagModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="checkin">
      <h1>Devolução de Ativos (Check-in)</h1>
      <p class="text-secondary">Receba equipamentos de volta e encerre a responsabilidade do colaborador</p>

      <div class="grid mt-4">
        <div class="col-12 md:col-6">
          <p-card header="Passo 1: Identificar Ativo">
            <p-dropdown [options]="inUseAssets()" [(ngModel)]="selectedAsset" 
                        optionLabel="serial_number" placeholder="Bipe ou selecione o SN" 
                        styleClass="w-full" [filter]="true" filterBy="serial_number">
              <ng-template let-asset pTemplate="item">
                <div class="flex flex-column">
                  <span><strong>SN: {{ asset.serial_number }}</strong></span>
                  <small>Com: {{ getEmployeeName(asset.employee_id) }}</small>
                </div>
              </ng-template>
            </p-dropdown>

            @if (selectedAsset) {
              <div class="info-box mt-3">
                <p><strong>Modelo:</strong> {{ getProductName(selectedAsset.product_id) }}</p>
                <p><strong>Responsável Atual:</strong> {{ getEmployeeName(selectedAsset.employee_id) }}</p>
              </div>
            }
          </p-card>
        </div>

        <div class="col-12 md:col-6">
          <p-card header="Passo 2: Estado e Destino">
            <div class="field">
              <label>Estado do Item no Recebimento</label>
              <p-dropdown [options]="statusOptions" [(ngModel)]="targetStatus" 
                          optionLabel="label" optionValue="value" styleClass="w-full"></p-dropdown>
            </div>

            <div class="field mt-3">
              <label>Endereço de Armazenagem</label>
              <p-dropdown [options]="store.locations()" [(ngModel)]="targetLocation" 
                          optionLabel="id" placeholder="Onde será guardado?" styleClass="w-full"></p-dropdown>
              @if (targetStatus === 'DAMAGED') {
                <small class="text-danger font-bold"><i class="pi pi-exclamation-circle"></i> Itens avariados devem ir para QUARENTENA ou MANUTENÇÃO.</small>
              }
            </div>
          </p-card>
        </div>

        <div class="col-12 mt-4 flex justify-content-center">
          <p-button label="Confirmar Recebimento e Gerar Termo" icon="pi pi-file-pdf" 
                    size="large" severity="success" (onClick)="confirmCheckin()"
                    [disabled]="!selectedAsset || !targetLocation" [loading]="processing()"></p-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .info-box { background: #eff6ff; padding: 1rem; border-radius: 8px; border: 1px solid #bfdbfe; }
    .field label { display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .text-danger { color: #ef4444; }
  `]
})
export class CheckinComponent {
  store = inject(StoreService);
  auth = inject(AuthService);
  messageService = inject(MessageService);

  selectedAsset: any;
  targetStatus = 'AVAILABLE';
  targetLocation: any;
  processing = signal(false);

  statusOptions = [
    { label: 'Disponível (Pronto para uso)', value: 'AVAILABLE' },
    { label: 'Pendente Limpeza/Formatação', value: 'PENDING_CLEANING' },
    { label: 'Avariado (Necessita Manutenção)', value: 'DAMAGED' }
  ];

  inUseAssets = computed(() => this.store.assets().filter(a => a.status === 'IN_USE'));

  getProductName(id: string) { return this.store.products().find(p => p.id === id)?.name || 'Produto'; }
  getEmployeeName(id: string) { return this.store.employees().find(e => e.id === id)?.full_name || 'Desconhecido'; }

  async confirmCheckin() {
    if (!this.selectedAsset || !this.targetLocation) return;
    
    this.processing.set(true);
    const assetToReturn = { ...this.selectedAsset };
    const employee = this.store.employees().find(e => e.id === assetToReturn.employee_id);
    const userId = this.auth.user()?.id;

    if (!userId) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Sessão de usuário não identificada.' });
      this.processing.set(false);
      return;
    }

    try {
      const res = await this.store.returnAsset(
        assetToReturn.id,
        this.targetStatus,
        this.targetLocation.id,
        userId
      );

      if (res.error) throw res.error;

      this.generateReturnPDF(assetToReturn, employee);

      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ativo recebido com sucesso.' });
      this.selectedAsset = null;
      this.targetLocation = null;
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha ao processar devolução.' });
    } finally {
      this.processing.set(false);
    }
  }

  generateReturnPDF(asset: any, employee: any) {
    const doc = new jsPDF();
    const productName = this.getProductName(asset.product_id);
    const statusLabel = this.statusOptions.find(o => o.value === this.targetStatus)?.label || this.targetStatus;

    // 1. Cabeçalho Verde (Inbound)
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE DEVOLUÇÃO DE ATIVO', 105, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('abc technology - Gestão de Ativos de TI (ITAM)', 105, 32, { align: 'center' });

    // 2. Texto de Abertura
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    const text = `Pelo presente termo, a empresa abc technology confirma o recebimento do equipamento abaixo descrito, anteriormente sob responsabilidade do colaborador ${employee?.full_name || 'N/A'}, portador do documento ${employee?.document || 'N/A'}.`;
    doc.text(text, 20, 60, { maxWidth: 170, align: 'justify' });

    // 3. Tabela
    autoTable(doc, {
      startY: 85,
      head: [['ESPECIFICAÇÃO DO ATIVO', 'NÚMERO DE SÉRIE (SN)', 'ESTADO NA ENTREGA']],
      body: [[productName, asset.serial_number, statusLabel]],
      headStyles: { fillColor: [5, 150, 105], fontStyle: 'bold' },
      theme: 'grid'
    });

    // 4. Observações
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES DO RECEBIMENTO:', 20, finalY);
    
    doc.setFont('helvetica', 'normal');
    const obs = [
      `1. O ativo foi conferido fisicamente no ato da devolução em ${new Date().toLocaleString()}.`,
      `2. A responsabilidade civil e guarda do colaborador sobre este SN específico encerra-se nesta data.`,
      `3. O item foi destinado ao endereço de estoque: ${this.targetLocation?.id || 'N/A'}.`,
      this.targetStatus === 'DAMAGED' ? '4. ATENÇÃO: O item foi entregue com avarias e seguirá para perícia técnica.' : '4. O item encontra-se em condições normais de reuso.'
    ];
    doc.text(obs, 20, finalY + 10);

    // 5. Assinaturas
    const sigY = finalY + 70;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, sigY, 90, sigY);
    doc.line(120, sigY, 190, sigY);
    
    doc.setFontSize(9);
    doc.text(employee?.full_name || 'Colaborador', 55, sigY + 5, { align: 'center' });
    doc.text('Assinatura do Colaborador', 55, sigY + 10, { align: 'center' });
    
    doc.text('abc technology', 155, sigY + 5, { align: 'center' });
    doc.text('Recebido por (TI/Logística)', 155, sigY + 10, { align: 'center' });

    // 6. Rodapé
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Documento gerado eletronicamente via SmartInventory em ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

    doc.save(`Devolucao_${asset.serial_number}.pdf`);
  }
}