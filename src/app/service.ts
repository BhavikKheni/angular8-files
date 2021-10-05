import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { MethodUtilityService } from './method-utility.service';
import { ServerVariableService } from './server-variable.service';
import { username, password, API_URL } from './app.constant';
const USERNAME = username;
const PASSWORD = password;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  url: string = API_URL;

  constructor(
    public methodUtils: MethodUtilityService,
    public variableService: ServerVariableService,
    public http: HttpClient,
    public router: Router,
    private toastr: ToastrService
  ) { }

  get(endpoint: string, params?: any, reqOpts?: any) {
    const headers = this.getHeaders();
    return this.http.get(this.url + endpoint, { headers: headers, observe: 'response', params })
      .pipe(
        map(this.extractData),
        catchError(this.handleError)
      );
  }

  getInfo() {
    const headers = this.getHeaders();
    return this.http.get(`${this.url}api/me`, { headers: headers })
  }

  getPDF(endpoint: string, body: any, params?: any) {
    const headers = this.getHeaders();
    return this.http.post(this.url + endpoint, body, { headers: headers, observe: 'response', responseType: 'blob' });
  }

  downloadimage(imagePath: any, params: any) {
    const headers = this.getHeaders();
    return this.http.get(this.url + imagePath, { headers: headers, params: params, observe: 'response', responseType: 'blob' });
  }
  post(endpoint: string, body: any, contentType?: any, params?: any) {
    const headers = this.getHeaders(contentType);
    const api = this.url + endpoint;
    return this.http.post(api, body, { headers: headers, observe: 'response', params })
      .pipe(
        map(this.extractData),
        catchError(this.handleError)
      );
  }

  put(endpoint: string, body: any, params?: any, contentType?: any) {
    const headers = this.getHeaders(contentType);
    return this.http.put(this.url + endpoint, body, { headers: headers, observe: 'response', params })
      .pipe(
        map(this.extractData),
        catchError(this.handleError)
      );
  }
  postMessage(endpoint: string, body: any, contentType?: any, params?: any) {
    const headers = this.getHeaders(contentType);
    const api = this.url + endpoint;
    return this.http.post(api, body, { headers: headers, observe: 'response', params, responseType: 'text' as 'json' })
      .pipe(
        map(res => {
          return res.body;
        }),
        catchError(this.handleError)
      )
  }
  delete(endpoint: string, contentType?: any) {
    const headers = this.getHeaders(contentType);
    const api = this.url + endpoint;
    return this.http.delete(api, { headers: headers, observe: 'response' })
      .pipe(
        map(this.extractData),
        catchError(this.handleError)
      );
  }
  getHeaders(contentType?: any) {

    let headers = new HttpHeaders();
    const token = this.methodUtils.getToken();
    if (!contentType) {
      headers = headers.set('Content-Type', 'application/json')
    }
    if (token) {
      headers = headers.set('Authorization', 'Bearer ' + token);
    } else {
      headers = headers.set('Authorization', 'Basic ' + btoa(unescape(encodeURIComponent(USERNAME + ':' + PASSWORD))));
    }
    return headers;
  }

  extractData = (response: HttpResponse<any>) => {
    return response.body || response.status;
  };

  handleError = (errorResponse: HttpErrorResponse) => {
    console.log(errorResponse);
    if (errorResponse.status === 401) {
      this.goToSessionExpired();
    } else if (errorResponse.status === 0) {
      this.showError('You have not an active internet Connection or Server not Responding')
    } else if (errorResponse.status === 403) {
      this.goToAccessDenied();
    }
    else if (errorResponse?.error?.message == "Camera image is not uploaded") {

    } else {
      this.showError((errorResponse?.error?.error) || errorResponse?.error?.message || errorResponse?.error?.status || "Something went wrong");
    }
    return throwError(errorResponse);
  };

  async showError(message: any) {
    this.toastr.error(message)
  }


  goToSessionExpired() {
    localStorage.clear();
    sessionStorage.clear();
    this.redirectTo('/');
  }

  redirectTo(...route: any): void {
    this.router.navigate(route);
  }

  goToAccessDenied() {
    this.redirectTo(this.variableService.ROUTE_ACCESS_DENIED);
  }

}