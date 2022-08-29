import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ViewChild, OnDestroy, ComponentFactoryResolver, ViewContainerRef, ChangeDetectorRef, ComponentFactory, ComponentRef } from '@angular/core';
import { CdkVirtualScrollViewport, ScrollDispatcher } from '@angular/cdk/scrolling';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { debounce } from 'lodash';
import * as _ from 'underscore';
import swal from 'sweetalert2';
import { Tag } from 'src/app/models/tag';
import { Product } from 'src/app/models/product';
import { TagService } from 'src/app/modules/tags/tag.service';
import { TagUpdateModalComponent } from './tag-update-modal';
import { ProductEditModalComponent } from './product-edit-modal/product-edit-modal.component';
import { ProductService } from '../../product.service';
import { ImageModalComponent } from '../../../../shared/components/show-image-in-modal/image-modal.component';


declare let $: any;

const PAGE_SIZE = 10;
const CURRENT_PAGE = 1;

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() paginator: any;
  @Input() tags: any = {};
  @Output() onChangePagination = new EventEmitter();
  @Output() onChangeCheckboxSelection = new EventEmitter();
  @Output() updateTotalNumber = new EventEmitter();
  @ViewChild(CdkVirtualScrollViewport) virtualScroll: CdkVirtualScrollViewport;
  carehomeQuestions = [{
    answer: "yes",
    dataType: "Boolean",
    id: 387420489713793,
    options: ["no", "yes"],
    question: "Would you be surprised if resident dies in next 12 months?",
    sequence: "1",
    subQuestions: []
  }, {
    answer: "yes",
    dataType: "Boolean",
    id: 162261469141379,
    options: ["no", "yes"],
    question: "EPaCCs completed?",
    sequence: "3",
    subQuestions: [{
      dataType: "Checkbox",
      id: 549681958855172,
      parentQuestionId: 162261469141379,
      question: "Days to live",
      sequence: "3.1",
    },
    {
      dataType: "Checkbox",
      id: 549681958855172,
      parentQuestionId: 162261469141379,
      question: "Month to live",
      sequence: "3.2",
      answer: "yes"
    },
    {
      dataType: "Checkbox",
      id: 549681958855172,
      parentQuestionId: 162261469141379,
      question: "Weeks to live",
      sequence: "3.3",
    }]
  }]
  products: Product[] = [];
  statusOptions: Array<any> = [];
  searchByText: string;
  isMasterSel: boolean = false;
  productLoader: boolean = false;
  showImageModalData: {}
  search_criteria: any = {
    brand: '',
    category: '',
    room: '',
    status: ''
  };
  tagsList: any;
  isFilterChangedNow: boolean = false;

  currentValue: any = {
    currentPage: 1
  };

  pageSize = PAGE_SIZE;
  isPaginationAPIRunning: boolean = false;

  paginationSubscription = null;
  isLoadMore: boolean = true;

  variantStatus: Array<{ id: string; name: string }> = [
    { id: 'active', name: 'Active' },
    { id: 'disabled', name: 'Disabled' },
    // { id: 'private', name: 'Private' },
  ];
  status;

  constructor(private _productService: ProductService,
    private _tagService: TagService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
    private scrollDispatcher: ScrollDispatcher) {
    this.onSearchByName = debounce(this.onSearchByName, 1000);
    this.statusOptions = _productService.getStatusFilter();
  }

  ngOnInit() {
    // this.getTagList();
    this.productLoader = true;
    this.isPaginationAPIRunning = false;
    this.setFilters();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.paginationSubscription = this.scrollDispatcher.scrolled().pipe(
        filter(event => {
          return this.virtualScroll.measureScrollOffset('bottom') <= 800
        })
      ).subscribe(event => {
        if (!this.isPaginationAPIRunning && !this.productLoader && this.isLoadMore) {
          this.currentValue.currentPage = this.currentValue.currentPage + 1;
          this.productLoader = false;
          this.isPaginationAPIRunning = true;
          if (this.isAnyFilterApplied()) {
            this.isFilterChangedNow = false;
            this.productLoader = false;
            this.isPaginationAPIRunning = true;
            this.refreshListOnChangeFilter();
          } else {
            this.getProducts(this.currentValue.currentPage);
          }
        }
      });
    }, 1000);
  }

  openModal(event, product) {
    event.stopPropagation()
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ImageModalComponent);
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    setTimeout(() => {
      componentRef.instance.openModal();
      componentRef.instance.product = product
    });
  }

  ngOnDestroy() {
    if (this.paginationSubscription) {
      this.paginationSubscription.unsubscribe();
    }
  }

  setFilters() {
    const filters = this._productService.getFilters();
    if (filters) {
      this.search_criteria.brand = filters.filter?.brand || null;
      this.search_criteria.category = filters.filter?.category || null;
      this.search_criteria.room = filters.filter?.room || null;
      this.search_criteria.status = filters.filter?.status || null;
      this.searchByText = filters.search?.name || '';
    }
    this.onChangeFilter();
  }

  getTagList() {
    this._tagService.getTagList().subscribe((response: Array<Tag>) => {
      response.forEach(tag => {
        if (tag.status.toLowerCase() != "disabled") {
          if (this.tags[tag.type]) {
            this.tags[tag.type].push(tag);
          } else {
            this.tags[tag.type] = [tag];
          }
          if (this.tagsList) {
            this.tagsList[tag.tagID] = tag;
          } else this.tagsList = {};
        }
      });
    });
  }

  // Fetch the products
  getProducts(pageNumber) {
    this._productService.getProducts(pageNumber, this.paginator.pageSize).subscribe((productsResponse: any) => {
      this.isPaginationAPIRunning = false;
      this.productLoader = false;
      this.updatePaginationBar(productsResponse);
    }, (error) => {
      this.isPaginationAPIRunning = false;
      this.productLoader = false;
    });
  }

  // Update the pagination bar once API response successfully received
  updatePaginationBar(productsResponse: any) {
    this.isMasterSel = false;
    this.isFilterChangedNow = false;


    if (productsResponse.content?.length) {
      this.isLoadMore = true;
      let products = this.getBrandCategoryRoomValue(productsResponse);
      products.forEach((product) => {
        product["expanded"] = false;
        product["isChecked"] = false;
      });

      // uncheck all checkbox when page change
      // this.uncheckAll();

      this.products = this.isFilterChangedNow ? [...products] : [...this.products, ...products];
      try {
        this.cdr.detectChanges();
      } catch {

      }
    } else {
      this.isLoadMore = false;
    }

    this.updateTotalNumber.emit(productsResponse.totalElements);
    this.paginator.currentPage = productsResponse.number + 2;
    // Scroll to nearest bottom if scroll reached to bottom of table
    // setTimeout(() => {
    //   // const items: any = document.getElementsByClassName("list-item");
    //   // if (this.virtualScroll.measureScrollOffset('bottom') === 0) {

    //   // }
    // }, 10);
  }

  // Modified the API response
  getBrandCategoryRoomValue(productsResponse: any) {
    let products: any = productsResponse.content;
    products.forEach((product) => {
      product["modified_brands"] = [];
      product["modified_category"] = [];
      product["modified_room"] = [];

      if (product.tags && product.tags.length) {
        product.tags.forEach((tag) => {
          if (tag.type.toLowerCase() == "brand") {
            product["modified_brands"].push(tag);
          } else if (tag.type.toLowerCase() == "category") {
            product["modified_category"].push(tag);
          } else if (tag.type.toLowerCase() == "room") {
            product["modified_room"].push(tag);
          }
        });
      }

      // Sort variant tags array by tag type
      if (product.variants && product.variants.length) {
        // this.modifiVariantTags(product.variants);
        // console.log("varrr:", this.modifiVariantTags(product))
        // product.variants.forEach((variant) => {
        //   if (variant && variant.tags && variant.tags.length) {
        //     variant.tags = this.sortByTagType(variant.tags);
        //   }
        // })

        product.variants.forEach((variant) => {
          variant["modified_style"] = [];
          variant["modified_filter"] = [];
          variant["modified_material"] = [];
          variant["modified_colour"] = [];

          if (variant.tags && variant.tags.length) {
            variant.tags.forEach((tag) => {
              if (tag.type.toLowerCase() == "style") {
                variant["modified_style"].push(tag);
              } else if (tag.type.toLowerCase() == "filter") {
                variant["modified_filter"].push(tag);
              } else if (tag.type.toLowerCase() == "material") {
                variant["modified_material"].push(tag);
              } else if (tag.type.toLowerCase() == "colour") {
                variant["modified_colour"].push(tag);
              }
            });
          }
        });
      }
    });
    return products;
  }

  // Modified the API response
  modifiVariantTags(variants: any) {
    // let variants: any = JSON.parse(JSON.stringify(variantsResponse.variants));
    variants.forEach((product) => {
      product["modified_style"] = [];
      product["modified_filter"] = [];
      product["modified_material"] = [];
      product["modified_colour"] = [];

      if (product.tags && product.tags.length) {
        product.tags.forEach((tag) => {
          if (tag.type.toLowerCase() == "style") {
            product["modified_style"].push(tag);
          } else if (tag.type.toLowerCase() == "filter") {
            product["modified_filter"].push(tag);
          } else if (tag.type.toLowerCase() == "material") {
            product["modified_material"].push(tag);
          } else if (tag.type.toLowerCase() == "colour") {
            product["modified_colour"].push(tag);
          }
        });
      }

      // Sort variant tags array by tag type
      // if (product.variants && product.variants.length) {
      //   product.variants.forEach((variant) => {
      //     if (variant && variant.tags && variant.tags.length) {
      //       variant.tags = this.sortByTagType(variant.tags);
      //     }
      //   })
      // }
    });
    return variants;
  }

  // This function will call when any filter value change
  onChangeFilter() {
    this.resetEverything();
    this.refreshListOnChangeFilter();
  }

  // Common function to reset pagination
  resetEverything() {
    this.products = [];
    this.productLoader = true;
    this.isPaginationAPIRunning = false;
    this.isLoadMore = true;
    this.isFilterChangedNow = true;
    this.paginator = {
      currentPage: CURRENT_PAGE,
      pageSize: PAGE_SIZE
    };
  }

  // Function will call when any filter value changes
  refreshListOnChangeFilter() {

    if (this.isAnyFilterApplied()) {
      let body = {
        filter: this.search_criteria
      }

      if (this.searchByText && this.searchByText.length >= 3) {
        body["search"] = {
          name: this.searchByText
        }
      }

      const params = {
        pageNo: this.paginator.currentPage,
        size: this.paginator.pageSize
      }

      this._productService.setFilters(body);

      this._productService.getProductsByFilter(params, body).subscribe(productsResponse => {
        this.productLoader = false;
        this.isPaginationAPIRunning = false;
        this.updatePaginationBar(productsResponse);
      }, (error) => {
        this.productLoader = false;
        this.isPaginationAPIRunning = false
      });
    } else { // Reset page value if clear filter
      this.getProducts(CURRENT_PAGE);
    }
  }

  onSearchByName() {
    if (this.searchByText.length >= 3 || this.searchByText.length == 0) {
      if (this.isAnyFilterApplied()) {
        this.onChangeFilter();
      } else {
        this.resetEverything();
        this.getProducts(CURRENT_PAGE);
      }
    }
  }

  copyCode(e: any, variant) {
    e.stopPropagation();
    e.preventDefault();
    const el = document.createElement('textarea');
    el.value = variant.id;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert("Copied the text");
  }

  compare(a, b) {
    const bandA = a.type.toLowerCase();
    const bandB = b.type.toLowerCase();

    let comparison = 0;
    if (bandA > bandB) {
      comparison = 1;
    } else if (bandA < bandB) {
      comparison = -1;
    }
    return comparison;
  }

  sortByTagType(tags: Array<any>) {
    return tags.sort(this.compare);
  }

  // Function will check if any filter applier in the table or not
  isAnyFilterApplied() {
    if ((this.search_criteria.brand == undefined || this.search_criteria.brand == null) &&
      (this.search_criteria.category == undefined || this.search_criteria.category == null) &&
      (this.search_criteria.status == undefined || this.search_criteria.status == null) &&
      (this.search_criteria.room == undefined || this.search_criteria.room == null)) {

      if (this.searchByText) {
        if (this.searchByText.length < 3) {
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

  // Show and hide row
  toggle(e: any, selectedProduct: any) {
    e.stopPropagation();
    e.preventDefault();
    this.products.forEach((product: any) => {
      if (product.id == selectedProduct.id) {
        product.expanded = !product.expanded;
      } else {
        product.expanded = false
      }
    });
  }

  // For checkbox
  checkUncheckAll(e?: any) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.products.forEach((item: any) => {
      item.isChecked = this.isMasterSel;
    });
    this.onCheckboxValueChanged();
  }

  onCheckboxValueChanged() {
    this.onChangeCheckboxSelection.emit(this.products);
  }

  checkBoxStopPropogation(e) {
    if (e) {
      e.stopPropagation();
    }
  }

  // Uncheck all checkbox
  // This function will call from list component
  uncheckAll() {
    this.isMasterSel = false;
    this.checkUncheckAll();
  }


  goToProductInfo(productId) {
    this.router.navigate([`products/${productId}/product-info`]);
  }

  goToVariantInfo(productId, variantId) {
    this.router.navigate([`products/${productId}/variant-info`], { queryParams: { variantId: variantId } });
  }

  _onClickSelectionBox(e: any) {
    e.stopPropagation();
    e.preventDefault();
  }

  onChangeStatusValue(product, variant) {
    this._productService.updateVariantById(product.id, variant.id, variant).subscribe(response => {
      swal("Success", 'Variant info has been updated successfully', "success");
    }, (error) => {
      console.log("Error", error);
      swal("Error", error.error)
    });
  }

  openTagUpdateModal(e, product) {
    e.stopPropagation();
    e.preventDefault();
    const componentFactory: ComponentFactory<TagUpdateModalComponent> = this.componentFactoryResolver.resolveComponentFactory(TagUpdateModalComponent);
    const componentRef: ComponentRef<TagUpdateModalComponent> = this.viewContainerRef.createComponent(componentFactory);
    setTimeout(() => {
      componentRef.instance.openModal();
      componentRef.instance.productId = product.id;
      componentRef.instance.product = product;
      componentRef.instance.initDialog();
      const sub = componentRef.instance.onCloseModal.subscribe((tags: any) => {
        if (tags) {
          product.tags = tags.tags;
          product["modified_brands"] = [];
          product["modified_category"] = [];
          product["modified_room"] = [];
          tags.tags.forEach((tag) => {
            if (tag.type.toLowerCase() == "brand") {
              product["modified_brands"].push(tag);
            } else if (tag.type.toLowerCase() == "category") {
              product["modified_category"].push(tag);
            } else if (tag.type.toLowerCase() == "room") {
              product["modified_room"].push(tag);
            }
          });
        }
        sub.unsubscribe();
        sub.remove(sub);
        componentRef.destroy();
      });
    });
  }

  openEditDialog(e, product, index) {
    e.stopPropagation();
    e.preventDefault();
    const componentFactory: ComponentFactory<ProductEditModalComponent> = this.componentFactoryResolver.resolveComponentFactory(ProductEditModalComponent);
    const componentRef: ComponentRef<ProductEditModalComponent> = this.viewContainerRef.createComponent(componentFactory);
    setTimeout(() => {
      componentRef.instance.openModal();
      componentRef.instance.product = _.clone(product);
      const sub = componentRef.instance.onCloseModal.subscribe((val) => {
        if (val) {
          let cloneProducts = _.clone(this.products);
          cloneProducts[index] = {
            ...product,
            name: val.details.name,
            tradePrice: val.details.tradePrice,
            status: val.details.status,
            featuredNumber: val.details.featuredNumber,
            summary: val.details.summary,
            description: val.details.description,
            freightCost: val.details.freightCost,
            deliveryCost: val.details.deliveryCost,
            markUp: val.details.markUp,
            deliveryNote: val.details.deliveryNote,
            currency: val.details.currency,
            promotionalDiscount: val.details.promotionalDiscount,
            vatTax: val.details.vatTax
          }
          this.products = cloneProducts;
          try {
            this.cdr.detectChanges();
          } catch {

          }
        }
        sub.unsubscribe();
        sub.remove(sub);
        componentRef.destroy();
      });
    });
  }
  // create main array and subquestion array with update both array
  renderForm() {
    this.homeCareForm = this.formBuilder.group({
      formArray: this.formBuilder.array([]),
    });
    carehomeQuestions?.forEach((record) => {
      const mfg = this.formBuilder.group({
        id: [record.id],
        dataType: [record.dataType],
        answer: [record.answer],
        question: [record.question],
        options: [record.options],
        subQuestions: this.formBuilder.array([])
      });
      this.subQuestion(record, mfg);
      (<FormArray>this.homeCareForm.controls.formArray).push(mfg);
    });
  }
  //create subquestion array and add data in subquestion
  subQuestion(rec, mfg: FormGroup) {
    const subQuestions = mfg.get('subQuestions') as FormArray;
    rec.subQuestions?.forEach((record) => {
      const fg = this.formBuilder.group({
        id: [record.id],
        dataType: [record.dataType],
        answer: [record.answer],
        question: [record.question],
        options: [record.options]
      })
      subQuestions.push(fg);
    });
  }
}
