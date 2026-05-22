export type Category = string;
export type UnitMeasure = string;
export type MovementType = 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT';
export type LocationType = 'PICKING' | 'BULK' | 'QUARANTINE';
export type SessionStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type UserRole = 'ADMIN' | 'RESOURCE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'TRANSIT' | 'PENDING_CLEANING' | 'DAMAGED' | 'RETIRED';

export interface Site {
  id: string;
  name: string;
  created_at: Date;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  department: string;
  type: 'PRODUCTIVE' | 'NON_PRODUCTIVE';
}

export interface Product {
  id: string;
  sku: string;
  ean: string;
  name: string;
  description?: string;
  category: Category;
  unit_measure: UnitMeasure;
  base_unit_measure?: UnitMeasure;
  conversion_factor?: number;
  unit_cost: number;
  min_stock: number;
  depreciation_months: number;
  status: 'ACTIVE' | 'INACTIVE';
  requires_serial_number: boolean;
  created_at: Date;
}

export interface Employee {
  id: string;
  full_name: string;
  document: string;
  email: string;
  department: string;
  location?: string;
  cost_center?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
}

export interface Asset {
  id: string;
  product_id: string;
  serial_number: string;
  status: AssetStatus;
  employee_id?: string;
  location_id?: string;
  cost_center?: string;
  warranty_expiry?: Date;
  acquisition_date?: Date;
  acquisition_value?: number;
  created_at: Date;
}

export interface AssetHistory {
  id: string;
  asset_id: string;
  user_id: string;
  employee_id?: string;
  action: 'CHECKOUT' | 'CHECKIN' | 'MOVE' | 'ADJUSTMENT' | 'MAINTENANCE' | 'RETIRE';
  from_location?: string;
  to_location?: string;
  notes?: string;
  timestamp: Date;
}

export interface MaintenanceLog {
  id?: string;
  asset_id: string;
  user_id: string;
  service_description: string;
  parts_replaced?: string;
  performed_at?: Date;
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  type: LocationType;
  status: 'ACTIVE' | 'INACTIVE' | 'FULL';
}

export interface StockLevel {
  product_id: string;
  location_id: string;
  quantity: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  from_location?: string;
  to_location?: string;
  quantity: number;
  type: MovementType;
  serial_number?: string;
  reference_doc?: string;
  reason: string;
  timestamp: Date;
  user_id?: string;
}

export interface InventorySession {
  id: string;
  warehouse_id: string;
  status: SessionStatus;
  start_date: Date;
  end_date?: Date;
}

export interface InventoryItem {
  session_id: string;
  product_id: string;
  location_id: string;
  expected_quantity: number;
  counted_quantity: number;
  difference: number;
}

export interface UserProfile {
  id?: string;
  full_name: string;
  email: string;
  specialty: string;
  cellphone: string;
  whatsapp: string;
  landline: string;
  location: string;
  role: UserRole;
  status: UserStatus;
  language?: string;
  created_at?: Date;
}