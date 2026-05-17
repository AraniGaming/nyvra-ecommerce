import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';

import { UserAuthService } from '../services/user-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrls: [
    '../auth-page.css',
    './login.css'
  ]
})

export class LoginComponent {

  email = '';

  password = '';

  constructor(
    private authService: UserAuthService,
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

  next: (data: any) => {

    localStorage.setItem(
      'token',
      data.token
    );

localStorage.setItem(
  'user',
  JSON.stringify({
    name: data.name,
    email: data.email
  })
);

    alert('Login Successful');

    this.router.navigate(['/']);

  },

  error: (err) => {

    alert('Invalid credentials');

  }

});
  }

}
