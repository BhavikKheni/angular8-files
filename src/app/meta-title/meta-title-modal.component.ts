import { Component, OnInit, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { ModalConfig } from 'src/app/shared/components/modal/modal.config';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import swal from 'sweetalert2';
import { ProductService } from 'src/app/modules/product/product.service';
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { moveItemInFormArray } from './move-item-form-array';
@Component({
  selector: 'app-change-status',
  templateUrl: 'meta-title-modal.component.html',
  styleUrls: ['meta-title-modal.component.scss']
})
export class MetaTitleModal implements OnInit {

  @ViewChild('modal') private modalComponent: ModalComponent;
  @Output() onCloseModal = new EventEmitter();

  metaTitleForm: FormGroup;
  statusOptions: Array<any> = [];
  brandTags: Array<any> = []
  metaTitles: Array<any> = []
  results: Array<any> = []
  isVisible: boolean = false;
  isDisable: boolean = false
  isSaveLoader = false;
  isLoading: boolean = false
  modalConfig: ModalConfig = {
    modalTitle: "Meta title"
  };

  constructor(public formBuilder: FormBuilder, private _productService: ProductService) {
    this.statusOptions = _productService.getStatusFilter();
  }

  ngOnInit(): void {
    this.makeForm()
    this.getTags()
  }

  makeForm() {
    this.metaTitleForm = this.formBuilder.group({
      status: [this.statusOptions[0].id],
      brandId: [],
      metaTitleFields: this.formBuilder.array([])
    });
  }

  getTags() {
    this._productService.getTags('brand').subscribe(res => {
      this.brandTags = res
      this.metaTitleForm.get('brandId').patchValue(res[0].id)
      this.getMetaTitle(res[0].id)

    }, (error) => {
      console.log("Error", error)
    })
  }

  get title(): FormArray {
    return this.metaTitleForm.get('metaTitleFields') as FormArray;
  }

  newComponent(item?: any): FormGroup {
    return this.formBuilder.group({
      fieldName: item?.fieldName ? item?.fieldName : null,
      fieldNameStr: item?.fieldNameStr ? item.fieldNameStr : null,
      limit: item?.limit ? item.limit : null,
      priority: item?.priority ? item.priority : null,
      selected: item?.selected ? item?.selected : null,
      fieldType: item?.fieldType ? item.fieldType : null
    })
  }

  addMetaTitle(item: any) {
    this.title.push(this.newComponent(item));
  }

  onChange(event) {
    let frmArray = this.metaTitleForm.get('metaTitleFields') as FormArray;
    frmArray.clear();
    this.getMetaTitle(event.id)
  }

  getMetaTitle(id: string) {
    this.isLoading = true
    this._productService.getMetaTitle(this.metaTitleForm.value.status, id).subscribe(response => {
      this.metaTitles = response
      this.isLoading = false
      for (let i = 0; i < response?.length; i++) {
        this.addMetaTitle(response[i])
      }

    }, (error) => {
      this.isLoading = false
      console.log("error", error)
    })
  }

  deleteTitle(index) {
    this.title.removeAt(index);
    const array: any = this.metaTitleForm.get('metaTitleFields') as FormArray
    array.controls.forEach((val, i) => {
      if (index <= i && val) {
        array.controls[i].controls.priority.setValue(i + 1);
      }
    });
    this.isVisible = true;
    const metaFields = this.metaTitleForm.value.metaTitleFields
    if (metaFields.length == 0) {
      this.isDisable = true
    }
  }

  changeOrder(direction, currentIndex) {
    const array = this.metaTitleForm.get('metaTitleFields') as FormArray
    if (direction == 'up' && currentIndex > 0) {
      const metaTitles = this.metaTitleForm.get('metaTitleFields') as FormArray
      const temp = metaTitles.controls[currentIndex - 1].value;
      metaTitles.controls[currentIndex - 1].setValue(metaTitles.controls[currentIndex].value);
      metaTitles.controls[currentIndex].setValue(temp);
      let val: any = metaTitles.controls[currentIndex]
      let val2: any = metaTitles.controls[currentIndex - 1]
      val.controls.priority.setValue(currentIndex + 1)
      val2.controls.priority.setValue(currentIndex)
    } else if (direction == 'down' && currentIndex < array.controls.length - 1) {
      const metaTitles = this.metaTitleForm.get('metaTitleFields') as FormArray
      const temp = metaTitles.controls[currentIndex + 1].value
      metaTitles.controls[currentIndex + 1].setValue(metaTitles.controls[currentIndex].value);
      metaTitles.controls[currentIndex].setValue(temp);
      let val: any = metaTitles.controls[currentIndex]
      let val2: any = metaTitles.controls[currentIndex + 1]
      val.controls.priority.setValue(currentIndex + 1)
      val2.controls.priority.setValue(currentIndex + 2)
    }
  }

  onAdd() {
    const allMetaTitles = JSON.parse(JSON.stringify(this.metaTitles))
    const value = JSON.parse(JSON.stringify(this.metaTitleForm.value.metaTitleFields))
    const filterByReference = (arr1, arr2) => {
      let res = [];
      res = arr1.filter(el => {
        return !arr2.find(element => {
          return element.fieldNameStr === el.fieldNameStr;
        });
      });
      return res;
    }
    const results = filterByReference(allMetaTitles, value);
    this.results = results.sort((a, b) => (a.priority > b.priority) ? 1 : -1)
    if (results.length) {
      this.addMetaTitle(results[0])
    }
    const metaFields = this.metaTitleForm.value.metaTitleFields
    if (allMetaTitles.length == metaFields.length) {
      this.isVisible = false;
    }
    if (metaFields.length > 0) {
      this.isDisable = false
    }
  }

  drop(event: CdkDragDrop<any>) {
    moveItemInFormArray(
      this.title,
      event.previousIndex,
      event.currentIndex
    );
    const array: any = this.metaTitleForm.get('metaTitleFields') as FormArray
    array.controls.forEach((val, i) => {
      if (event.currentIndex < event.previousIndex) {
        if (event.currentIndex <= i && event.previousIndex >= i) {
          array.controls[i].controls.priority.setValue(i + 1);
        }
      }
      else {
        if (event.currentIndex >= i && event.previousIndex <= i) {
          array.controls[i].controls.priority.setValue(i + 1);
        }
      }
    });
  }

  async openModal() {
    await this.modalComponent.open('metatitle');
  }

  async closeModal() {
    await this.modalComponent.close();
  }

  modalClosed(event) {
    this.onCloseModal.emit(event);
  }

  saveMetaTitle() {
    const value = this.metaTitleForm.value
    if (value.metaTitleFields.length == 0) {
      this.isDisable = true
      swal('Error', 'Atleast one meta title should be there', 'error')
    } else {
      this.isSaveLoader = true
      this.isDisable = false;
      this._productService.saveMetaTitle(value).subscribe(res => {
        this.isSaveLoader = false
        this.closeModal()
        swal('Success', 'Meta title updated successfully', 'success')
      }, (error) => {
        this.isSaveLoader = false
        this.isDisable = false;
        console.log("Error", error)
        swal('Error', error?.error?.message, 'error')
      })
    }
  }
}
