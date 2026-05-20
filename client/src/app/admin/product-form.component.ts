import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  isEdit = false;
  productId = '';
  idealForText = '';

  availabilityOptions = [
    { value: 'in-stock', label: 'In stock' },
    { value: 'low-stock', label: 'Low stock' },
    { value: 'out-of-stock', label: 'Out of stock' },
    { value: 'pre-order', label: 'Pre-order' },
    { value: 'discontinued', label: 'Discontinued' }
  ];

  conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'open-box', label: 'Open box' },
    { value: 'refurbished', label: 'Refurbished' },
    { value: 'used', label: 'Used' }
  ];

  networkOptions = ['5G', '4G', '4G/5G', 'LTE', '3G'];

  product: any = this.createEmptyProduct();

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';

    if (this.productId) {
      this.isEdit = true;
      this.productService.getProduct(this.productId)
        .subscribe({
          next: (data: any) => {
            this.product = {
              ...this.createEmptyProduct(),
              ...data,
              isFeatured: !!data.isFeatured
            };
            this.idealForText = Array.isArray(data.idealFor)
              ? data.idealFor.join(', ')
              : data.idealFor || '';
            this.cd.detectChanges();
          },
          error: (err) => console.error('Profile extraction failure:', err)
        });
    }
  }

  createEmptyProduct(): any {
    return {
      name: '',
      brand: '',
      model: '',
      variantName: '',
      price: null,
      availabilityStatus: 'in-stock',
      condition: 'new',
      launchYear: null,
      image: '',
      category: 'smartphone',
      stock: 50,
      description: '',
      ram: null,
      storage: null,
      battery: null,
      chargingSpeed: null,
      refreshRate: 60,
      displaySize: null,
      rearCameraMP: null,
      rearCameraDetails: '',
      frontCameraMP: null,
      processor: '',
      processorTier: 'midrange',
      processorFabrication: '',
      network: '5G',
      displayType: '',
      displayResolution: '',
      brightness: '',
      os: '',
      uiSkin: '',
      uiVersion: '',
      biometricSecurity: '',
      speaker: '',
      waterproof: '',
      videoRecording: '',
      gamingScore: 70,
      cameraScore: 70,
      performanceScore: 70,
      batteryScore: 70,
      designScore: 70,
      displayScore: 70,
      valueScore: 70,
      priceSegment: 'midrange',
      idealFor: [],
      isFeatured: false
    };
  }

  getGeneratedName(): string {
    const generated = [
      this.product.brand,
      this.product.model,
      this.product.variantName
    ]
      .map((part: string) => String(part || '').trim())
      .filter(Boolean)
      .join(' ');

    return generated || this.product.name || 'Generated after brand, model, and variant are filled';
  }

  toggleFeatured(): void {
    this.product.isFeatured = !this.product.isFeatured;
    this.cd.detectChanges();
  }

  getRangeBackground(value: number): string {
    const score = Math.max(10, Math.min(100, Number(value || 50)));
    const percentage = ((score - 10) / 90) * 100;

    return `linear-gradient(90deg, #00d2ff 0%, #a855f7 ${percentage}%, rgba(255, 255, 255, 0.09) ${percentage}%, rgba(255, 255, 255, 0.09) 100%)`;
  }

  buildPayload(): any {
    const generatedName = [
      this.product.brand,
      this.product.model,
      this.product.variantName
    ]
      .map((part: string) => String(part || '').trim())
      .filter(Boolean)
      .join(' ');

    return {
      ...this.product,
      name: generatedName || this.product.name,
      idealFor: this.idealForText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    };
  }

  submitForm() {
    const payload = this.buildPayload();

    if (this.isEdit) {
      this.productService
        .updateProduct(this.productId, payload)
        .subscribe({
          next: () => {
            alert('Hardware configuration profile updated successfully.');
            this.router.navigate(
              ['/admin'],
              { state: { fromAdminArea: true } }
            );
          },
          error: (err) => console.error(err)
        });
    } else {
      this.productService
        .createProduct(payload)
        .subscribe({
          next: () => {
            alert('New hardware profile deployed to tracking metrics matrix.');
            this.router.navigate(
              ['/admin'],
              { state: { fromAdminArea: true } }
            );
          },
          error: (err) => console.error(err)
        });
    }
  }
}
