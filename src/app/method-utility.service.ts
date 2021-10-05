import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class MethodUtilityService {

  constructor(
    public location: Location
  ) { }


  isAuthenticated() {
    return sessionStorage.getItem('isAuthenticate') ? sessionStorage.getItem('isAuthenticate') : null;
  }

  getToken(): any {
    return sessionStorage.getItem('access_token') ? sessionStorage.getItem('access_token') : null;
  }

  gotoBackPage() {
    this.location.back();
  }

  isNullUndefinedOrBlank(obj: any): boolean {
    if (obj == null || obj === undefined || (obj === '' && obj !== 0)) {
      return true;
    }
    return false;
  }

  isEmptyObjectOrNullUndefiend(...value: any): boolean {
    if (value && value.length > 0) {
      for (let i = 0; i < value.length; i++) {
        if (this.isNullUndefinedOrBlank(value[i]) || this.isEmptyObject(value[i])) {
          return true;
        }
      }
    }
    return false;
  }

  isEmptyObject(obj: any): boolean {
    return (obj && (Object.keys(obj).length === 0));
  }
}