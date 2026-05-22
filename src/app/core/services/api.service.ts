import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  
  // URLs dos microserviços (em prod viriam de environment)
  private readonly CATALOG_URL = 'http://localhost:3001/products';
  private readonly STOCK_URL = 'http://localhost:3002/stock';

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(this.CATALOG_URL);
  }

  createProduct(product: any): Observable<any> {
    return this.http.post(this.CATALOG_URL, product);
  }

  registerMovement(movement: any): Observable<any> {
    return this.http.post(`${this.STOCK_URL}/move`, movement);
  }

  getStockBalance(productId: string): Observable<any> {
    return this.http.get(`${this.STOCK_URL}/balance/${productId}`);
  }
}