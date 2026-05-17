import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { API_BASE_URL } from './api-url';

@Injectable({
  providedIn: 'root'
})

export class WishlistService {

  apiUrl =
    `${API_BASE_URL}/wishlist`;

  constructor(
    private http: HttpClient
  ) {}

  // ❤️ HEADERS
  getHeaders() {

    return {

      headers: new HttpHeaders({

        Authorization:
          `Bearer ${localStorage.getItem('token')}`

      })

    };

  }

  // ❤️ LOAD
  loadWishlist() {

    return this.http.get<any[]>(

      this.apiUrl,

      this.getHeaders()

    );

  }

  // ❤️ ADD
  addToWishlist(product: any) {

    return this.http.post(

      `${this.apiUrl}/${product._id}`,

      {},

      this.getHeaders()

    );

  }

  // ❤️ REMOVE
  removeFromWishlist(productId: string) {

    return this.http.delete(

      `${this.apiUrl}/${productId}`,

      this.getHeaders()

    );

  }

}
