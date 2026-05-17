import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule,
  CurrencyPipe,
  NgIf
} from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  HttpClient
} from '@angular/common/http';

import {
  ChangeDetectorRef
} from '@angular/core';

import {
  WishlistService
} from '../services/wishlist.service';

import { API_BASE_URL } from '../services/api-url';

@Component({
  selector: 'app-product-detail',

  standalone: true,

  imports: [
    CommonModule,
    CurrencyPipe,
    NgIf,
    RouterLink
  ],

  templateUrl: './product-detail.html',

  styleUrls: ['./product-detail.css']
})

export class ProductDetail
implements OnInit {

  product: any = null;

  variants: any[] = [];

  baseProductName = '';

  wishlist: any[] = [];

  loading = true;

  constructor(

    private route: ActivatedRoute,

    private router: Router,

    private http: HttpClient,

    private cd: ChangeDetectorRef,

    private wishlistService: WishlistService

  ) {}

  ngOnInit(): void {

    this.loadWishlist();

    this.route.paramMap
      .subscribe(params => {

        const id =
          params.get('id');

        if (id) {

          this.fetchProduct(id);

        }

      });

  }

  // ✅ LOAD PRODUCT
  fetchProduct(id: string) {

    this.loading = true;

    this.http
      .get<any>(
        `${API_BASE_URL}/products/${id}`
      )
      .subscribe({

        next: (data) => {

          console.log('✅ PRODUCT:', data);

          this.product = data;

          this.loading = false;

          this.loadVariants(id);

          this.cd.detectChanges();

        },

        error: (err) => {

          console.error(err);

          this.loading = false;

        }

      });

  }

loadVariants(id: string) {

  this.http
    .get<any>(
      `${API_BASE_URL}/products/${id}/variants`
    )
    .subscribe({

      next: (data) => {

        this.baseProductName =
          data.baseName || this.getCleanProductName(this.product?.name);

        this.variants =
          data.variants || [];

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error(err);

        this.baseProductName =
          this.getCleanProductName(this.product?.name);

        this.variants =
          this.product ? [this.product] : [];

      }

    });

}

  // ✅ LOAD WISHLIST
loadWishlist() {

  if (!localStorage.getItem('token')) {

    this.wishlist = [];

    return;

  }

  this.wishlistService
    .loadWishlist()
    .subscribe({

      next: (data) => {

        this.wishlist = data;

      },

      error: (err) => {

        console.error(err);

      }

    });

}

  // ❤️ TOGGLE
toggleWishlist(product: any) {

  if (!localStorage.getItem('token')) {

    alert('Please login first');

    return;

  }

  // ❤️ REMOVE
  if (this.isInWishlist(product._id)) {

this.wishlist = this.wishlist.filter(

  item => {

    if (item.productId?._id) {

      return item.productId._id !== product._id;

    }

    return item._id !== product._id;

  }

);

    this.wishlistService
      .removeFromWishlist(product._id)
      .subscribe({

        error: (err) => {

          console.error(err);

        }

      });

  }

  // ❤️ ADD
  else {

    this.wishlist.push(product);

    this.wishlistService
      .addToWishlist(product)
      .subscribe({

        error: (err) => {

          console.error(err);

        }

      });

  }

}

isLoggedIn(): boolean {

  return !!localStorage.getItem('token');

}

getStockLabel(): string {

  if (!this.product) {

    return '';

  }

  if (this.product.stock <= 0) {

    return 'Out of stock';

  }

  if (this.product.stock <= 5) {

    return `${this.product.stock} left`;

  }

  return `${this.product.stock} available`;

}

getScoreMetrics() {

  if (!this.product) {

    return [];

  }

  return [
    {
      label: 'Performance',
      value: this.product.performanceScore || 50
    },
    {
      label: 'Camera',
      value: this.product.cameraScore || 50
    },
    {
      label: 'Battery',
      value: this.product.batteryScore || 50
    },
    {
      label: 'Gaming',
      value: this.product.gamingScore || 50
    }
  ];

}

selectVariant(variant: any) {

  if (!variant || variant._id === this.product?._id) {

    return;

  }

  this.router.navigate(
    ['/products', variant._id],
    { replaceUrl: true }
  );

}

isSelectedVariant(variant: any): boolean {

  return variant?._id === this.product?._id;

}

getVariantLabel(variant: any): string {

  return `${variant.ram}GB / ${this.formatStorage(variant.storage)}`;

}

getVariantSubLabel(variant: any): string {

  return `₹${Number(variant.price || 0).toLocaleString('en-IN')}`;

}

getVariantCountLabel(): string {

  const count =
    this.variants.length;

  return count === 1
    ? '1 configuration'
    : `${count} configurations`;

}

getDisplayName(): string {

  return this.baseProductName ||
    this.getCleanProductName(this.product?.name);

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

formatStorage(storage: number): string {

  return storage >= 1024
    ? `${storage / 1024}TB`
    : `${storage}GB`;

}
  // ❤️ CHECK
isInWishlist(id: string): boolean {

  return this.wishlist.some(

    item => {

      // populated wishlist
      if (item.productId?._id === id) {

        return true;

      }

      // optimistic local item
      if (item._id === id) {

        return true;

      }

      return false;

    }

  );

}

  // ❤️ COUNT
  getWishlistCount(): number {

    return this.wishlist.length;

  }

  

}
