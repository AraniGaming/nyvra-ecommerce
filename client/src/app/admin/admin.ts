import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router'; // 👈 Imported native Angular router
import { ProductService } from '../services/product.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
  products: any[] = [];
  newAdmin = {
    email: '',
    password: ''
  };
  creatingAdmin = false;
  adminCreateMessage = '';
  adminCreateError = '';

  constructor(
    private productService: ProductService,
    private cd: ChangeDetectorRef,
    private router: Router, // 👈 Injected Router service pipeline
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  logout() {
    this.authService.logout();
    // ✅ Fixed: Uses native SPA navigation routing instead of window thread resets
    this.router.navigate(['/admin-login']);
  }

  loadProducts() {
    this.productService
      .getProducts()
      .subscribe({
        next: (data: any) => {
          console.log('API DATA RECEIVED:', data);
          // ✅ Fixed Race Condition: Bind data first, then force the Change Detector paint execution loop
          this.products = data || [];
          this.cd.detectChanges();
        },
        error: (error) => {
          console.error('API ERROR MIGRATION:', error);
        }
      });
  }

  deleteProduct(id: string) {
    const confirmDelete = confirm('Execute irreversible hardware asset deletion sequence?');
    if (confirmDelete) {
      this.productService
        .deleteProduct(id)
        .subscribe({
          next: () => {
            this.loadProducts();
          },
          error: (err) => console.error(err)
        });
    }
  }

  createAdminAccount() {
    this.adminCreateMessage = '';
    this.adminCreateError = '';

    const email = this.newAdmin.email.trim().toLowerCase();
    const password = this.newAdmin.password;

    if (!email || !password) {
      this.adminCreateError = 'Enter an email and password.';
      return;
    }

    if (password.length < 8) {
      this.adminCreateError = 'Password must be at least 8 characters.';
      return;
    }

    this.creatingAdmin = true;

    this.authService
      .createAdmin({ email, password })
      .subscribe({
        next: (res: any) => {
          this.adminCreateMessage =
            res?.message || 'Admin account created.';
          this.newAdmin = {
            email: '',
            password: ''
          };
          this.creatingAdmin = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.adminCreateError =
            err?.error?.message || 'Could not create admin account.';
          this.creatingAdmin = false;
          this.cd.detectChanges();
        }
      });
  }

toggleFeaturedStatus(product: any): void {
    console.log("⭐ Star Clicked for Asset:", product.name);
    console.log("Current Status BEFORE shift:", product.isFeatured);

    // Toggle the value
    product.isFeatured = !product.isFeatured;
    
    console.log("New Status AFTER shift:", product.isFeatured);
    
    // Force view rendering repaint immediately
    this.cd.detectChanges();

    this.productService.toggleFeatured(product._id).subscribe({
      next: (response: any) => {
        console.log("✅ Backend synced featured status successfully:", response);
      },
      error: (err: any) => {
        console.error("❌ Showcase toggle failed, rolling back status:", err);
        // Rollback state smoothly if network pipe breaks
        product.isFeatured = !product.isFeatured;
        this.cd.detectChanges();
      }
    });
  }
}
