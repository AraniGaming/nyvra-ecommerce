import {
  ChangeDetectorRef,
  Component,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';

import { UserAuthService } from '../services/user-auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './register.html',
  styleUrls: [
    '../auth-page.css',
    './register.css'
  ]
})

export class RegisterComponent implements OnDestroy {

  user = {

    name: '',

    email: '',

    password: ''

  };

  otpCode = '';

  verificationEmail = '';

  step: 'details' | 'verify' = 'details';

  statusMessage = '';

  errorMessage = '';

  isSubmitting = false;

  isVerifying = false;

  isResending = false;

  resendCountdown = 0;

  private countdownTimer?: number;

  private viewDestroyed = false;

  constructor(
    private authService: UserAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.viewDestroyed = true;
    this.clearCountdown();
  }

  register() {

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.statusMessage = '';
    this.refreshView();

    this.authService
      .register(this.user)
      .subscribe({

        next: (response: any) => {

          this.verificationEmail =
            response.email || this.user.email;

          this.step = 'verify';

          this.statusMessage =
            response.deliveryMode === 'console'
              ? 'Code generated. Check the backend terminal for the development OTP.'
              : `Code sent to ${this.maskEmail(this.verificationEmail)}.`;

          this.startCountdown(
            response.resendAfterSeconds || 60
          );

          this.isSubmitting = false;
          this.refreshView();

        },

        error: (err) => {

          this.errorMessage =
            err?.error?.message || 'Registration failed';

          this.isSubmitting = false;
          this.refreshView();

        }

      });

  }

  verifyCode() {

    if (this.isVerifying) {
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';
    this.statusMessage = '';
    this.refreshView();

    this.authService
      .verifyRegistration({
        email: this.verificationEmail,
        otp: this.otpCode
      })
      .subscribe({

        next: (response: any) => {

          localStorage.setItem(
            'token',
            response.token
          );

          localStorage.setItem(
            'user',
            JSON.stringify({
              name: response.name,
              email: response.email
            })
          );

          this.isVerifying = false;
          this.refreshView();

          this.router.navigate(['/']);

        },

        error: (err) => {

          this.errorMessage =
            err?.error?.message || 'Invalid verification code';

          this.isVerifying = false;
          this.refreshView();

        }

      });

  }

  resendCode() {

    if (
      this.isResending ||
      this.resendCountdown > 0
    ) {
      return;
    }

    this.isResending = true;
    this.errorMessage = '';
    this.statusMessage = '';
    this.refreshView();

    this.authService
      .resendRegistrationCode(this.verificationEmail)
      .subscribe({

        next: (response: any) => {

          this.statusMessage =
            response.deliveryMode === 'console'
              ? 'New code generated. Check the backend terminal.'
              : `New code sent to ${this.maskEmail(this.verificationEmail)}.`;

          this.startCountdown(
            response.resendAfterSeconds || 60
          );

          this.isResending = false;
          this.refreshView();

        },

        error: (err) => {

          this.errorMessage =
            err?.error?.message || 'Could not resend code';

          this.resendCountdown =
            err?.error?.resendAfterSeconds || this.resendCountdown;

          if (this.resendCountdown > 0) {
            this.startCountdown(this.resendCountdown);
          }

          this.isResending = false;
          this.refreshView();

        }

      });

  }

  changeEmail() {
    this.step = 'details';
    this.otpCode = '';
    this.statusMessage = '';
    this.errorMessage = '';
    this.clearCountdown();
    this.refreshView();
  }

  maskEmail(email: string): string {
    const [
      userPart = '',
      domain = ''
    ] = String(email).split('@');

    if (!userPart || !domain) {
      return email;
    }

    return `${userPart.slice(0, 1)}***@${domain}`;
  }

  private startCountdown(seconds: number) {
    this.clearCountdown();

    this.resendCountdown =
      Number(seconds || 0);
    this.refreshView();

    this.countdownTimer =
      window.setInterval(() => {

        this.resendCountdown =
          Math.max(0, this.resendCountdown - 1);

        if (this.resendCountdown === 0) {
          this.clearCountdown();
        }

        this.refreshView();

      }, 1000);
  }

  private clearCountdown() {
    if (this.countdownTimer) {
      window.clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }

  private refreshView() {
    if (!this.viewDestroyed) {
      this.cdr.detectChanges();
    }
  }

}
