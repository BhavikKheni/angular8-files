import { Injectable } from '@angular/core';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  constructor(private api: ApiService) { }

  getStatusFilter() {
    return [
      { id: 'placed', name: 'Placed' },
      { id: 'approved', name: 'Approve' },
      { id: 'rejected', name: 'Reject' },
      { id: 'dispatched', name: 'Dispatch' },
      { id: 'delivered', name: 'Deliver' },
      { id: 'cancelled', name: 'Cancel' },
      { id: 'returned', name: 'Return' },
    ];
  }

  getAllOrders(page: Number, size: Number) {
    return this.api.get(`api/admin/orders?page=${page}&size=${size}`);
  }

  getSellers() {
    return this.api.get(`api/admin/sellers`);
  }

  getOrderByFilter(params, body) {
    return this.api.post(`api/admin/orders?page=${params.pageNo}&size=${params.size}`, body);
  }

  changeStatus(body: any, id: any) {
    return this.api.put(`api/admin/order/${id}`, body);
  }

  getOrderDetails(orderId: any) {
    return this.api.get(`api/admin/order/${orderId}`);
  }
  getOrderCount() {
    return this.api.get(`api/admin/order/status-count`);
  }
}
