import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 👈 Added ChangeDetectorRef
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

  product: any = {
    name: '',
    brand: '',
    category: '',
    image: '',
    price: null,
    stock: null,
    description: '',
    ram: null,
    storage: null,
    processor: '',
    battery: null,
    processorTier: 'midrange',
    priceSegment: 'midrange',
    gamingScore: 70,
    cameraScore: 70,
    performanceScore: 70,
    batteryScore: 70,
    designScore: 70,
    displayScore: 70,
    valueScore: 70,
    isFeatured: false 
  };

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef // 👈 Injected Change Detector here
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';

    if (this.productId) {
      this.isEdit = true;
      this.productService.getProduct(this.productId)
        .subscribe({
          next: (data: any) => {
            // Merges data and uses double exclamation (!!) to force undefined values into a strict false
            this.product = { ...this.product, ...data };
            this.product.isFeatured = !!data.isFeatured;
            this.cd.detectChanges();
          },
          error: (err) => console.error("Profile extraction failure:", err)
        });
    }
  }

  // ⚡ NEW ACTION METHOD: Forces the switch to invert and paint the screen instantly
  toggleFeatured(): void {
    this.product.isFeatured = !this.product.isFeatured;
    this.cd.detectChanges(); // 👈 Slices right through UI render lag
  }

  getRangeBackground(value: number): string {
    const score =
      Math.max(10, Math.min(100, Number(value || 50)));
    const percentage =
      ((score - 10) / 90) * 100;

    return `linear-gradient(90deg, #00d2ff 0%, #a855f7 ${percentage}%, rgba(255, 255, 255, 0.09) ${percentage}%, rgba(255, 255, 255, 0.09) 100%)`;
  }

  submitForm() {
    if (this.isEdit) {
      this.productService
        .updateProduct(this.productId, this.product)
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
        .createProduct(this.product)
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
