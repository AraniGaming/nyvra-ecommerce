import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import { API_BASE_URL } from './api-url';

@Injectable({
  providedIn: 'root'
})

export class UserAuthService {

  apiUrl =
    `${API_BASE_URL}/users`;

  constructor(
    private http: HttpClient
  ) {}

  // ✅ LOGIN
  login(data: any) {

    return this.http.post(

      `${this.apiUrl}/login`,

      data

    );

  }

  // ✅ REGISTER
  register(data: any) {

    return this.http.post(

      `${this.apiUrl}/register`,

      data

    );

  }

  verifyRegistration(data: any) {

    return this.http.post(

      `${this.apiUrl}/verify-registration`,

      data

    );

  }

  resendRegistrationCode(email: string) {

    return this.http.post(

      `${this.apiUrl}/resend-registration-code`,

      { email }

    );

  }

  // ✅ TOKEN
  getToken(): string | null {

    return localStorage.getItem('token');

  }

  // ✅ USER
  getUser() {

    const user =
      localStorage.getItem('user');

    return user
      ? JSON.parse(user)
      : null;

  }

  // ✅ LOGOUT
  logout() {

    localStorage.removeItem('token');

    localStorage.removeItem('user');

  }

}
