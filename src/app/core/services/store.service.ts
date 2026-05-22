import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, StockLevel, StockMovement, WarehouseLocation, UserProfile, InventorySession, InventoryItem, Employee, Asset, AssetHistory, Site, CostCenter, MaintenanceLog } from '../models/inventory.model';
import { supabase } from '../../../integrations/supabase/client';

@Injectable({ providedIn: 'root' })
export class StoreService {
  products = signal<Product[]>([]);
  stockLevels = signal<StockLevel[]>([]);
  movements = signal<StockMovement[]>([]);
  locations = signal<WarehouseLocation[]>([]);
  users = signal<UserProfile[]>([]);
  inventorySessions = signal<InventorySession[]>([]);
  employees = signal<Employee[]>([]);
  assets = signal<Asset[]>([]);
  sites = signal<Site[]>([]);
  costCenters = signal<CostCenter[]>([]);
  loading = signal<boolean>(false);
  
  displayTimeline = signal<boolean>(false);

  private _baseSpecialties = [
    'Analista de Dados - Júnior', 'Analista de Dados - Pleno', 'Analista de Dados - Sênior',
    'BackEnd - Júnior', 'BackEnd - Pleno', 'BackEnd - Sênior',
    'DevOps - Júnior', 'DevOps - Pleno', 'DevOps - Sênior',
    'FrontEnd - Júnior', 'FrontEnd - Pleno', 'FrontEnd - Sênior',
    'FullStack - Júnior', 'FullStack - Pleno', 'FullStack - Sênior',
    'Gerente de Projetos - Júnior', 'Gerente de Projetos - Pleno', 'Gerente de Projetos - Sênior',
    'Auditor de Estoque', 'Consultor WMS', 'Operador de Logística'
  ];
  
  customSpecialties = signal<string[]>([]);

  allSpecialties = computed(() => {
    const fromUsers = this.users().map(u => u.specialty).filter(s => s);
    const combined = [...this._baseSpecialties, ...this.customSpecialties(), ...fromUsers];
    return Array.from(new Set(combined)).sort();
  });

  constructor() {
    this.loadInitialData();
  }

  async loadInitialData() {
    this.loading.set(true);
    try {
      const [p, s, m, l, u, i, e, a, st, cc] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('stock_levels').select('*'),
        supabase.from('stock_movements').select('*').order('timestamp', { ascending: false }),
        supabase.from('locations').select('*').order('id'),
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('inventory_sessions').select('*').order('start_date', { ascending: false }),
        supabase.from('employees').select('*').order('full_name'),
        supabase.from('assets').select('*').order('serial_number'),
        supabase.from('sites').select('*').order('name'),
        supabase.from('cost_centers').select('*').order('code')
      ]);

      this.products.set(p.data || []);
      this.stockLevels.set(s.data || []);
      this.movements.set(m.data || []);
      this.locations.set(l.data || []);
      this.users.set(u.data || []);
      this.inventorySessions.set(i.data || []);
      this.employees.set(e.data || []);
      this.assets.set(a.data || []);
      this.sites.set(st.data || []);
      this.costCenters.set(cc.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async refresh() { await this.loadInitialData(); }

  addSpecialty(name: string) {
    if (name && !this.allSpecialties().includes(name)) {
      this.customSpecialties.update(prev => [...prev, name]);
    }
  }

  removeSpecialty(name: string) {
    this.customSpecialties.update(prev => prev.filter(s => s !== name));
  }

  groupedCostCenters = computed(() => {
    const centers = this.costCenters();
    return [
      {
        label: 'NÃO PRODUTIVOS (ADMINISTRATIVO)',
        items: centers.filter(c => c.type === 'NON_PRODUCTIVE').map(c => ({ label: `${c.code} - ${c.name}`, value: c.code }))
      },
      {
        label: 'PRODUTIVOS (OPERAÇÃO)',
        items: centers.filter(c => c.type === 'PRODUCTIVE').map(c => ({ label: `${c.code} - ${c.name}`, value: c.code }))
      }
    ];
  });

  totalStockValue = computed(() => this.stockLevels().reduce((acc, curr) => acc + curr.quantity, 0));

  totalDepreciatedValue = computed(() => {
    const today = new Date();
    return this.assets()
      .filter(a => a.status !== 'RETIRED')
      .reduce((acc, curr) => {
        const product = this.products().find(p => p.id === curr.product_id);
        const purchaseDate = curr.acquisition_date ? new Date(curr.acquisition_date) : new Date(curr.created_at);
        const monthsOld = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + (today.getMonth() - purchaseDate.getMonth());
        const lifeMonths = product?.depreciation_months || 36;
        const depreciation = Math.min(1, Math.max(0, monthsOld * (1 / lifeMonths)));
        return acc + ((curr.acquisition_value || 0) * (1 - depreciation));
      }, 0);
  });

  expiringWarranties = computed(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return this.assets().filter(a => 
      a.warranty_expiry && 
      a.status !== 'RETIRED' && 
      new Date(a.warranty_expiry) > today && 
      new Date(a.warranty_expiry) <= thirtyDaysFromNow
    );
  });

  lowStockProducts = computed(() => {
    return this.products().filter(p => p.status === 'ACTIVE' && this.getProductTotalStock(p.id) <= p.min_stock)
      .map(p => ({ ...p, current_stock: this.getProductTotalStock(p.id) }));
  });

  async addProduct(product: any) { 
    const res = await supabase.from('products').insert([product]).select().single();
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async updateProduct(product: any) { 
    const { id, created_at, ...updateData } = product;
    const res = await supabase.from('products').update(updateData).eq('id', id).select().single();
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async deleteProduct(id: string) { 
    const res = await supabase.from('products').delete().eq('id', id);
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async addLocation(location: any) { 
    const res = await supabase.from('locations').insert([location]).select().single();
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async updateLocation(location: any) { 
    const res = await supabase.from('locations').update(location).eq('id', location.id).select().single();
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async deleteLocation(id: string) { 
    const res = await supabase.from('locations').delete().eq('id', id);
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async addEmployee(employee: any) {
    const res = await supabase.from('employees').insert([employee]).select().single();
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async addEmployeesBulk(employees: any[]) {
    const res = await supabase.from('employees').insert(employees);
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async updateEmployee(employee: any) {
    const { id, created_at, ...updateData } = employee;
    const res = await supabase.from('employees').update(updateData).eq('id', id).select().single();
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async deleteEmployee(id: string) {
    const res = await supabase.from('employees').delete().eq('id', id);
    if (!res.error) await this.loadInitialData();
    return res;
  }

  async registerMovement(movement: any, skipRefresh = false) {
    try {
      if (movement.serial_number) {
        const { data: existing } = await supabase.from('assets').select('id, acquisition_date').eq('serial_number', movement.serial_number).maybeSingle();
        
        if (movement.type === 'ENTRY') {
          if (!existing) {
            await supabase.from('assets').insert([{
              product_id: movement.product_id,
              serial_number: movement.serial_number,
              status: 'AVAILABLE',
              location_id: movement.to_location,
              acquisition_value: movement.value || 0,
              acquisition_date: movement.acquisition_date || new Date(),
              warranty_expiry: movement.warranty || null
            }]);
          } else {
            await supabase.from('assets').update({ 
              status: 'AVAILABLE', 
              location_id: movement.to_location,
              employee_id: null,
              acquisition_date: movement.acquisition_date || existing.acquisition_date
            }).eq('id', existing.id);
          }
        } else if (movement.type === 'TRANSFER') {
          await supabase.from('assets').update({ location_id: movement.to_location }).eq('serial_number', movement.serial_number);
        } else if (movement.type === 'EXIT') {
          await supabase.from('assets').update({ status: 'RETIRED', location_id: null }).eq('serial_number', movement.serial_number);
        }
      }

      const { data, error } = await supabase.from('stock_movements').insert([{
        product_id: movement.product_id,
        from_location: movement.from_location,
        to_location: movement.to_location,
        quantity: movement.quantity,
        type: movement.type,
        serial_number: movement.serial_number,
        reason: movement.reason,
        user_id: movement.user_id,
        reference_doc: movement.reference_doc
      }]).select().single();

      if (error) throw error;

      if (movement.type === 'ENTRY' || movement.type === 'ADJUSTMENT') {
        if (movement.to_location) await this.updateLocationBalance(movement.product_id, movement.to_location, movement.quantity, 'ADD');
      } else if (movement.type === 'EXIT') {
        if (movement.from_location) await this.updateLocationBalance(movement.product_id, movement.from_location, movement.quantity, 'SUB');
      } else if (movement.type === 'TRANSFER') {
        if (movement.from_location) await this.updateLocationBalance(movement.product_id, movement.from_location, movement.quantity, 'SUB');
        if (movement.to_location) await this.updateLocationBalance(movement.product_id, movement.to_location, movement.quantity, 'ADD');
      }

      if (!skipRefresh) await this.loadInitialData();
      return { data, error: null };
    } catch (error: any) {
      console.error('Erro na movimentação:', error);
      return { data: null, error };
    }
  }

  async assignAsset(assetId: string, employeeId: string, userId: string) {
    try {
      const asset = this.assets().find(a => a.id === assetId);
      if (!asset) throw new Error('Ativo não encontrado');

      const moveRes = await this.registerMovement({
        product_id: asset.product_id,
        from_location: asset.location_id,
        quantity: 1,
        type: 'EXIT',
        serial_number: asset.serial_number,
        reason: 'Atribuição ao colaborador',
        user_id: userId
      }, true);

      if (moveRes.error) throw moveRes.error;

      await supabase.from('assets').update({ status: 'IN_USE', employee_id: employeeId, location_id: null }).eq('id', assetId);
      await supabase.from('asset_history').insert([{ asset_id: assetId, user_id: userId, employee_id: employeeId, action: 'CHECKOUT', notes: 'Atribuição de ativo ao colaborador' }]);
      
      await this.loadInitialData();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  async returnAsset(assetId: string, status: any, locationId: string, userId: string) {
    try {
      const asset = this.assets().find(a => a.id === assetId);
      if (!asset) throw new Error('Ativo não encontrado');

      const moveRes = await this.registerMovement({
        product_id: asset.product_id,
        to_location: locationId,
        quantity: 1,
        type: 'ENTRY',
        serial_number: asset.serial_number,
        reason: 'Devolução de colaborador',
        user_id: userId
      }, true);

      if (moveRes.error) throw moveRes.error;

      await supabase.from('assets').update({ status: status, employee_id: null, location_id: locationId }).eq('id', assetId);
      await supabase.from('asset_history').insert([{ asset_id: assetId, user_id: userId, action: 'CHECKIN', to_location: locationId, notes: `Devolução de ativo. Estado: \${status}` }]);

      await this.loadInitialData();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  async sendToMaintenance(assetId: string, userId: string, notes: string) {
    try {
      const asset = this.assets().find(a => a.id === assetId);
      if (!asset) throw new Error('Ativo não encontrado');

      const moveRes = await this.registerMovement({
        product_id: asset.product_id,
        from_location: asset.location_id,
        to_location: 'MANUTENCAO-LAB',
        quantity: 1,
        type: 'TRANSFER',
        serial_number: asset.serial_number,
        reason: 'Envio para laboratório',
        user_id: userId
      }, true);

      if (moveRes.error) throw moveRes.error;

      await supabase.from('assets').update({ status: 'MAINTENANCE', location_id: 'MANUTENCAO-LAB' }).eq('id', assetId);
      await supabase.from('asset_history').insert([{ asset_id: assetId, user_id: userId, action: 'MAINTENANCE', notes: `Enviado para manutenção: \${notes}` }]);
      
      await this.loadInitialData();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  async completeMaintenance(assetId: string, userId: string, log: MaintenanceLog, targetStatus: any, targetLocation: string) {
    try {
      const asset = this.assets().find(a => a.id === assetId);
      if (!asset) throw new Error('Ativo não encontrado');

      // 1. Salva o log técnico detalhado
      await supabase.from('maintenance_logs').insert([log]);

      // 2. Registra a movimentação de volta para o estoque
      const moveRes = await this.registerMovement({
        product_id: asset.product_id,
        from_location: 'MANUTENCAO-LAB',
        to_location: targetLocation,
        quantity: 1,
        type: 'TRANSFER',
        serial_number: asset.serial_number,
        reason: 'Retorno de manutenção concluída',
        user_id: userId
      }, true);

      if (moveRes.error) throw moveRes.error;

      // 3. Atualiza o status final do ativo
      await supabase.from('assets').update({ 
        status: targetStatus, 
        location_id: targetLocation 
      }).eq('id', assetId);

      // 4. Registra no histórico geral
      await supabase.from('asset_history').insert([{ 
        asset_id: assetId, 
        user_id: userId, 
        action: 'MOVE', 
        notes: `Manutenção Concluída: \${log.service_description}. Peças: \${log.parts_replaced || 'Nenhuma'}` 
      }]);

      await this.loadInitialData();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  async getAssetTimeline(assetId: string, serialNumber: string) {
    const [itam, wms, tech] = await Promise.all([
      supabase.from('asset_history').select('*').eq('asset_id', assetId),
      supabase.from('stock_movements').select('*').eq('serial_number', serialNumber),
      supabase.from('maintenance_logs').select('*').eq('asset_id', assetId)
    ]);

    const combined = [
      ...(itam.data || []).map(h => ({ 
        ...h, 
        source: 'ITAM',
        operator_name: this.users().find(u => u.id === h.user_id)?.full_name || 'Sistema',
        employee_name: this.employees().find(e => e.id === h.employee_id)?.full_name
      })),
      ...(wms.data || []).map(h => ({ 
        ...h, 
        source: 'WMS', 
        action: h.type, 
        notes: h.reason,
        operator_name: this.users().find(u => u.id === h.user_id)?.full_name || 'Sistema'
      })),
      ...(tech.data || []).map(h => ({
        ...h,
        source: 'TECH',
        action: 'MAINTENANCE',
        timestamp: h.performed_at,
        notes: `LAUDO TÉCNICO: \${h.service_description} | PEÇAS: \${h.parts_replaced || 'Nenhuma'}`,
        operator_name: this.users().find(u => u.id === h.user_id)?.full_name || 'Técnico'
      }))
    ];
    
    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private async updateLocationBalance(productId: string, locationId: string, qty: number, operation: 'ADD' | 'SUB') {
    const { data } = await supabase.from('stock_levels').select('*').eq('product_id', productId).eq('location_id', locationId).maybeSingle();
    if (data) {
      const newQty = operation === 'ADD' ? data.quantity + qty : data.quantity - qty;
      await supabase.from('stock_levels').update({ quantity: Math.max(0, newQty) }).eq('product_id', productId).eq('location_id', locationId);
    } else if (operation === 'ADD') {
      await supabase.from('stock_levels').insert([{ product_id: productId, location_id: locationId, quantity: qty }]);
    }
  }

  getProductTotalStock(productId: string): number {
    return this.stockLevels()
      .filter(s => s.product_id === productId)
      .reduce((acc, curr) => acc + curr.quantity, 0);
  }

  formatQuantity(productId: string, totalQty: number): string {
    const product = this.products().find(p => p.id === productId);
    if (!product || !product.conversion_factor || product.conversion_factor <= 1) {
      return `${totalQty} ${product?.unit_measure || 'un'}`;
    }
    const boxes = Math.floor(totalQty / product.conversion_factor);
    const remainder = totalQty % product.conversion_factor;
    if (boxes > 0 && remainder > 0) return `${boxes} ${product.unit_measure} + ${remainder} ${product.base_unit_measure}`;
    return boxes > 0 ? `${boxes} ${product.unit_measure}` : `${remainder} ${product.base_unit_measure}`;
  }

  getLocationOccupancy(locationId: string): number {
    return this.stockLevels().filter(s => s.location_id === locationId).reduce((acc, curr) => acc + curr.quantity, 0);
  }

  getLocationContent(locationId: string): any[] {
    return this.stockLevels().filter(s => s.location_id === locationId && s.quantity > 0)
      .map(s => ({
        ...s,
        product_name: this.products().find(p => p.id === s.product_id)?.name,
        serials: this.assets().filter(a => a.product_id === s.product_id && a.location_id === locationId).map(a => a.serial_number)
      }));
  }

  async updateAssetDetails(assetId: string, details: any) {
    const res = await supabase.from('assets').update(details).eq('id', assetId);
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async updateAssetStatus(assetId: string, newStatus: any, userId: string, notes: string) {
    const res = await supabase.from('assets').update({ status: newStatus }).eq('id', assetId);
    if (!res.error) {
      await supabase.from('asset_history').insert([{ asset_id: assetId, user_id: userId, action: 'MOVE', notes }]);
      await this.loadInitialData();
    }
    return res;
  }
  async retireAsset(assetId: string, userId: string, reason: string) {
    const asset = this.assets().find(a => a.id === assetId);
    if (asset?.location_id) await this.updateLocationBalance(asset.product_id, asset.location_id, 1, 'SUB');
    const res = await supabase.from('assets').update({ status: 'RETIRED', location_id: null, employee_id: null }).eq('id', assetId);
    if (!res.error) {
      await supabase.from('asset_history').insert([{ asset_id: assetId, user_id: userId, action: 'RETIRE', notes: reason }]);
      await this.loadInitialData();
    }
    return res;
  }
  async startInventorySession(id: string) { 
    const res = await supabase.from('inventory_sessions').insert([{ id, warehouse_id: 'WH-01', status: 'OPEN' }]); 
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async finishInventory(sessionId: string, items: InventoryItem[]) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('inventory_items').insert(items);
    for (const item of items) {
      if (item.difference !== 0) {
        await this.registerMovement({
          product_id: item.product_id, quantity: Math.abs(item.difference),
          type: 'ADJUSTMENT', to_location: item.difference > 0 ? item.location_id : null,
          from_location: item.difference < 0 ? item.location_id : null,
          reason: `Ajuste de Inventário - Sessão \${sessionId}`, user_id: user?.id
        }, true);
      }
    }
    const res = await supabase.from('inventory_sessions').update({ status: 'CLOSED', end_date: new Date() }).eq('id', sessionId);
    await this.loadInitialData();
    return res;
  }
  async createUserWithAuth(user: any, pass: string) { return supabase.functions.invoke('create-user', { body: { email: user.email, password: pass, profileData: user } }); }
  async updateProfile(user: any) { 
    const { id, created_at, ...updateData } = user;
    const res = await supabase.from('profiles').update(updateData).eq('id', id);
    if (!res.error) await this.loadInitialData();
    return res;
  }
  async deleteUser(id: string) { return supabase.functions.invoke('delete-user', { body: { userId: id } }); }
}