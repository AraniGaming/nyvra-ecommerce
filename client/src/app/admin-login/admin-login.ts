import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './admin-login.html',
  styleUrls: [
    '../auth-page.css',
    './admin-login.css'
  ]
})

export class AdminLoginComponent {

  email = '';

  password = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {

    const data = {
      email: this.email,
      password: this.password
    };

    this.authService
      .login(data)
      .subscribe({

        next: (res: any) => {

          this.authService.saveToken(res.token);

          alert('Login Successful');

          this.router.navigate(['/admin']);

        },

        error: (err) => {

          console.log(err);

          alert('Invalid Credentials');

        }

      });

  }

}
