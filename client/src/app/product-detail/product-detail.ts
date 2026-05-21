import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { WishlistService } from '../services/wishlist.service';
import { API_BASE_URL } from '../services/api-url';

interface DetailItem {
  label: string;
  value: string;
}

interface DetailSection {
  title: string;
  items: DetailItem[];
}

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
export class ProductDetail implements OnInit {
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

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.fetchProduct(id);
      }
    });
  }

  fetchProduct(id: string): void {
    this.loading = true;

    this.http
      .get<any>(`${API_BASE_URL}/products/${id}`)
      .subscribe({
        next: (data) => {
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

  loadVariants(id: string): void {
    this.http
      .get<any>(`${API_BASE_URL}/products/${id}/variants`)
      .subscribe({
        next: (data) => {
          this.baseProductName =
            data.baseName || this.getCleanProductName(this.product?.name);
          this.variants = data.variants || [];
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.baseProductName = this.getCleanProductName(this.product?.name);
          this.variants = this.product ? [this.product] : [];
        }
      });
  }

  loadWishlist(): void {
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

  toggleWishlist(product: any): void {
    if (!localStorage.getItem('token')) {
      alert('Please login first');
      return;
    }

    if (this.isInWishlist(product._id)) {
      this.wishlist = this.wishlist.filter((item) => {
        if (item.productId?._id) {
          return item.productId._id !== product._id;
        }

        return item._id !== product._id;
      });

      this.wishlistService
        .removeFromWishlist(product._id)
        .subscribe({
          error: (err) => {
            console.error(err);
          }
        });
    } else {
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

  getMetaPills(): string[] {
    if (!this.product) {
      return [];
    }

    return [
      this.product.brand,
      this.product.category,
      this.product.network,
      this.product.launchYear ? `${this.product.launchYear}` : '',
      this.getConditionLabel(),
      this.getAvailabilityLabel()
    ]
      .filter(Boolean)
      .slice(0, 6);
  }

  getHeroSpecs(): DetailItem[] {
    if (!this.product) {
      return [];
    }

    return [
      { label: 'RAM', value: `${this.product.ram || 0}GB` },
      { label: 'Storage', value: this.formatStorage(this.product.storage || 0) },
      { label: 'Battery', value: `${this.product.battery || 0}mAh` },
      { label: 'Camera', value: this.getPrimaryCameraLabel() },
      { label: 'Display', value: this.product.refreshRate ? `${this.product.refreshRate}Hz` : this.valueOrFallback(this.product.displayType) }
    ].filter((item) => item.value && item.value !== '0GB' && item.value !== '0mAh');
  }

  getCameraHighlights(): DetailItem[] {
    if (!this.product) {
      return [];
    }

    const highlights = [
      this.detail('Rear array', this.getCameraDetailsLabel()),
      this.detail('Selfie', this.product.frontCameraMP ? `${this.product.frontCameraMP}MP front` : ''),
      this.detail('Video', this.product.videoRecording),
      this.detail('Camera score', this.product.cameraScore ? `${this.product.cameraScore}/100` : '')
    ];

    return highlights.filter((item) => Boolean(item.value));
  }

  getCameraHeadline(): string {
    return this.getPrimaryCameraLabel();
  }

  getInsightCards(): DetailItem[] {
    if (!this.product) {
      return [];
    }

    const insights: DetailItem[] = [];

    if (this.product.processor) {
      insights.push({
        label: 'Power',
        value: `${this.toTitleCase(this.product.processorTier || 'balanced')} silicon with ${this.product.processor}`
      });
    }

    const cameraLabel = this.getPrimaryCameraLabel();

    if (cameraLabel || this.product.videoRecording) {
      insights.push({
        label: 'Camera',
        value: [
          cameraLabel,
          this.product.videoRecording
        ].filter(Boolean).join(' · ')
      });
    }

    if (this.product.displayType || this.product.refreshRate) {
      insights.push({
        label: 'Visuals',
        value: [
          this.product.displayType,
          this.product.refreshRate ? `${this.product.refreshRate}Hz` : '',
          this.product.brightness
        ].filter(Boolean).join(' · ')
      });
    }

    if (this.product.battery || this.product.chargingSpeed) {
      insights.push({
        label: 'Endurance',
        value: [
          this.product.battery ? `${this.product.battery}mAh` : '',
          this.product.chargingSpeed ? `${this.product.chargingSpeed}W charging` : ''
        ].filter(Boolean).join(' · ')
      });
    }

    if (this.getIdealForList().length) {
      insights.push({
        label: 'Best for',
        value: this.getIdealForList().slice(0, 3).join(', ')
      });
    }

    return insights.filter((item) => item.value).slice(0, 4);
  }

  getScoreMetrics(): any[] {
    if (!this.product) {
      return [];
    }

    return [
      { label: 'Performance', value: this.product.performanceScore || 50 },
      { label: 'Camera', value: this.product.cameraScore || 50 },
      { label: 'Battery', value: this.product.batteryScore || 50 },
      { label: 'Gaming', value: this.product.gamingScore || 50 },
      { label: 'Display', value: this.product.displayScore || 50 },
      { label: 'Design', value: this.product.designScore || 50 },
      { label: 'Value', value: this.product.valueScore || 50 }
    ];
  }

  getSpecSections(): DetailSection[] {
    if (!this.product) {
      return [];
    }

    const sections: DetailSection[] = [
      {
        title: 'Performance',
        items: [
          this.detail('Processor', this.product.processor),
          this.detail('Silicon tier', this.toTitleCase(this.product.processorTier)),
          this.detail('Fabrication', this.product.processorFabrication),
          this.detail('RAM', this.product.ram ? `${this.product.ram}GB` : ''),
          this.detail('Storage', this.product.storage ? this.formatStorage(this.product.storage) : ''),
          this.detail('Network', this.product.network)
        ]
      },
      {
        title: 'Display',
        items: [
          this.detail('Size', this.product.displaySize ? `${this.product.displaySize} inch` : ''),
          this.detail('Type', this.product.displayType),
          this.detail('Resolution', this.product.displayResolution),
          this.detail('Refresh rate', this.product.refreshRate ? `${this.product.refreshRate}Hz` : ''),
          this.detail('Brightness', this.product.brightness)
        ]
      },
      {
        title: 'Camera & Video',
        items: [
          this.detail('Rear camera', this.product.rearCameraMP ? `${this.product.rearCameraMP}MP` : ''),
          this.detail('Rear details', this.product.rearCameraDetails),
          this.detail('Front camera', this.product.frontCameraMP ? `${this.product.frontCameraMP}MP` : ''),
          this.detail('Video recording', this.product.videoRecording)
        ]
      },
      {
        title: 'Battery & Build',
        items: [
          this.detail('Battery', this.product.battery ? `${this.product.battery}mAh` : ''),
          this.detail('Charging', this.product.chargingSpeed ? `${this.product.chargingSpeed}W` : ''),
          this.detail('Water protection', this.product.waterproof),
          this.detail('Speaker', this.product.speaker),
          this.detail('Biometrics', this.product.biometricSecurity)
        ]
      },
      {
        title: 'Software & Market',
        items: [
          this.detail('OS', this.product.os),
          this.detail('UI skin', this.product.uiSkin),
          this.detail('UI version', this.product.uiVersion),
          this.detail('Launch year', this.product.launchYear),
          this.detail('Condition', this.getConditionLabel()),
          this.detail('Availability', this.getAvailabilityLabel()),
          this.detail('Price segment', this.getPriceSegmentLabel())
        ]
      }
    ];

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => Boolean(item.value))
      }))
      .filter((section) => section.items.length > 0);
  }

  getIdealForList(): string[] {
    if (!this.product?.idealFor) {
      return [];
    }

    return Array.isArray(this.product.idealFor)
      ? this.product.idealFor.filter(Boolean)
      : String(this.product.idealFor)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
  }

  getScoreBackground(value: number): string {
    const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
    return `linear-gradient(90deg, #54d6ff 0%, #8b5cf6 ${safeValue}%, rgba(255,255,255,0.08) ${safeValue}%, rgba(255,255,255,0.08) 100%)`;
  }

  selectVariant(variant: any): void {
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
    const count = this.variants.length;

    return count === 1
      ? '1 configuration'
      : `${count} configurations`;
  }

  getDisplayName(): string {
    return this.baseProductName ||
      this.getCleanProductName(this.product?.name);
  }

  getVariantName(): string {
    return this.product?.variantName || this.getVariantLabel(this.product || {});
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
    const numericStorage = Number(storage || 0);

    return numericStorage >= 1024
      ? `${numericStorage / 1024}TB`
      : `${numericStorage}GB`;
  }

  isInWishlist(id: string): boolean {
    return this.wishlist.some((item) => {
      if (item.productId?._id === id) {
        return true;
      }

      if (item._id === id) {
        return true;
      }

      return false;
    });
  }

  getWishlistCount(): number {
    return this.wishlist.length;
  }

  private detail(label: string, value: unknown): DetailItem {
    return {
      label,
      value: this.valueOrFallback(value)
    };
  }

  private valueOrFallback(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return String(value);
  }

  private getAvailabilityLabel(): string {
    const labels: Record<string, string> = {
      'in-stock': 'In stock',
      'low-stock': 'Low stock',
      'out-of-stock': 'Out of stock',
      'pre-order': 'Pre-order',
      discontinued: 'Discontinued'
    };

    return labels[this.product?.availabilityStatus] || '';
  }

  private getConditionLabel(): string {
    const labels: Record<string, string> = {
      new: 'New',
      used: 'Used',
      refurbished: 'Refurbished',
      'open-box': 'Open box'
    };

    return labels[this.product?.condition] || '';
  }

  private getPriceSegmentLabel(): string {
    const labels: Record<string, string> = {
      budget: 'Budget',
      midrange: 'Midrange',
      premium: 'Premium',
      'ultra-premium': 'Ultra premium'
    };

    return labels[this.product?.priceSegment] || '';
  }

  private getPrimaryCameraLabel(): string {
    if (!this.product) {
      return '';
    }

    if (this.product.rearCameraMP) {
      return `${this.product.rearCameraMP}MP rear system`;
    }

    if (this.product.rearCameraDetails) {
      return 'Rear camera system';
    }

    if (this.product.cameraScore) {
      return `${this.product.cameraScore}/100 camera score`;
    }

    return '';
  }

  private getCameraDetailsLabel(): string {
    if (!this.product) {
      return '';
    }

    if (this.product.rearCameraDetails) {
      return this.product.rearCameraDetails;
    }

    return this.product.rearCameraMP
      ? `${this.product.rearCameraMP}MP main camera`
      : '';
  }

  private toTitleCase(value: unknown): string {
    return String(value || '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
