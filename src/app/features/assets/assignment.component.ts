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
import { TooltipModule } from 'primeng/tooltip';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ButtonModule, CardModule, ToastModule, TooltipModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="assignment">
      <div class="header flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Atribuição de Ativos (Checkout)</h1>
          <p class="text-secondary">Vincule equipamentos aos colaboradores e gere o termo legal</p>
        </div>
        <p-button icon="pi pi-refresh" [text]="true" (onClick)="store.refresh()" pTooltip="Atualizar dados"></p-button>
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <p-card header="1. Selecionar Colaborador">
            <p-dropdown [options]="store.employees()" [(ngModel)]="selectedEmployee" 
                        optionLabel="full_name" placeholder="Quem está recebendo?" 
                        styleClass="w-full" [filter]="true" filterBy="full_name"></p-dropdown>
            
            @if (selectedEmployee) {
              <div class="info-box mt-3">
                <div class="flex align-items-center gap-3">
                   <i class="pi pi-user text-2xl text-blue-500"></i>
                   <div>
                      <div class="font-bold">{{ selectedEmployee.full_name }}</div>
                      <div class="text-sm text-secondary">CPF: {{ selectedEmployee.document }}</div>
                      <div class="text-sm text-secondary">Depto: {{ selectedEmployee.department }}</div>
                   </div>
                </div>
              </div>
            }
          </p-card>
        </div>

        <div class="col-12 md:col-6">
          <p-card header="2. Selecionar Ativo Disponível">
            @if (availableAssets().length > 0) {
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

              @if (selectedAsset) {
                <div class="info-box mt-3 success">
                  <div class="flex align-items-center gap-3">
                     <i class="pi pi-desktop text-2xl text-green-500"></i>
                     <div>
                        <div class="font-bold">{{ getProductName(selectedAsset.product_id) }}</div>
                        <div class="text-sm text-secondary">SN: {{ selectedAsset.serial_number }}</div>
                        <div class="text-sm text-secondary">Local: {{ selectedAsset.location_id }}</div>
                     </div>
                  </div>
                </div>
              }
            } @else {
              <div class="empty-warning">
                <i class="pi pi-exclamation-circle"></i>
                <p>Não há ativos <strong>Disponíveis</strong> no estoque.</p>
                <small>Certifique-se de realizar a "Entrada" do item com Número de Série na tela de Movimentação.</small>
              </div>
            }
          </p-card>
        </div>

        <div class="col-12 mt-4">
          <div class="flex flex-column align-items-center gap-3">
            <p-button label="Finalizar Atribuição e Gerar Termo PDF" icon="pi pi-file-pdf" 
                      size="large" severity="success" (onClick)="confirmAssignment()"
                      [disabled]="!selectedEmployee || !selectedAsset" [loading]="processing()"
                      styleClass="p-4 font-bold"></p-button>
            <small class="text-secondary">O ativo será marcado como 'EM USO' e removido do endereço físico.</small>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .info-box { background: #f8fafc; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; }
    .info-box.success { background: #f0fdf4; border-color: #dcfce7; }
    .empty-warning { 
      background: #fff7ed; border: 1px solid #ffedd5; padding: 1.5rem; 
      border-radius: 12px; text-align: center; color: #9a3412;
    }
    .empty-warning i { font-size: 2rem; margin-bottom: 0.5rem; }
    .empty-warning p { margin: 0.5rem 0; font-weight: 600; }
  `]
})
export class AssignmentComponent {
  store = inject(StoreService);
  auth = inject(AuthService);
  messageService = inject(MessageService);
  
  selectedEmployee: any;
  selectedAsset: any;
  processing = signal(false);

  availableAssets = computed(() => this.store.assets().filter(a => a.status === 'AVAILABLE'));

  getProductName(id: string) {
    return this.store.products().find(p => p.id === id)?.name || 'Produto';
  }

  async confirmAssignment() {
    if (!this.selectedEmployee || !this.selectedAsset) return;
    
    this.processing.set(true);
    const userId = this.auth.user()?.id;

    if (!userId) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Sessão expirada.' });
      this.processing.set(false);
      return;
    }

    try {
      const res = await this.store.assignAsset(
        this.selectedAsset.id, 
        this.selectedEmployee.id,
        userId
      );

      if (res.error) throw res.error;

      this.generatePDF();

      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ativo atribuído com sucesso.' });
      this.selectedAsset = null;
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha na atribuição.' });
    } finally {
      this.processing.set(false);
    }
  }

  generatePDF() {
    const doc = new jsPDF();
    const emp = this.selectedEmployee;
    const asset = this.selectedAsset;
    const productName = this.getProductName(asset.product_id);

    // 1. Cabeçalho Azul
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE', 105, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('abc technology - Gestão de Ativos de TI (ITAM)', 105, 32, { align: 'center' });

    // 2. Texto de Abertura
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    const introText = `Eu, ${emp.full_name}, portador do documento ${emp.document}, lotado no departamento ${emp.department || 'N/A'}, declaro para os devidos fins ter recebido da empresa abc technology, a título de empréstimo para uso exclusivamente profissional, o equipamento abaixo especificado:`;
    doc.text(introText, 20, 60, { maxWidth: 170, align: 'justify' });

    // 3. Tabela do Ativo
    autoTable(doc, {
      startY: 85,
      head: [['ESPECIFICAÇÃO DO ATIVO', 'NÚMERO DE SÉRIE (SN)']],
      body: [[productName, asset.serial_number]],
      headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    // 4. Seção de Obrigações
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('DAS OBRIGAÇÕES E RESPONSABILIDADES:', 20, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const obligations = [
      '1. O equipamento é de propriedade da abc technology, sendo cedido apenas para fins de trabalho.',
      '2. O colaborador compromete-se a zelar pela guarda e conservação do bem.',
      '3. É proibida a instalação de softwares não autorizados ou alteração de hardware.',
      '4. Em caso de dano, extravio ou roubo por negligência, o valor será passível de desconto.',
      '5. A devolução deve ser imediata em caso de rescisão contratual ou solicitação do TI.'
    ];
    doc.text(obligations, 20, finalY + 10);

    // 5. Assinaturas
    const sigY = finalY + 70;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, sigY, 90, sigY);
    doc.line(120, sigY, 190, sigY);
    
    doc.setFontSize(9);
    doc.text(emp.full_name, 55, sigY + 5, { align: 'center' });
    doc.text('Colaborador', 55, sigY + 10, { align: 'center' });
    
    doc.text('abc technology', 155, sigY + 5, { align: 'center' });
    doc.text('Departamento de TI / Logística', 155, sigY + 10, { align: 'center' });

    // 6. Rodapé com Timestamp
    const now = new Date();
    const timestamp = `Documento gerado eletronicamente via SmartInventory em ${now.toLocaleDateString()} às ${now.toLocaleTimeString()}`;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(timestamp, 105, 285, { align: 'center' });

    doc.save(`Termo_${asset.serial_number}.pdf`);
  }
}