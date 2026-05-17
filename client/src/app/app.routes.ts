import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { Products } from './products/products';
import { ProductDetail } from './product-detail/product-detail';
import { AdminComponent } from './admin/admin';
import { ProductFormComponent } from './admin/product-form.component';
import { AdminLoginComponent } from './admin-login/admin-login';
import { authGuard } from './auth.guard';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';
import { WishlistComponent } from './wishlist/wishlist';
// Import the new Smart Finder feature component
import { SmartFinderComponent } from './smart-finder/smart-finder'; 

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'products',
    component: Products
  },
  {
    path: 'products/:id',
    component: ProductDetail
  },
  {
    path: 'smart-finder',
    component: SmartFinderComponent
  },
  {
    path: 'wishlist',
    component: WishlistComponent
  },
  {
    path: 'admin-login',
    component: AdminLoginComponent
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin/add-product',
    component: ProductFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin/edit-product/:id',
    component: ProductFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  }, 
];
