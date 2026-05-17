import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 👈 Added ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  RouterModule
} from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { API_BASE_URL } from '../services/api-url';

@Component({
  selector: 'app-smart-finder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './smart-finder.html',
  styleUrls: ['./smart-finder.css']
})
export class SmartFinderComponent implements OnInit {
  readonly budgetMin = 15000;
  readonly budgetMax = 250000;
  readonly budgetStep = 5000;

  currentStep = 1;
  loading = false;
  showAdvanced = false;
  matches: any[] = [];
  
  private searchStreams = new Subject<void>();

  archetypes = [
    { id: 'gamer', title: 'Competitive Gamer', icon: '🎮', desc: 'High frame rates, liquid cooling priorities, and raw CPU processing threads.', color: '#ff3b30' },
    { id: 'creator', title: 'Content Creator', icon: '📸', desc: 'Professional optics, brilliant studio color reproduction screens, and mass storage.', color: '#007aff' },
    { id: 'professional', title: 'Enterprise Business', icon: '💼', desc: 'Uncompromised multi-day battery parameters and secure network encryption.', color: '#34c759' },
    { id: 'power_user', title: 'Raw Power Enthusiast', icon: '⚡', desc: 'Maximum concurrent processing parameters and speed metrics.', color: '#a855f7' },
    { id: 'budget_smart', title: 'Boutique Efficiency', icon: '💰', desc: 'Highest hardware performance variables returning optimal monetary value loops.', color: '#ffcc00' }
  ];

  sliderConfigs = [
    { key: 'performance', label: 'Computing Smoothness & UI Speed' },
    { key: 'camera', label: 'Optical Resolution & Camera Array' },
    { key: 'battery', label: 'Battery Capacity & Longevity' },
    { key: 'gaming', label: 'Graphics Processing & Gaming Power' },
    { key: 'design', label: 'Materials Aesthetics & Industrial Design' }
  ];

  formState: any = {
    usage: 'gamer',
    weights: { performance: 70, camera: 50, battery: 70, gaming: 80, design: 60, display: 70, value: 50 },
    advanced: { ram: '8', storage: '128', processorTier: 'upper-midrange' },
    budget: 90000
  };

  private presets: { [key: string]: any } = {
    gamer: { performance: 90, camera: 30, battery: 70, gaming: 100, design: 50, display: 80, value: 50 },
    creator: { performance: 80, camera: 100, battery: 70, gaming: 40, design: 80, display: 95, value: 50 },
    professional: { performance: 75, camera: 50, battery: 100, gaming: 30, design: 75, display: 70, value: 65 },
    power_user: { performance: 100, camera: 70, battery: 85, gaming: 90, design: 70, display: 90, value: 50 },
    budget_smart: { performance: 65, camera: 50, battery: 80, gaming: 50, design: 50, display: 60, value: 100 }
  };

  // 🧠 Injected the change detector directly into your pipeline constructor
  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.searchStreams.pipe(
      debounceTime(250)
    ).subscribe(() => {
      this.executeLiveMatchPipeline();
    });

    const usageFromDomain =
      this.route.snapshot.queryParamMap.get('usage');

    if (usageFromDomain && this.presets[usageFromDomain]) {
      this.applyArchetypePreset(usageFromDomain);
      this.currentStep = 3;
      this.onFilterChange();
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
    if (step === 3) {
      this.onFilterChange();
    }
    this.cd.detectChanges(); // 👈 Forces UI to update step components instantly
  }

  selectArchetype(id: string): void {
    this.applyArchetypePreset(id);
    this.goToStep(3);
  }

  applyArchetypePreset(id: string): void {
    this.formState.usage = id;

    if (this.presets[id]) {
      this.formState.weights = {
        ...this.formState.weights,
        ...this.presets[id]
      };
    }
  }

  toggleAdvancedPanel(): void {
    this.showAdvanced = !this.showAdvanced;
    this.cd.detectChanges(); // Forces accordion rendering smoothly
  }

  onFilterChange(): void {
    this.loading = true;
    this.cd.detectChanges(); // Forces loader spinner to show immediately on click/drag
    this.searchStreams.next();
  }

  private executeLiveMatchPipeline(): void {
    console.log("📡 Transmitting criteria profile down to data core...");
    
    this.http.post<any[]>(`${API_BASE_URL}/recommendations`, this.formState)
      .subscribe({
        next: (res) => {
          this.matches = res || [];
          this.loading = false;
          
          // 🔥 CRITICAL: Slices right through Zone.js sync lag and forces the viewport render
          this.cd.detectChanges(); 
        },
        error: (err) => {
          console.error("❌ Pipeline error:", err);
          this.loading = false;
          this.cd.detectChanges(); // Turns loader off even if connection breaks
        }
      });
  }

  trackByProduct(index: number, item: any): string {
    return item._id || index;
  }

  getMatchColor(score: number): string {
    if (score >= 88) return '#00d2ff';
    if (score >= 76) return '#34c759';
    if (score >= 64) return '#ffcc00';
    return '#a855f7';
  }

  getMatchRingBackground(score: number): string {
    const normalizedScore =
      Math.max(0, Math.min(100, Number(score || 0)));
    const angle =
      normalizedScore * 3.6;
    const color =
      this.getMatchColor(normalizedScore);

    return `conic-gradient(${color} 0deg ${angle}deg, rgba(255, 255, 255, 0.08) ${angle}deg 360deg)`;
  }

  getMatchRingShadow(score: number): string {
    const colorGlow =
      Number(score || 0) >= 88
        ? 'rgba(0, 210, 255, 0.24)'
        : 'rgba(168, 85, 247, 0.2)';

    return `0 0 0 1px rgba(255, 255, 255, 0.04) inset, 0 0 28px ${colorGlow}`;
  }

  formatBudgetLabel(value: number): string {
    const normalizedValue =
      Number(value || 0);
    const formattedBudget =
      `₹${normalizedValue.toLocaleString('en-IN')}`;

    return normalizedValue >= this.budgetMax
      ? `${formattedBudget}+`
      : formattedBudget;
  }
}
