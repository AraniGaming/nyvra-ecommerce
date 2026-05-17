import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WishlistService } from '../services/wishlist.service';
import { API_BASE_URL } from '../services/api-url';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    CurrencyPipe,
    RouterModule
  ],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class Products implements OnInit {
  products: any[] = [];
  wishlist: any[] = [];
  loading = true;

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();

    this.http.get<any[]>(`${API_BASE_URL}/products`).subscribe({
      next: (data) => {
        // 🧠 Group your duplicate storage options into clean, individual base device cards
        this.products = this.groupProductVariants(data || []);
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Pipeline failure:", err);
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  // 🛠️ THE DEDUPLICATION STATE ENGINE
  groupProductVariants(rawProducts: any[]): any[] {
    const groupedMap: { [key: string]: any } = {};

    rawProducts.forEach(product => {
      const baseName = this.getCleanProductName(product.name);

      if (!groupedMap[baseName]) {
        // Initialize the unique baseline card profile
        groupedMap[baseName] = {
          ...product,
          name: baseName, 
          allVariants: [product]
        };
      } else {
        groupedMap[baseName].allVariants.push(product);
        // Ensure the card always represents the cheapest variant ("From ₹...")
        if (product.price < groupedMap[baseName].price) {
          groupedMap[baseName].price = product.price;
          groupedMap[baseName]._id = product._id; // Route to target selection id
        }
      }
    });

    return Object.values(groupedMap);
  }

  getCleanProductName(name = ''): string {
    const normalizedName =
      String(name).replace(/\s+/g, ' ').trim();

    return normalizedName
      .replace(/\s+\d+\s*GB\s*(?:RAM)?\s*\+\s*\d+\s*(?:GB|TB)\s*(?:Storage)?$/i, '')
      .replace(/\s+\d+\s*GB\s*(?:RAM)?\s*\/\s*\d+\s*(?:GB|TB)\s*(?:Storage)?$/i, '')
      .replace(/\s+\d+\s*GB\s*(?:RAM)?$/i, '')
      .trim() || normalizedName;
  }

  loadWishlist() {
    this.wishlistService.loadWishlist().subscribe({
      next: (data) => {
        this.wishlist = data;
        this.cd.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  toggleWishlist(product: any) {
    if (!localStorage.getItem('token')) {
      alert('Please authenticate your session first.');
      return;
    }

    if (this.isInWishlist(product._id)) {
      this.wishlist = this.wishlist.filter(item => {
        return item.productId?._id !== product._id && item._id !== product._id;
      });
      this.wishlistService.removeFromWishlist(product._id).subscribe({
        error: (err) => console.error(err)
      });
    } else {
      this.wishlist.push(product);
      this.wishlistService.addToWishlist(product).subscribe({
        error: (err) => console.error(err)
      });
    }
    this.cd.detectChanges();
  }

  isInWishlist(id: string): boolean {
    return this.wishlist.some(item => item.productId?._id === id || item._id === id);
  }

  getWishlistCount(): number {
    return this.wishlist.length;
  }
}
