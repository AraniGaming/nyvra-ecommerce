import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WishlistService } from '../services/wishlist.service';
import { API_BASE_URL } from '../services/api-url';

type ViewMode = 'comfort' | 'compact' | 'list';
type SortMode = 'popular' | 'priceLow' | 'priceHigh' | 'newest' | 'rating';

interface ProductFilterState {
  searchTerm: string;
  categoryTab: string;
  selectedBrand: string;
  selectedPrice: string;
  priceLimit: number;
  selectedRam: number;
  selectedStorage: number;
  selectedBattery: number;
  selectedProcessorTier: string;
  selectedDisplay: string;
  selectedCamera: number;
  selectedNetwork: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class Products implements OnInit, OnDestroy {
  readonly maxPriceLimit = 250000;

  allProducts: any[] = [];
  products: any[] = [];
  wishlist: any[] = [];
  loading = true;
  filtering = false;

  searchTerm = '';
  searchFocused = false;
  typingSearch = false;
  placeholderIndex = 0;
  filterDrawerOpen = false;

  viewMode: ViewMode = 'comfort';
  sortMode: SortMode = 'popular';
  categoryTab = 'all';
  selectedBrand = 'all';
  selectedPrice = 'all';
  priceLimit = this.maxPriceLimit;
  selectedRam = 0;
  selectedStorage = 0;
  selectedBattery = 0;
  selectedProcessorTier = 'all';
  selectedDisplay = 'all';
  selectedCamera = 0;
  selectedNetwork = 'all';

  readonly placeholderExamples = [
    'Search phones, brands, specs...',
    'Try Samsung 5G AMOLED',
    'Try iPhone 256GB',
    'Try gaming flagship',
    'Try 5000mAh battery'
  ];

  readonly categoryTabs = [
    { id: 'all', label: 'All Phones' },
    { id: 'flagship', label: 'Flagship' },
    { id: 'budget', label: 'Budget' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'camera', label: 'Camera' },
    { id: '5g', label: '5G' },
    { id: 'new', label: 'New Launches' }
  ];

  readonly quickChips = [
    { id: 'all', label: 'All', kind: 'reset' },
    { id: 'apple', label: 'Apple', kind: 'brand', value: 'Apple' },
    { id: 'samsung', label: 'Samsung', kind: 'brand', value: 'Samsung' },
    { id: 'oneplus', label: 'OnePlus', kind: 'brand', value: 'OnePlus' },
    { id: 'under20', label: 'Under ₹20k', kind: 'price', value: 'under20000' },
    { id: '5g', label: '5G', kind: 'network', value: '5g' },
    { id: 'amoled', label: 'AMOLED', kind: 'display', value: 'amoled' },
    { id: '256gb', label: '256GB', kind: 'storage', value: 256 }
  ];

  readonly priceFilters = [
    { id: 'all', label: 'Any Price', subtitle: 'Full range', min: 0, max: Infinity },
    { id: 'under20000', label: 'Under ₹20k', subtitle: 'Budget', min: 0, max: 20000 },
    { id: 'under30000', label: 'Under ₹30k', subtitle: 'Balanced', min: 0, max: 30000 },
    { id: 'under60000', label: 'Under ₹60k', subtitle: 'Upper mid', min: 0, max: 60000 },
    { id: 'premium', label: '₹60k - ₹1L', subtitle: 'Premium', min: 60000, max: 100000 },
    { id: 'flagship', label: '₹1L+', subtitle: 'Flagship', min: 100000, max: Infinity }
  ];

  readonly ramOptions = [0, 4, 6, 8, 12, 16];
  readonly storageOptions = [0, 128, 256, 512, 1024];
  readonly batteryOptions = [
    { value: 0, label: 'Any Battery', icon: '•' },
    { value: 4000, label: '4000+ mAh', icon: '▰' },
    { value: 5000, label: '5000+ mAh', icon: '▰▰' }
  ];
  readonly displayOptions = [
    { id: 'all', label: 'Any Display' },
    { id: 'amoled', label: 'OLED / AMOLED' },
    { id: '120hz', label: '120Hz+' }
  ];
  readonly cameraOptions = [
    { value: 0, label: 'Any Camera' },
    { value: 70, label: '70+ Score' },
    { value: 80, label: '80+ Score' },
    { value: 90, label: '90+ Score' }
  ];
  readonly processorTiers = [
    { id: 'all', label: 'Any Silicon' },
    { id: 'midrange', label: 'Midrange' },
    { id: 'upper-midrange', label: 'Upper Midrange' },
    { id: 'flagship', label: 'Flagship' }
  ];
  readonly networkOptions = [
    { id: 'all', label: 'Any Network' },
    { id: '5g', label: '5G Ready' }
  ];

  openSections: Record<string, boolean> = {
    brand: true,
    price: true,
    hardware: true,
    display: true,
    camera: false,
    processor: false,
    network: false
  };

  private placeholderTimer?: ReturnType<typeof setInterval>;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private filterTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
    this.placeholderTimer = setInterval(() => {
      this.placeholderIndex =
        (this.placeholderIndex + 1) % this.placeholderExamples.length;
      this.cd.detectChanges();
    }, 2200);

    this.http.get<any[]>(`${API_BASE_URL}/products`).subscribe({
      next: (data) => {
        this.allProducts = this.groupProductVariants(data || []);
        this.loading = false;
        this.applyFilters(false);
      },
      error: (err) => {
        console.error('Pipeline failure:', err);
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.placeholderTimer) {
      clearInterval(this.placeholderTimer);
    }
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
    }
  }

  groupProductVariants(rawProducts: any[]): any[] {
    const groupedMap: { [key: string]: any } = {};

    rawProducts.forEach((product) => {
      const baseName = this.getCleanProductName(product.name);

      if (!groupedMap[baseName]) {
        groupedMap[baseName] = {
          ...product,
          name: baseName,
          allVariants: [product]
        };
      } else {
        groupedMap[baseName].allVariants.push(product);

        if (product.price < groupedMap[baseName].price) {
          groupedMap[baseName] = {
            ...groupedMap[baseName],
            ...product,
            name: baseName,
            allVariants: groupedMap[baseName].allVariants
          };
        }
      }
    });

    return Object.values(groupedMap).map((product) =>
      this.decorateProductGroup(product)
    );
  }

  decorateProductGroup(product: any): any {
    const variants = product.allVariants?.length ? product.allVariants : [product];
    const prices = variants.map((variant: any) => Number(variant.price) || 0);
    const ramOptions = this.uniqueNumbers(variants.map((variant: any) => variant.ram));
    const storageOptions = this.uniqueNumbers(variants.map((variant: any) => variant.storage));

    return {
      ...product,
      allVariants: variants,
      variantCount: variants.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      ramOptions,
      storageOptions,
      maxRam: ramOptions.length ? Math.max(...ramOptions) : Number(product.ram) || 0,
      minRam: ramOptions.length ? Math.min(...ramOptions) : Number(product.ram) || 0,
      maxStorage: storageOptions.length ? Math.max(...storageOptions) : Number(product.storage) || 0,
      minStorage: storageOptions.length ? Math.min(...storageOptions) : Number(product.storage) || 0,
      has5G: variants.some((variant: any) => this.variantHas5G(variant)),
      hasAmoled: variants.some((variant: any) => this.variantHasAmoled(variant)),
      scoreAverage: this.getAverageScore(product)
    };
  }

  getCleanProductName(name = ''): string {
    const normalizedName = String(name).replace(/\s+/g, ' ').trim();

    return normalizedName
      .replace(/\s+\d+\s*GB\s*(?:RAM)?\s*\+\s*\d+\s*(?:GB|TB)\s*(?:Storage)?$/i, '')
      .replace(/\s+\d+\s*GB\s*(?:RAM)?\s*\/\s*\d+\s*(?:GB|TB)\s*(?:Storage)?$/i, '')
      .replace(/\s+\d+\s*GB\s*(?:RAM)?$/i, '')
      .trim() || normalizedName;
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.typingSearch = true;

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    this.typingTimer = setTimeout(() => {
      this.typingSearch = false;
      this.cd.detectChanges();
    }, 420);

    this.applyFilters(true);
  }

  applyFilters(animated = true): void {
    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
    }

    this.filtering = animated;
    const delay = animated ? 170 : 0;

    this.filterTimer = setTimeout(() => {
      const state = this.getFilterState();
      const filtered = this.allProducts.filter((product) =>
        this.matchesState(product, state)
      );

      this.products = this.sortProducts(filtered);
      this.filtering = false;
      this.cd.detectChanges();
    }, delay);
  }

  sortProducts(items: any[]): any[] {
    const sorted = [...items];

    switch (this.sortMode) {
      case 'priceLow':
        return sorted.sort((a, b) => a.price - b.price);
      case 'priceHigh':
        return sorted.sort((a, b) => b.price - a.price);
      case 'newest':
        return sorted.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      case 'rating':
        return sorted.sort((a, b) => this.getAverageScore(b) - this.getAverageScore(a));
      default:
        return sorted.sort((a, b) => {
          const featuredDelta = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
          if (featuredDelta !== 0) {
            return featuredDelta;
          }
          return this.getAverageScore(b) - this.getAverageScore(a);
        });
    }
  }

  matchesState(product: any, state: ProductFilterState): boolean {
    if (state.searchTerm && !this.matchesSearch(product, state.searchTerm)) {
      return false;
    }

    if (state.categoryTab !== 'all' && !this.matchesCategory(product, state.categoryTab)) {
      return false;
    }

    if (state.selectedBrand !== 'all' && product.brand !== state.selectedBrand) {
      return false;
    }

    if (!this.matchesPrice(product, state.selectedPrice)) {
      return false;
    }

    if (state.priceLimit < this.maxPriceLimit && product.price > state.priceLimit) {
      return false;
    }

    if (state.selectedRam && product.maxRam < state.selectedRam) {
      return false;
    }

    if (state.selectedStorage && product.maxStorage < state.selectedStorage) {
      return false;
    }

    if (state.selectedBattery && Number(product.battery) < state.selectedBattery) {
      return false;
    }

    if (
      state.selectedProcessorTier !== 'all' &&
      product.processorTier !== state.selectedProcessorTier
    ) {
      return false;
    }

    if (state.selectedDisplay === 'amoled' && !product.hasAmoled) {
      return false;
    }

    if (state.selectedDisplay === '120hz' && Number(product.refreshRate) < 120) {
      return false;
    }

    if (state.selectedCamera && Number(product.cameraScore) < state.selectedCamera) {
      return false;
    }

    if (state.selectedNetwork === '5g' && !product.has5G) {
      return false;
    }

    return true;
  }

  matchesSearch(product: any, query: string): boolean {
    const normalizedQuery = query.toLowerCase().trim();
    const searchableText = [
      product.name,
      product.brand,
      product.category,
      product.description,
      product.processor,
      product.processorTier,
      product.priceSegment,
      product.network,
      product.ram ? `${product.ram}gb ram` : '',
      product.storage ? `${product.storage}gb storage ${this.formatStorage(product.storage)} storage` : '',
      ...(product.ramOptions || []).map((ram: number) => `${ram}gb ram`),
      ...(product.storageOptions || []).map((storage: number) => `${storage}gb storage ${this.formatStorage(storage)} storage`),
      product.battery ? `${product.battery}mah` : '',
      product.has5G ? '5g' : '',
      product.hasAmoled ? 'amoled oled display' : '',
      ...(product.idealFor || [])
    ]
      .join(' ')
      .toLowerCase();

    return normalizedQuery
      .split(/\s+/)
      .every((term) => searchableText.includes(term));
  }

  matchesCategory(product: any, tab: string): boolean {
    switch (tab) {
      case 'flagship':
        return product.processorTier === 'flagship' || product.price >= 80000;
      case 'budget':
        return product.price <= 30000 || product.priceSegment === 'budget';
      case 'gaming':
        return Number(product.gamingScore) >= 80;
      case 'camera':
        return Number(product.cameraScore) >= 80;
      case '5g':
        return product.has5G;
      case 'new':
        return Boolean(product.createdAt);
      default:
        return true;
    }
  }

  matchesPrice(product: any, priceFilterId: string): boolean {
    const filter = this.priceFilters.find((item) => item.id === priceFilterId);
    if (!filter || filter.id === 'all') {
      return true;
    }

    return product.price >= filter.min && product.price <= filter.max;
  }

  getFilterState(): ProductFilterState {
    return {
      searchTerm: this.searchTerm.trim(),
      categoryTab: this.categoryTab,
      selectedBrand: this.selectedBrand,
      selectedPrice: this.selectedPrice,
      priceLimit: this.priceLimit,
      selectedRam: this.selectedRam,
      selectedStorage: this.selectedStorage,
      selectedBattery: this.selectedBattery,
      selectedProcessorTier: this.selectedProcessorTier,
      selectedDisplay: this.selectedDisplay,
      selectedCamera: this.selectedCamera,
      selectedNetwork: this.selectedNetwork
    };
  }

  getFilterCount(key: keyof ProductFilterState, value: string | number): number {
    const state = {
      ...this.getFilterState(),
      [key]: value
    } as ProductFilterState;

    return this.allProducts.filter((product) => this.matchesState(product, state)).length;
  }

  getQuickChipCount(chip: any): number {
    if (chip.kind === 'reset') {
      return this.allProducts.length;
    }

    const state = this.getFilterState();

    if (chip.kind === 'brand') {
      state.selectedBrand = chip.value;
    }
    if (chip.kind === 'price') {
      state.selectedPrice = chip.value;
      state.priceLimit = this.getPriceLimitForPreset(chip.value);
    }
    if (chip.kind === 'network') {
      state.selectedNetwork = chip.value;
    }
    if (chip.kind === 'display') {
      state.selectedDisplay = chip.value;
    }
    if (chip.kind === 'storage') {
      state.selectedStorage = chip.value;
    }

    return this.allProducts.filter((product) => this.matchesState(product, state)).length;
  }

  isQuickChipActive(chip: any): boolean {
    if (chip.kind === 'reset') {
      return this.activeFilterCount === 0;
    }

    if (chip.kind === 'brand') {
      return this.selectedBrand === chip.value;
    }
    if (chip.kind === 'price') {
      return this.selectedPrice === chip.value;
    }
    if (chip.kind === 'network') {
      return this.selectedNetwork === chip.value;
    }
    if (chip.kind === 'display') {
      return this.selectedDisplay === chip.value;
    }
    if (chip.kind === 'storage') {
      return this.selectedStorage === chip.value;
    }

    return false;
  }

  toggleQuickChip(chip: any): void {
    if (chip.kind === 'reset') {
      this.clearAllFilters();
      return;
    }

    if (chip.kind === 'brand') {
      this.selectedBrand = this.selectedBrand === chip.value ? 'all' : chip.value;
    }
    if (chip.kind === 'price') {
      if (this.selectedPrice === chip.value) {
        this.clearPriceFilter();
      } else {
        this.applyPricePreset(chip.value);
      }
    }
    if (chip.kind === 'network') {
      this.selectedNetwork = this.selectedNetwork === chip.value ? 'all' : chip.value;
    }
    if (chip.kind === 'display') {
      this.selectedDisplay = this.selectedDisplay === chip.value ? 'all' : chip.value;
    }
    if (chip.kind === 'storage') {
      this.selectedStorage = this.selectedStorage === chip.value ? 0 : chip.value;
    }

    this.applyFilters(true);
  }

  setCategoryTab(id: string): void {
    this.categoryTab = id;
    this.applyFilters(true);
  }

  setSortMode(mode: SortMode): void {
    this.sortMode = mode;
    this.applyFilters(true);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  setPriceFilter(id: string): void {
    this.applyPricePreset(id);
    this.applyFilters(true);
  }

  setRam(value: number): void {
    this.selectedRam = value;
    this.applyFilters(true);
  }

  setStorage(value: number): void {
    this.selectedStorage = value;
    this.applyFilters(true);
  }

  setBattery(value: number): void {
    this.selectedBattery = value;
    this.applyFilters(true);
  }

  setDisplay(value: string): void {
    this.selectedDisplay = value;
    this.applyFilters(true);
  }

  setCamera(value: number): void {
    this.selectedCamera = value;
    this.applyFilters(true);
  }

  setProcessorTier(value: string): void {
    this.selectedProcessorTier = value;
    this.applyFilters(true);
  }

  setNetwork(value: string): void {
    this.selectedNetwork = value;
    this.applyFilters(true);
  }

  setBrand(value: string): void {
    this.selectedBrand = value;
    this.applyFilters(true);
  }

  onPriceLimitChange(value: number | string): void {
    this.priceLimit = Number(value);
    this.selectedPrice = 'all';
    this.applyFilters(true);
  }

  toggleSection(section: string): void {
    this.openSections[section] = !this.openSections[section];
  }

  isSectionOpen(section: string): boolean {
    return Boolean(this.openSections[section]);
  }

  openFilters(): void {
    this.filterDrawerOpen = true;
  }

  closeFilters(): void {
    this.filterDrawerOpen = false;
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.categoryTab = 'all';
    this.selectedBrand = 'all';
    this.selectedPrice = 'all';
    this.priceLimit = this.maxPriceLimit;
    this.selectedRam = 0;
    this.selectedStorage = 0;
    this.selectedBattery = 0;
    this.selectedProcessorTier = 'all';
    this.selectedDisplay = 'all';
    this.selectedCamera = 0;
    this.selectedNetwork = 'all';
    this.applyFilters(true);
  }

  removeFilter(key: string): void {
    if (key === 'search') {
      this.searchTerm = '';
    }
    if (key === 'tab') {
      this.categoryTab = 'all';
    }
    if (key === 'brand') {
      this.selectedBrand = 'all';
    }
    if (key === 'price') {
      this.clearPriceFilter();
    }
    if (key === 'priceLimit') {
      this.priceLimit = this.maxPriceLimit;
    }
    if (key === 'ram') {
      this.selectedRam = 0;
    }
    if (key === 'storage') {
      this.selectedStorage = 0;
    }
    if (key === 'battery') {
      this.selectedBattery = 0;
    }
    if (key === 'processor') {
      this.selectedProcessorTier = 'all';
    }
    if (key === 'display') {
      this.selectedDisplay = 'all';
    }
    if (key === 'camera') {
      this.selectedCamera = 0;
    }
    if (key === 'network') {
      this.selectedNetwork = 'all';
    }

    this.applyFilters(true);
  }

  selectSuggestion(suggestion: any): void {
    if (suggestion.type === 'brand') {
      this.selectedBrand = suggestion.title;
      this.searchTerm = '';
    } else {
      this.searchTerm = suggestion.title;
    }

    this.searchFocused = false;
    this.applyFilters(true);
  }

  getSearchSuggestions(): any[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const brandSuggestions = this.getBrandOptions()
      .filter((brand) => brand.toLowerCase().includes(query))
      .map((brand) => {
        const phones = this.allProducts.filter((product) => product.brand === brand);
        return {
          type: 'brand',
          title: brand,
          subtitle: `${phones.length} phones available`,
          meta: `Popular: ${phones.slice(0, 3).map((item) => item.name).join(', ')}`
        };
      });

    const productSuggestions = this.allProducts
      .filter((product) => this.matchesSearch(product, query))
      .slice(0, 5)
      .map((product) => ({
        type: 'product',
        title: product.name,
        subtitle: `${product.brand} · From ${this.formatPrice(product.price)}`,
        meta: `${this.getStorageRangeLabel(product)} storage · ${product.maxRam || product.ram}GB RAM`
      }));

    return [...brandSuggestions, ...productSuggestions].slice(0, 6);
  }

  get activeFilters(): { key: string; label: string }[] {
    const filters: { key: string; label: string }[] = [];

    if (this.searchTerm.trim()) {
      filters.push({ key: 'search', label: `Search "${this.searchTerm.trim()}"` });
    }
    if (this.categoryTab !== 'all') {
      filters.push({
        key: 'tab',
        label: this.categoryTabs.find((tab) => tab.id === this.categoryTab)?.label || this.categoryTab
      });
    }
    if (this.selectedBrand !== 'all') {
      filters.push({ key: 'brand', label: this.selectedBrand });
    }
    if (this.selectedPrice !== 'all') {
      filters.push({
        key: 'price',
        label: this.priceFilters.find((item) => item.id === this.selectedPrice)?.label || this.selectedPrice
      });
    }
    if (this.selectedPrice === 'all' && this.priceLimit < this.maxPriceLimit) {
      filters.push({ key: 'priceLimit', label: `Up to ${this.formatPriceCap()}` });
    }
    if (this.selectedRam) {
      filters.push({ key: 'ram', label: `${this.selectedRam}GB+ RAM` });
    }
    if (this.selectedStorage) {
      filters.push({ key: 'storage', label: `${this.formatStorage(this.selectedStorage)}+` });
    }
    if (this.selectedBattery) {
      filters.push({ key: 'battery', label: `${this.selectedBattery}+ mAh` });
    }
    if (this.selectedProcessorTier !== 'all') {
      filters.push({
        key: 'processor',
        label: this.processorTiers.find((item) => item.id === this.selectedProcessorTier)?.label || this.selectedProcessorTier
      });
    }
    if (this.selectedDisplay !== 'all') {
      filters.push({
        key: 'display',
        label: this.displayOptions.find((item) => item.id === this.selectedDisplay)?.label || this.selectedDisplay
      });
    }
    if (this.selectedCamera) {
      filters.push({ key: 'camera', label: `Camera ${this.selectedCamera}+` });
    }
    if (this.selectedNetwork !== 'all') {
      filters.push({ key: 'network', label: '5G' });
    }

    return filters;
  }

  get activeFilterCount(): number {
    return this.activeFilters.length;
  }

  get activeFilterSummary(): string {
    return this.activeFilters.map((filter) => filter.label).join(' × ');
  }

  getBrandOptions(): string[] {
    return Array.from(new Set(this.allProducts.map((product) => product.brand).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
  }

  getResultsTitle(): string {
    const count = this.products.length;
    const label = count === 1 ? 'phone' : 'phones';

    if (this.searchTerm.trim()) {
      return `${count} ${label} found for "${this.searchTerm.trim()}"`;
    }

    return `${count} ${label} found`;
  }

  getProductSubtitle(product: any): string {
    return [
      product.processor,
      product.battery ? `${product.battery}mAh` : '',
      this.getStorageRangeLabel(product),
      product.has5G ? '5G' : ''
    ].filter(Boolean).join(' · ');
  }

  getSpecBadges(product: any): string[] {
    const badges: string[] = [];

    if (product.has5G) {
      badges.push('5G');
    }
    if (product.hasAmoled) {
      badges.push('OLED');
    }
    if (Number(product.refreshRate) >= 120) {
      badges.push('120Hz');
    }
    if (product.maxStorage) {
      badges.push(this.getStorageRangeLabel(product));
    }
    if (Number(product.cameraScore) >= 80) {
      badges.push(`Camera ${product.cameraScore}`);
    }
    if (Number(product.gamingScore) >= 80) {
      badges.push('Gaming');
    }

    return badges.slice(0, 5);
  }

  getStorageRangeLabel(product: any): string {
    const min = Number(product.minStorage || product.storage || 0);
    const max = Number(product.maxStorage || product.storage || 0);

    if (!min && !max) {
      return 'Storage';
    }

    if (min === max) {
      return this.formatStorage(max);
    }

    return `${this.formatStorage(min)}-${this.formatStorage(max)}`;
  }

  getVariantCountLabel(product: any): string {
    const count = Number(product.variantCount || 1);
    return `${count} ${count === 1 ? 'configuration' : 'configurations'}`;
  }

  getPriceProgress(): number {
    return Math.min(100, Math.max(0, (this.priceLimit / this.maxPriceLimit) * 100));
  }

  isPriceFilterActive(id: string): boolean {
    if (id === 'all') {
      return this.selectedPrice === 'all' && this.priceLimit >= this.maxPriceLimit;
    }

    return this.selectedPrice === id;
  }

  private applyPricePreset(id: string): void {
    this.selectedPrice = id;
    this.priceLimit = this.getPriceLimitForPreset(id);
  }

  private clearPriceFilter(): void {
    this.selectedPrice = 'all';
    this.priceLimit = this.maxPriceLimit;
  }

  private getPriceLimitForPreset(id: string): number {
    const filter = this.priceFilters.find((item) => item.id === id);

    if (!filter || filter.id === 'all' || !Number.isFinite(filter.max)) {
      return this.maxPriceLimit;
    }

    return Number(filter.max);
  }

  getPriceSliderBackground(): string {
    const progress = this.getPriceProgress();
    return `linear-gradient(90deg, #5bd6ff 0%, #8b5cf6 ${progress}%, rgba(255,255,255,0.12) ${progress}%, rgba(255,255,255,0.12) 100%)`;
  }

  formatPriceCap(): string {
    if (this.priceLimit >= this.maxPriceLimit) {
      return '₹2,50,000+';
    }

    return this.formatPrice(this.priceLimit);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  formatStorage(value: number): string {
    const normalized = Number(value);
    if (normalized >= 1024) {
      const tb = normalized / 1024;
      return `${Number.isInteger(tb) ? tb : tb.toFixed(1)}TB`;
    }

    return `${normalized}GB`;
  }

  highlightMatch(value: string | number): string {
    const text = this.escapeHtml(String(value ?? ''));
    const query = this.searchTerm.trim();

    if (!query) {
      return text;
    }

    const terms = query
      .split(/\s+/)
      .map((term) => this.escapeRegExp(this.escapeHtml(term)))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    if (!terms.length) {
      return text;
    }

    const pattern = terms.join('|');
    return text.replace(new RegExp(`(${pattern})`, 'ig'), '<mark>$1</mark>');
  }

  loadWishlist(): void {
    this.wishlistService.loadWishlist().subscribe({
      next: (data) => {
        this.wishlist = data;
        this.cd.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  toggleWishlist(product: any): void {
    if (!localStorage.getItem('token')) {
      alert('Please authenticate your session first.');
      return;
    }

    if (this.isInWishlist(product._id)) {
      this.wishlist = this.wishlist.filter((item) => {
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
    return this.wishlist.some((item) => item.productId?._id === id || item._id === id);
  }

  getWishlistCount(): number {
    return this.wishlist.length;
  }

  trackByProduct(_: number, product: any): string {
    return product._id;
  }

  private getAverageScore(product: any): number {
    const scores = [
      product.performanceScore,
      product.cameraScore,
      product.batteryScore,
      product.displayScore,
      product.gamingScore,
      product.valueScore
    ]
      .map((score) => Number(score))
      .filter((score) => !Number.isNaN(score) && score > 0);

    if (!scores.length) {
      return 0;
    }

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private uniqueNumbers(values: any[]): number[] {
    return Array.from(new Set(values.map((value) => Number(value)).filter((value) => value > 0)))
      .sort((a, b) => a - b);
  }

  private variantHas5G(variant: any): boolean {
    if (String(variant.network || '').toLowerCase().includes('5g')) {
      return true;
    }

    const text = [
      variant.name,
      variant.description,
      variant.processor,
      variant.category,
      ...(variant.idealFor || [])
    ].join(' ').toLowerCase();

    return text.includes('5g');
  }

  private variantHasAmoled(variant: any): boolean {
    const text = [
      variant.name,
      variant.description,
      variant.processor,
      variant.category
    ].join(' ').toLowerCase();

    return /amoled|oled|super retina|xdr/.test(text) || Number(variant.displayScore) >= 85;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return map[char];
    });
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
