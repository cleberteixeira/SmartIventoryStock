import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { Employee } from '../../core/models/inventory.model';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, DropdownModule, ToastModule, ConfirmDialogModule, TooltipModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="employees">
      <div class="header">
        <div>
          <h1>Colaboradores</h1>
          <p class="text-secondary">Gestão de pessoas, localizações e centros de custo</p>
        </div>
        <div class="flex gap-2">
          <p-button label="Template Excel" icon="pi pi-file-excel" severity="secondary" 
                    (onClick)="downloadTemplate()" pTooltip="Baixar modelo para preenchimento"></p-button>
          
          <input type="file" #fileInput style="display: none" (change)="onFileSelect($event)" accept=".xlsx, .xls">
          <p-button label="Importar" icon="pi pi-upload" severity="info" 
                    (onClick)="fileInput.click()" [loading]="importing()"></p-button>
          
          <p-button label="Novo Colaborador" icon="pi pi-plus" (onClick)="showDialog()"></p-button>
        </div>
      </div>

      <p-table [value]="store.employees()" class="mt-4" styleClass="p-datatable-sm" [rows]="10" [paginator]="true">
        <ng-template pTemplate="header">
          <tr>
            <th>Nome</th>
            <th>Localização</th>
            <th>Departamento</th>
            <th>Centro de Custo</th>
            <th>E-mail</th>
            <th style="width: 120px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-emp>
          <tr>
            <td><strong>{{ emp.full_name }}</strong></td>
            <td>
              <span class="flex align-items-center gap-2">
                <i class="pi pi-map-marker text-blue-500"></i> {{ emp.location || 'Não definido' }}
              </span>
            </td>
            <td>{{ emp.department }}</td>
            <td><code class="cc-badge">{{ emp.cost_center || 'N/A' }}</code></td>
            <td>{{ emp.email }}</td>
            <td>
              <div class="flex gap-2">
                <p-button icon="pi pi-pencil" [text]="true" size="small" (onClick)="editEmployee(emp)"></p-button>
                <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" (onClick)="confirmDelete(emp)"></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog [header]="isEditMode ? 'Editar Colaborador' : 'Novo Colaborador'" [(visible)]="displayDialog" [modal]="true" 
                [style]="{width: '90vw', maxWidth: '550px'}" [draggable]="false" [resizable]="false">
        <div class="flex flex-column gap-3 mt-2">
          <div class="field">
            <label>Nome Completo</label>
            <input pInputText [(ngModel)]="newEmp.full_name" class="w-full" />
          </div>
          
          <div class="field">
            <label>Localização Padrão (Site/Unidade)</label>
            <p-dropdown [options]="store.sites()" [(ngModel)]="newEmp.location" 
                        optionLabel="name" optionValue="name"
                        placeholder="Selecione a unidade da matriz" styleClass="w-full"
                        [filter]="true" filterBy="name" appendTo="body"></p-dropdown>
            <small class="text-secondary">Selecione uma unidade da matriz oficial.</small>
          </div>

          <div class="grid">
            <div class="col-12 md:col-6 field">
              <label>CPF</label>
              <input pInputText [(ngModel)]="newEmp.document" class="w-full" />
            </div>
            <div class="col-12 md:col-6 field">
              <label>Centro de Custo</label>
              <p-dropdown [options]="store.groupedCostCenters()" [(ngModel)]="newEmp.cost_center" 
                          [group]="true" placeholder="Selecione o CC" styleClass="w-full"
                          [filter]="true" filterBy="label" appendTo="body"></p-dropdown>
            </div>
          </div>
          <div class="field">
            <label>E-mail</label>
            <input pInputText [(ngModel)]="newEmp.email" class="w-full" />
          </div>
          <div class="field">
            <label>Departamento</label>
            <input pInputText [(ngModel)]="newEmp.department" class="w-full" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancelar" (onClick)="displayDialog = false" [text]="true" severity="secondary"></p-button>
          <p-button [label]="isEditMode ? 'Atualizar' : 'Salvar'" icon="pi pi-check" (onClick)="save()" [loading]="saving()"></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; }
    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    label { font-weight: 600; font-size: 0.9rem; }
    .cc-badge { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #475569; }
    .grid { display: flex; flex-wrap: wrap; margin: 0 -0.5rem; }
    .col-12 { padding: 0 0.5rem; }
    @media (min-width: 768px) { .md\\:col-6 { width: 50%; } }
    ::ng-deep .p-dialog-content { overflow: visible !important; padding: 1.5rem 2rem !important; }
  `]
})
export class EmployeeListComponent {
  store = inject(StoreService);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);

  displayDialog = false;
  isEditMode = false;
  saving = signal(false);
  importing = signal(false);
  
  newEmp: any = this.resetForm();

  resetForm() {
    return { full_name: '', document: '', email: '', department: '', location: '', cost_center: '', status: 'ACTIVE' };
  }

  showDialog() {
    this.newEmp = this.resetForm();
    this.isEditMode = false;
    this.displayDialog = true;
  }

  editEmployee(emp: Employee) {
    this.newEmp = { ...emp };
    this.isEditMode = true;
    this.displayDialog = true;
  }

  confirmDelete(emp: Employee) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o colaborador <b>\${emp.full_name}</b>?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        const { error } = await this.store.deleteEmployee(emp.id);
        if (error) {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o colaborador.' });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Colaborador removido' });
        }
      }
    });
  }

  async save() {
    this.saving.set(true);
    try {
      let result;
      if (this.isEditMode) {
        result = await this.store.updateEmployee(this.newEmp);
      } else {
        result = await this.store.addEmployee(this.newEmp);
      }

      if (result.error) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: result.error.message });
      } else {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Colaborador \${this.isEditMode ? 'atualizado' : 'cadastrado'}` });
        this.displayDialog = false;
      }
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message });
    } finally {
      this.saving.set(false);
    }
  }

  downloadTemplate() {
    // 1. Criar aba principal de preenchimento
    const headers = [['full_name', 'document', 'email', 'department', 'location', 'cost_center', 'status']];
    const example = [['João da Silva', '123.456.789-00', 'joao.silva@abctechnology.com.br', 'TI', 'MATRIZ-SP', 'CC-001', 'ACTIVE']];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);

    // 2. Criar aba de referência (ajuda o usuário a saber o que digitar)
    const sitesRef = this.store.sites().map(s => [s.name]);
    const ccRef = this.store.costCenters().map(c => [c.code, c.name]);
    
    const wsRef = XLSX.utils.aoa_to_sheet([
      ['UNIDADES VÁLIDAS (Coluna location)'],
      ...sitesRef,
      [''],
      ['CÓDIGOS DE CENTRO DE CUSTO VÁLIDOS (Coluna cost_center)'],
      ...ccRef,
      [''],
      ['STATUS VÁLIDOS'],
      ['ACTIVE'],
      ['INACTIVE']
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Preencher Aqui");
    XLSX.utils.book_append_sheet(wb, wsRef, "Referencias_Validas");

    XLSX.writeFile(wb, "Template_Importacao_Colaboradores.xlsx");
  }

  async onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.importing.set(true);
    const reader = new FileReader();
    
    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) throw new Error('O arquivo está vazio.');

        // Validação básica e limpeza
        const employeesToInsert = json.map(row => ({
          full_name: row.full_name || '',
          document: String(row.document || ''),
          email: row.email || '',
          department: row.department || '',
          location: row.location || null,
          cost_center: String(row.cost_center || ''),
          status: row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
        })).filter(emp => emp.full_name && emp.email);

        if (employeesToInsert.length === 0) throw new Error('Nenhum dado válido encontrado (Nome e E-mail são obrigatórios).');

        const { error } = await this.store.addEmployeesBulk(employeesToInsert);
        
        if (error) throw error;

        this.messageService.add({ 
          severity: 'success', 
          summary: 'Importação Concluída', 
          detail: `\${employeesToInsert.length} colaboradores importados com sucesso.` 
        });
        
        event.target.value = ''; // Limpa o input
      } catch (err: any) {
        this.messageService.add({ severity: 'error', summary: 'Erro na Importação', detail: err.message });
      } finally {
        this.importing.set(false);
      }
    };

    reader.readAsArrayBuffer(file);
  }
}