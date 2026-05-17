import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../services/wishlist.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    NgFor,
    NgIf,
    RouterLink
  ],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css']
})
export class WishlistComponent implements OnInit {
  wishlist: any[] = [];
  wishlistProducts: any[] = [];
  loading = true;
  errorMessage = '';
  isLoggedIn = false;

  constructor(
    private wishlistService: WishlistService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('token');

    if (!this.isLoggedIn) {
      this.loading = false;
      return;
    }

    this.loadWishlist();
  }

  loadWishlist(): void {
    this.loading = true;
    this.errorMessage = '';

    this.wishlistService.loadWishlist().subscribe({
      next: (data) => {
        this.wishlist = data || [];
        this.wishlistProducts =
          this.normalizeWishlistProducts(this.wishlist);
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Unable to load your wishlist right now.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  removeFromWishlist(product: any): void {
    if (!product?._id) {
      return;
    }

    const removedProduct = product;

    this.wishlist =
      this.wishlist.filter((wishlistItem) => this.getProduct(wishlistItem)?._id !== product._id);

    this.wishlistProducts =
      this.wishlistProducts.filter((wishlistProduct) => wishlistProduct._id !== product._id);

    this.wishlistService.removeFromWishlist(product._id).subscribe({
      error: (err) => {
        console.error(err);
        this.wishlistProducts = [...this.wishlistProducts, removedProduct];
        this.cd.detectChanges();
      }
    });
  }

  getProduct(item: any): any {
    return item?.productId || item;
  }

  normalizeWishlistProducts(items: any[]): any[] {
    return (items || [])
      .map((item) => this.getProduct(item))
      .filter((product) => {
        return !!(
          product &&
          typeof product === 'object' &&
          product._id &&
          product.name
        );
      });
  }

  getWishlistCount(): number {
    return this.wishlistProducts.length;
  }

  formatStorage(storage: number): string {
    return storage >= 1024
      ? `${storage / 1024}TB`
      : `${storage}GB`;
  }

  trackByProduct(index: number, product: any): string {
    return product?._id || index.toString();
  }
}
