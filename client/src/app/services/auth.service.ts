import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from './api-url';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private apiUrl =
    `${API_BASE_URL}/auth`;

  private adminTokenKey = 'nyvra_admin_token';

  private adminFreshAccessKey = 'nyvra_admin_fresh_access';

  constructor(private http: HttpClient) {}

  login(data: any) {

    return this.http.post(
      `${this.apiUrl}/login`,
      data
    );

  }

  saveToken(token: string) {

    sessionStorage.setItem(
      this.adminTokenKey,
      token
    );

    sessionStorage.setItem(
      this.adminFreshAccessKey,
      'true'
    );

  }

  getToken() {

    return sessionStorage.getItem(
      this.adminTokenKey
    );

  }

  logout() {

    sessionStorage.removeItem(
      this.adminTokenKey
    );

    sessionStorage.removeItem(
      this.adminFreshAccessKey
    );

  }

  isLoggedIn(): boolean {

    return !!this.getToken();

  }

  consumeFreshAdminAccess(): boolean {

    const hasFreshAccess =
      sessionStorage.getItem(
        this.adminFreshAccessKey
      ) === 'true';

    sessionStorage.removeItem(
      this.adminFreshAccessKey
    );

    return hasFreshAccess;

  }

}
