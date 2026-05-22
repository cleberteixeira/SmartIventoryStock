import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { AccordionModule } from 'primeng/accordion';
import { DividerModule } from 'primeng/divider';
import { StepperModule } from 'primeng/stepper';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule, CardModule, AccordionModule, DividerModule],
  template: `
    <div class="docs-page">
      <div class="header mb-4">
        <h1>Guia de Operação - SmartInventory</h1>
        <p class="text-secondary">Aprenda a operar os fluxos de WMS e ITAM passo a passo</p>
      </div>

      <div class="grid">
        <div class="col-12 lg:col-8">
          <p-card header="Fluxo Principal: Ciclo de Vida do Ativo">
            <div class="step-container">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h3>Configuração Inicial (Mestres)</h3>
                  <p>Antes de movimentar, você precisa cadastrar os "pilares" do sistema:</p>
                  <ul>
                    <li><strong>Produtos:</strong> Cadastre o modelo (ex: Notebook Dell G15). Se for um item único, marque <strong>"Exige Número de Série"</strong>.</li>
                    <li><strong>Endereçamentos:</strong> Defina onde os itens ficam (ex: PRATELEIRA-A1, LABORATORIO-01).</li>
                    <li><strong>Colaboradores:</strong> Cadastre quem receberá os equipamentos.</li>
                  </ul>
                </div>
              </div>

              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h3>Recebimento e Entrada (WMS + ITAM)</h3>
                  <p>Vá em <strong>Operação > Movimentação</strong> para dar entrada no estoque:</p>
                  <ul>
                    <li>Selecione o produto e o tipo <strong>Entrada</strong>.</li>
                    <li>Para itens serializados, bipe cada Número de Série (SN).</li>
                    <li><strong>Importante:</strong> Informe o valor de aquisição e a garantia para que o sistema calcule a depreciação e alertas futuros.</li>
                  </ul>
                </div>
              </div>

              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h3>Atribuição ao Colaborador (Checkout)</h3>
                  <p>Quando um funcionário precisa de um equipamento, use a tela de <strong>Atribuição</strong>:</p>
                  <ul>
                    <li>Selecione o colaborador e o ativo disponível.</li>
                    <li>O sistema gera automaticamente o <strong>Termo de Responsabilidade em PDF</strong>.</li>
                    <li>O item sai do endereço físico e passa para o status "Em Uso".</li>
                  </ul>
                </div>
              </div>

              <div class="step">
                <div class="step-number">4</div>
                <div class="step-content">
                  <h3>Devolução e Triagem (Check-in)</h3>
                  <p>Ao receber um item de volta, use a tela de <strong>Devolução</strong>:</p>
                  <ul>
                    <li>Identifique o ativo pelo SN.</li>
                    <li>Defina se ele volta para o estoque (Disponível) ou se precisa de reparo (Avariado).</li>
                    <li>Escolha o novo endereço de armazenagem.</li>
                  </ul>
                </div>
              </div>
            </div>
          </p-card>
        </div>

        <div class="col-12 lg:col-4">
          <p-card header="Dicas Rápidas" styleClass="help-card">
            <p-accordion [multiple]="true">
              <p-accordionTab header="Como funciona a Depreciação?">
                <p class="text-sm">O sistema utiliza o método de linha reta. Se um notebook custa R$ 6.000 e tem vida útil de 36 meses, ele perde R$ 166,66 de valor contábil todo mês.</p>
              </p-accordionTab>
              <p-accordionTab header="O que é Rastreabilidade?">
                <p class="text-sm">Na tela de <strong>Rastreabilidade</strong>, você digita um SN e vê todo o histórico: quem comprou, onde foi guardado, com qual funcionário esteve e se já passou por manutenção.</p>
              </p-accordionTab>
              <p-accordionTab header="Inventário Cíclico">
                <p class="text-sm">Use a função <strong>Inventário</strong> periodicamente para contar os itens físicos. O sistema ajustará o saldo automaticamente se houver divergências.</p>
              </p-accordionTab>
            </p-accordion>
          </p-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .step-container { display: flex; flex-direction: column; gap: 2rem; padding: 1rem 0; }
    .step { display: flex; gap: 1.5rem; }
    .step-number { 
      width: 40px; height: 40px; background: #2563eb; color: white; 
      border-radius: 50%; display: flex; align-items: center; justify-content: center; 
      font-weight: 800; flex-shrink: 0; font-size: 1.2rem;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
    }
    .step-content h3 { margin-bottom: 0.5rem; color: #1e293b; font-size: 1.1rem; }
    .step-content p { color: #64748b; line-height: 1.5; margin-bottom: 0.75rem; }
    .step-content ul { padding-left: 1.2rem; color: #475569; }
    .step-content li { margin-bottom: 0.4rem; font-size: 0.9rem; }
    
    ::ng-deep .help-card .p-card-body { padding: 1rem !important; }
  `]
})
export class DocumentationComponent {}