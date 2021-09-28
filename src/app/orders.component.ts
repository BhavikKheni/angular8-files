import { Component, OnInit, ViewContainerRef, ComponentFactoryResolver, ViewChild, ElementRef, ChangeDetectorRef, ComponentFactory, ComponentRef } from '@angular/core';
import { CdkVirtualScrollViewport, ScrollDispatcher } from '@angular/cdk/scrolling';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import * as moment from 'moment';
import { debounce } from 'lodash';
import swal from 'sweetalert2';
import * as _ from 'underscore';
import { StatusChangeComponent } from './status-change/status-change.component';
import { OrdersService } from './orders.service';
const PAGE_SIZE = 10;
const CURRENT_PAGE = 1;

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  infiniteScrollDistance = 10
  infiniteScrollThrottle = 50
  totalPages: Number;
  number: Number;
  isLoader: boolean = false
  orders: Array<any> = []
  sellers: Array<any> = []
  statusOptions: Array<any> = [];
  paginationSubscription = null;
  isLoadMore: boolean = true
  search_criteria: any = {};
  searchByOrderId: string
  searchByText: string;
  statusCount: any
  isFilterChangedNow: boolean = false;
  isPaginationAPIRunning: boolean = false;
  orderLoader: boolean = false;
  currentValue: any = {
    currentPage: 1
  };
  totalElements: Number;
  statusProgess: Array<string> = ['Placed', 'Approved', 'Dispatched', 'Delivered']
  options: any = {
    locale: { format: 'YYYY-MM-DD' },
    alwaysShowCalendars: false,
  };
  paginator: any = {
    currentPage: CURRENT_PAGE,
    pageSize: PAGE_SIZE
  };
  countStatus = {
    'Placed': 'placed',
    'Approved': 'approved',
    'Dispatched': 'dispatched',
    'Rejected': 'rejected',
    'Delivered': 'delivered',
    'Return': 'returned'
  }
  @ViewChild(CdkVirtualScrollViewport) virtualScroll: CdkVirtualScrollViewport;
  constructor(private _orderService: OrdersService,
    private viewContainerRef: ViewContainerRef,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private scrollDispatcher: ScrollDispatcher) {
    this.onSearchByName = debounce(this.onSearchByName, 1000);
    this.statusOptions = _orderService.getStatusFilter();
  }

  ngOnInit(): void {
    this.orderLoader = true;
    this.isPaginationAPIRunning = false;
    this.getOrder(CURRENT_PAGE);
    this.onSeller();
    this.getOrderCount()
  }

  ngAfterViewInit(): void {
    this.paginationSubscription = this.scrollDispatcher.scrolled().pipe(
      filter(event => {
        return this.virtualScroll.measureScrollOffset('bottom') <= 800
      })
    ).subscribe(event => {
      if (!this.isPaginationAPIRunning && !this.orderLoader && this.isLoadMore) {
        this.currentValue.currentPage = this.currentValue.currentPage + 1;
        this.orderLoader = false;
        this.isPaginationAPIRunning = true;
        if (this.isAnyFilterApplied()) {
          this.isFilterChangedNow = false;
          this.orderLoader = false;
          this.isPaginationAPIRunning = true;
          this.refreshListOnChangeFilter();
        } else {
          this.getOrder(this.currentValue.currentPage);
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.paginationSubscription) {
      this.paginationSubscription.unsubscribe();
    }
  }

  selectedDate(value: any, datepicker?: any) {
    this.search_criteria.startDate = moment(value.start).format('YYYY-MM-DD');
    this.search_criteria.endDate = moment(value.end).format('YYYY-MM-DD');
    this.onChangeFilter()
  }

  onSeller() {
    this._orderService.getSellers().subscribe((response: any) => {
      this.sellers = response
    }, (error) => {
      console.log("Error", error)
    })
  }

  getOrderCount() {
    this._orderService.getOrderCount().subscribe((response: any) => {
      let filter = ["Placed", "Approved", "Dispatched", "Rejected", "Delivered", "Return"]
      let count = response.filter(r => filter.includes(r.status))
      setTimeout(() => {
        let all = [{ status: 'All', count: this.totalElements }]
        this.statusCount = all.concat(count);
      }, 1000)
    }, (error) => {
      console.log("error", error)
    })
  }

  getOrder(pageNumber) {
    this._orderService.getAllOrders(pageNumber, this.paginator.pageSize).subscribe((response: any) => {
      this.isPaginationAPIRunning = false;
      this.orderLoader = false;
      this.updatePaginationBar(response)
    }, (error) => {
      this.isPaginationAPIRunning = false;
      this.orderLoader = false;
    })
  }

  updatePaginationBar(response) {
    this.isFilterChangedNow = false;
    if (response.content?.length) {
      this.isLoadMore = true;
      this.orders = this.orders.concat(response.content)
      this.totalPages = response.totalPages;
      this.number = response.number;
      try {
        this.cdr.detectChanges()
      } catch{

      }
    } else {
      this.isLoadMore = false;
    }
    this.totalElements = response.totalElements;
    this.paginator.currentPage = response.number + 1;
  }

  // This function will call when any filter value change
  onChangeFilter() {
    this.resetEverything();
    this.refreshListOnChangeFilter();
  }

  onFilterStatus(count) {
    this.search_criteria.status = this.countStatus[count.status];
    this.onChangeFilter()
  }

  // Common function to reset pagination
  resetEverything() {
    this.orders = [];
    this.orderLoader = false;
    this.isPaginationAPIRunning = false;
    this.isLoadMore = true;
    this.isFilterChangedNow = false;
    this.paginator = {
      currentPage: CURRENT_PAGE,
      pageSize: PAGE_SIZE
    };
  }

  refreshListOnChangeFilter() {
    if (this.isAnyFilterApplied()) {
      let body = {}

      if (this.search_criteria.sellerId || this.search_criteria.status
        || this.search_criteria.orderId
        || this.search_criteria.startDate || this.search_criteria.endDate) {
        body['filter'] = this.search_criteria
      }

      if (this.searchByText && this.searchByText.length >= 3) {
        body["search"] = {
          text: this.searchByText
        }
      }


      const params = {
        pageNo: this.paginator.currentPage,
        size: this.paginator.pageSize
      }


      this.orderLoader = true;
      this._orderService.getOrderByFilter(params, body).subscribe(response => {
        this.orderLoader = false;
        this.isPaginationAPIRunning = false;
        this.updatePaginationBar(response);
      }, (error) => {
        this.orderLoader = false;
        this.isPaginationAPIRunning = false
      });
    } else { // Reset page value if clear filter
      this.getOrder(CURRENT_PAGE);
    }
  }

  onSearchByName() {
    if (this.searchByText.length >= 3 || this.searchByText.length == 0) {
      if (this.isAnyFilterApplied()) {
        this.onChangeFilter();
      } else {
        this.resetEverything();
        this.getOrder(CURRENT_PAGE)
      }
    }
  }


  // Function will check if any filter applier in the table or not
  isAnyFilterApplied() {
    if ((this.search_criteria.sellerId == undefined || this.search_criteria.sellerId == null) &&
      (this.search_criteria.status == undefined || this.search_criteria.status == null) &&
      (this.search_criteria.orderId == undefined || this.search_criteria.orderId == null) &&
      (this.search_criteria.startDate == undefined || this.search_criteria.startDate == null) &&
      (this.search_criteria.endDate == undefined || this.search_criteria.endDate == null)
    ) {

      if (this.searchByText) {

        if (this.searchByText && this.searchByText.length < 3) {
          this.search_criteria = {};
          return false;
        }
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }


  openStatusChangeDialog(event, status, type, order: any, orderId?: any, isEdit?: string) {
    event.stopPropagation()
    const componentFactory: ComponentFactory<StatusChangeComponent> = this.componentFactoryResolver.resolveComponentFactory(StatusChangeComponent);
    const componentRef: ComponentRef<StatusChangeComponent> = this.viewContainerRef.createComponent(componentFactory);
    setTimeout(() => {
      componentRef.instance.openModal();
      componentRef.instance.record = order;
      componentRef.instance.type = type;
      componentRef.instance.status = status;
      componentRef.instance.orderId = orderId
      componentRef.instance.formName = isEdit
      const sub = componentRef.instance.onCloseModal.subscribe((val: any) => {
        if (val && val.products) {
          let cloneOrders = _.clone(this.orders);
          const index = cloneOrders.findIndex(f => f.id === val.id);
          val.products = cloneOrders[index].products.map(p => {
            if (p.id === val.products[0].id) {
              Object.assign(p, val.products[0]);
            }
            return p;
          })

          cloneOrders[index] = {
            ...val,
          }
          this.orders = cloneOrders
        }
        sub.unsubscribe();
        sub.remove(sub);
        componentRef.destroy();
      });
    }, 300);
  }

  checkStatus(status) {
    let statuses = []
    switch (status) {
      case 'Placed': {
        statuses = [{
          name: 'Approve',
          value: 'approved'
        }, {
          name: 'Reject',
          value: 'rejected'
        }]
        break;
      }
      case 'Approved': {
        statuses = [{
          name: 'Dispatch',
          value: 'dispatched'
        }]
        break;
      }
      case 'Dispatched': {
        statuses = [{
          name: 'Deliver',
          value: 'delivered'
        }]
        break;
      }
      case 'Return': {
        statuses = [{
          name: 'Return Initiate',
          value: 'return_initiated'
        }]
        break;
      }
      case 'Return Initiated': {
        statuses = [{
          name: 'Approve',
          value: 'return_approved'
        }, {
          name: 'Reject',
          value: 'return_rejected'
        }]
        break;
      }
      case 'Return Approved': {
        statuses = [{
          name: 'Return Processing',
          value: 'return_processing'
        }]
        break;
      }
      case 'Return Processing': {
        statuses = [{
          name: 'Return Completed',
          value: 'return_completed'
        }]
        break;
      }
      default: {
        break
      }
    }
    return statuses
  }

  isActive(product, status) {
    return product.comments ? product.comments.map(c => c.orderStatus).includes(status) : false
  }

  isFloat(amount) {
    return parseFloat(amount).toFixed(2)
  }

  getDate(product, status) {
    if (product.comments) {
      let record = product.comments.find(c => c.orderStatus == status)
      const isActive = product.comments.map(c => c.orderStatus).includes(status)

      if (!isActive) {
        if (status === 'Delivered' && product.expectedDelivery) {
          return product.expectedDelivery;
        } else if (status === 'Dispatched' && product.expectedShippedDate) {
          return product.expectedShippedDate;
        }
      } else {
        return record ? record.createdDate : ''
      }
    }
  }

  viewOrder(event, order) {
    event.stopPropagation();
    this.router.navigate([`/orders/detail/${order.id}`])
  }

  isDate(date: string) {
    return moment(date).isValid()
  }
}
