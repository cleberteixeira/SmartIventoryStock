import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'locations',
        loadComponent: () => import('./features/locations/location-list.component').then(m => m.LocationListComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/employees/employee-list.component').then(m => m.EmployeeListComponent)
      },
      {
        path: 'assets',
        loadComponent: () => import('./features/assets/asset-list.component').then(m => m.AssetListComponent)
      },
      {
        path: 'stock',
        loadComponent: () => import('./features/stock/movement.component').then(m => m.MovementComponent)
      },
      {
        path: 'assignment',
        loadComponent: () => import('./features/assets/assignment.component').then(m => m.AssignmentComponent)
      },
      {
        path: 'checkin',
        loadComponent: () => import('./features/assets/checkin.component').then(m => m.CheckinComponent)
      },
      {
        path: 'maintenance',
        loadComponent: () => import('./features/assets/maintenance.component').then(m => m.MaintenanceComponent)
      },
      {
        path: 'traceability',
        loadComponent: () => import('./features/assets/traceability.component').then(m => m.TraceabilityComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/activity-log.component').then(m => m.ActivityLogComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'help',
        loadComponent: () => import('./features/help/documentation.component').then(m => m.DocumentationComponent)
      }
    ]
  }
];