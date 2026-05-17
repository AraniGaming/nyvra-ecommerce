import { Component, OnInit, AfterViewInit, HostListener, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core'; // 👈 Injected ChangeDetectorRef
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UserAuthService } from '../services/user-auth.service';
import { WishlistService } from '../services/wishlist.service';
import { API_BASE_URL } from '../services/api-url';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    CurrencyPipe
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('heroVideo')
  heroVideo?: ElementRef<HTMLVideoElement>;

  products: any[] = [];
  wishlist: any[] = [];
  loading = true;
  userName = '';
  loggedIn = false;

  // Smartphone-only domain profiles. Keep this aligned with the current inventory.
  categories = [
    {
      name: 'All Smartphones',
      route: '/products',
      queryParams: { category: 'smartphone' },
      caption: 'Browse the complete phone collection',
      glowColor: '#007aff',
      svgPath: 'M12 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3Z M12 18h.01'
    },
    {
      name: 'Performance Phones',
      route: '/smart-finder',
      queryParams: { usage: 'gamer' },
      caption: 'Gaming, silicon, and refresh-rate priority',
      glowColor: '#a855f7',
      svgPath: 'M13 2 3 14h8l-1 8 11-14h-8l1-6Z'
    },
    {
      name: 'Creator Cameras',
      route: '/smart-finder',
      queryParams: { usage: 'creator' },
      caption: 'Camera, display, and storage-led picks',
      glowColor: '#f59e0b',
      svgPath: 'M4 7h3l2-3h6l2 3h3v13H4V7Zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'
    },
    {
      name: 'Value & Daily',
      route: '/smart-finder',
      queryParams: { usage: 'budget_smart' },
      caption: 'Balanced phones without wasteful spend',
      glowColor: '#ec4899',
      svgPath: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6'
    }
  ];

  // Backup data parameters with valid string identifiers for compilation harmony
  fallbackProducts = [
    { _id: 'fallback-1', name: 'iPhone 15 Pro', description: 'Apple flagship smartphone running A17 Pro Bionic engineering.', price: 129999, image: 'https://via.placeholder.com/300', brand: 'Apple' },
    { _id: 'fallback-2', name: 'Samsung Galaxy S24', description: 'Premium Android experience driving next-gen dynamic displays.', price: 109999, image: 'https://via.placeholder.com/300', brand: 'Samsung' },
    { _id: 'fallback-3', name: 'Nothing Phone 2', description: 'Minimal transparent structural layout featuring custom Glyphs.', price: 44999, image: 'https://via.placeholder.com/300', brand: 'Nothing' }
  ];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: UserAuthService,
    private wishlistService: WishlistService,
    private cd: ChangeDetectorRef // 👈 Injected into your app construct loop
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.loggedIn = !!this.authService.getToken();

    if (user && this.loggedIn) {
      this.userName = user.name;
      this.loadWishlist();
    }

    // 📡 CONNECTS DIRECTLY TO THE HIGHER-PRIORITY FEATURED SHOWCASE CORE
    this.http.get<any[]>(`${API_BASE_URL}/products/featured`).subscribe({
      next: (data) => {
        console.log("🏠 Homepage received featured showcase items:", data);
        
        // Automatically groups identical hardware variations into unified display layouts
        const uniqueModels = this.groupHomeVariants(data || []);
        this.products = uniqueModels.slice(0, 6);
        this.loading = false;
        
        // Force view updates and lazy check calculation triggers instantly
        this.cd.detectChanges();
        this.lazyTriggerReveal();
      },
      error: (err) => {
        console.error('Database featured channel connection down. Fallback initiated:', err);
        this.products = this.fallbackProducts;
        this.loading = false;
        
        this.cd.detectChanges();
        this.lazyTriggerReveal();
      }
    });
  }

  ngAfterViewInit(): void {
    this.startHeroVideo();
    this.lazyTriggerReveal();

    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        setTimeout(() => this.scrollToSection(fragment), 120);
        setTimeout(() => this.scrollToSection(fragment), 520);
      }
    });
  }

  scrollToSection(sectionId: string, event?: Event): void {
    event?.preventDefault();

    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    const headerOffset = 96;
    const sectionTop =
      section.getBoundingClientRect().top +
      window.scrollY -
      headerOffset;

    window.scrollTo({
      top: Math.max(sectionTop, 0),
      behavior: 'smooth'
    });

    window.history.replaceState(null, '', `#${sectionId}`);
    this.lazyTriggerReveal();
  }

  startHeroVideo(): void {
    const video = this.heroVideo?.nativeElement;

    if (!video) {
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const tryPlay = () => {
      video.play().catch(() => {
        setTimeout(() => video.play().catch(() => {}), 500);
      });
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener('canplay', tryPlay, { once: true });
      video.load();
    }
  }

  // ✅ LOAD USER WISHLIST DATA
  loadWishlist() {
    this.wishlistService.loadWishlist().subscribe({
      next: (data) => { 
        this.wishlist = data; 
        this.cd.detectChanges();
      },
      error: (err) => { console.error(err); }
    });
  }

  // ✅ SESSION LOGOUT
  logout() {
    this.authService.logout();
    window.location.reload();
  }

  // ❤️ INTERACTIVE WISHLIST LOGIC ENGINE
  toggleWishlist(product: any) {
    if (!this.loggedIn) {
      alert('Please authenticate your active session first.');
      return;
    }

    if (this.isInWishlist(product._id)) {
      this.wishlist = this.wishlist.filter(item => item._id !== product._id);
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

  // ❤️ WISHLIST COMPARISON CHECKMATE
  isInWishlist(id: string): boolean {
    return this.wishlist.some(item => {
      if (item.productId?._id === id) return true;
      if (item._id === id) return true;
      return false;
    });
  }

  // ❤️ TRACKING QUANTITIES
  getWishlistCount(): number {
    return this.wishlist.length;
  }

  // 🛠️ THE DEDUPLICATION FILTER ENGINE
  groupHomeVariants(rawProducts: any[]): any[] {
    const groupedMap: { [key: string]: any } = {};

    rawProducts.forEach(product => {
      const baseName = this.getCleanProductName(product.name);

      if (!groupedMap[baseName]) {
        groupedMap[baseName] = { ...product, name: baseName };
      } else if (product.price < groupedMap[baseName].price) {
        // Enforces that the baseline card always displays the lowest configuration price
        groupedMap[baseName].price = product.price;
        groupedMap[baseName]._id = product._id;
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

  // ✅ SCROLL-DRIVEN VISUAL REVEAL PHYSICS
  lazyTriggerReveal() {
    setTimeout(() => this.executeRevealCalculations(), 150);
  }

  private executeRevealCalculations() {
    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight - 80) {
        el.classList.add('active');
      }
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.executeRevealCalculations();
  }

  // ✅ HIGH-SPEED DOM ELEMENT TRACKER
  trackByProduct(index: number, product: any) {
    return product._id || index;
  }
}
