import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-url';

@Injectable({
  providedIn: 'root'
})

export class ProductService {

  private apiUrl = `${API_BASE_URL}/products`;

  constructor(private http: HttpClient) {}

  // GET ALL
  getProducts(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // GET SINGLE
  getProduct(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // CREATE
  createProduct(product: any): Observable<any> {
    return this.http.post(this.apiUrl, product);
  }

  // UPDATE
  updateProduct(id: string, product: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, product);
  }

  // DELETE
  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleFeatured(id: string) {
    // Fires the patch request straight to your newly built Express sequential route core
    return this.http.patch(`${this.apiUrl}/${id}/toggle-featured`, {});
  }
}
