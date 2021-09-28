import { Component, OnInit, Input, ViewChild, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import swal from 'sweetalert2';
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { ModalConfig } from 'src/app/shared/components/modal/modal.config';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { ProductService } from 'src/app/modules/product/product.service';
import { moveItemInFormArray } from "./move-item-in-form-array";
@Component({
  selector: 'app-seo-title-update-modal',
  templateUrl: './update-seo-title.component.html',
  styleUrls: ['update-seo-title.scss']
})
export class SeoTitleUpdateModalComponent implements OnInit {
  @ViewChild("multiSelect") multiSelect;
  @ViewChild('modal') private modalComponent: ModalComponent;
  @Output() onCloseModal = new EventEmitter();
  @Input() variant: any;
  modalConfig: ModalConfig = {
    modalTitle: 'Update The Seo title',
  };
  seoTitleComposerForm: FormGroup;
  isRequired: boolean = false;
  isSaveLoader: boolean = false;
  isLoading: boolean = false;
  productName: string = '';
  selectTagCompond: any = {}
  colours: Array<any> = []
  materials: Array<any> = []
  categories: Array<any> = []
  styleTagKeyword: Array<any> = []
  styles: Array<any> = []
  filters: Array<any> = []
  filterTagKeyword: Array<any> = []
  metaTitleFields: Array<any> = []
  categoriesItems: Array<any> = []
  options: Array<string> = []
  itemDictionary: any = {}
  brandId: string = ""
  metaTitleFieldsValues: any
  subscription = null
  isLoader: boolean = false
  productIdMetaTitle: string = ""
  variantIdMetaTitle: string = ""
  chooseOption: string;
  tags: Array<any> = []
  settings: any = {}
  seoTitleComposer: string = '';
  metaTitleComposer: string = '';
  seoDescription: string = ''
  brandName: string = '';
  variantName: string = '';
  materialId: string = "";
  colorId: string = ""
  errorMessage: string = "";
  isAddButtonShow: boolean = false;
  submitted: boolean = false
  isEdit: boolean = false;
  isDisable: boolean = true;
  constructor(private _productService: ProductService,
    public formBuilder: FormBuilder) { }

  ngOnInit() {
    this.seoTitleComposerForm = this.formBuilder.group({
      productName: { value: null, disabled: true },
      brandName: { value: null, disabled: true },
      variantName: { value: null, disabled: true },
      metaTitle: [],
      seoTitle: [],
      seoDescription: [],
      tagId: [],
      filterId: [],
      categoryId: [],
      colourId: [],
      materialId: [],
      componentArray: this.formBuilder.array([]),
      metaTitleArray: this.formBuilder.array([])
    })

    if (this.variant && this.variant.id) {
      this.renderForm()
    }
  }

  async openModal() {
    await this.modalComponent.open('update-seo');
  }

  async closeModal() {
    await this.modalComponent.close();
  }

  modalClosed(event) {
    this.onCloseModal.emit(event);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  renderForm() {
    this.settings = {
      singleSelection: true,
      enableCheckAll: false,
      idField: 'componentId',
      textField: 'componentName',
      //selectAllText: "Select All",
      allowSearchFilter: false,
      limitSelection: -1,
      clearSearchFilter: true,
      noDataAvailablePlaceholderText: "No data found",
      closeDropDownOnSelection: false,
      showSelectedItemsAtTop: false,
      defaultOpen: false
    }


    this._productService.getMetaTitleFields().subscribe(response => {
      this.metaTitleFields = response
    }, (error) => { })

    this.isLoader = true
    this.subscription = this._productService.getMetaTitleComposer(this.variant.product.id, this.variant.id).subscribe(response => {
      this.isLoader = false
      this.metaTitleFieldsValues = response.metaTitleFieldsValues
      this.tags = response.tags
      this.productIdMetaTitle = response.productId
      this.variantIdMetaTitle = response.variantId
    }, (error) => {
      this.isLoader = false
      console.log("Error", error)
    })

    this.isLoading = true
    this._productService.getVariantSeoTitleComposer(this.variant.id).subscribe(response => {
      this.isLoading = false;
      this.brandId = response.brandId
      this.productName = response.productName.replace(/ .*/, '')
      this.brandName = response.brandName;
      this.variantName = response.variantName
      const styleTagKeyword = []
      const styles = []
      const colours = []
      const materials = []
      const categories = []
      const filterTagKeyword = []
      const categoriesItems = []
      const filters = []
      response.tags.forEach(element => {
        if (element.tag.type == "style") {
          styles.push(element)
          if (element.tag?.keywordList) {
            styleTagKeyword.push(...element.tag?.keywordList)
          }
        }
        else if (element.tag.type == "colour") {
          colours.push(element.tag)
        }
        else if (element.tag.type == "category") {
          categories.push(element)
          categoriesItems.push(element.tag)
        } else if (element.tag.type == "material") {
          materials.push(element.tag)
        } else if (element.tag.type == 'filter') {
          filters.push(element)
          if (element.tag?.keywordList) {
            filterTagKeyword.push(...element.tag?.keywordList)
          }
        }
      });
      this.colours = colours;
      this.materials = materials;
      this.categories = categories;
      this.styles = styles;
      this.filters = filters
      this.categoriesItems = categoriesItems
      this.styleTagKeyword = styleTagKeyword;
      this.filterTagKeyword = filterTagKeyword

      if (response) {
        this.variantForm()
        this.generateSeoTitle()
        this.generateMetaTitle()
      }
    }, (error) => {
      console.log("Error", error)
    })

  }

  onRefresh() {
    const control = <FormArray>this.seoTitleComposerForm.controls['metaTitleArray'];
    for (let i = control.length - 1; i >= 0; i--) {
      control.removeAt(i)
    }
    const componentArray = <FormArray>this.seoTitleComposerForm.controls['componentArray'];
    for (let i = componentArray.length - 1; i >= 0; i--) {
      componentArray.removeAt(i)
    }
    this.renderForm()
  }

  onChangeCategory(event) {
    if (event) {
      const selectedCat = this.categories.filter(f => f.tag.name === event);
      if (selectedCat) {
        this.isAddButtonShow = true;
        this.selectTagCompond = selectedCat[0]
        for (let i = 0; i <= selectedCat[0]?.components.length; i++) {
          this.onAddCategoryComponent(selectedCat[0]?.components[i])
        }
      } else {
        this.isAddButtonShow = false
      }
    } else {
      this.selectTagCompond = [];
      const componentArray = (<FormArray>this.seoTitleComposerForm.controls.componentArray);
      while (componentArray.length) {
        componentArray.removeAt(0)
      }
      this.isAddButtonShow = false
    }
    this.generateSeoTitle()
  }

  generateSeoTitle() {
    this.seoTitleComposer = ""
    const values = this.seoTitleComposerForm.getRawValue();
    if (values.categoryId) {
      this.seoTitleComposer += (values.productName || "") + (" " + (values.tagId ? values.tagId : "")) + (values.filterId ? " " + values.filterId : "");
      if (values.categoryId || (values.colourId || values.materialId)) {
        this.seoTitleComposer += " " + (values.categoryId || "") + (values.colourId || values.materialId ? " with" : '') + (values.colourId ? " " + values.colourId : "") + (values.materialId ? " " + values.materialId : "") + ((!values.colourId || !values.materialId) || (values.colourId && values.materialId) || (values.colourId && !values.materialId) || (!values.colourId && values.materialId) ? " " : "")
        this.seoTitleComposerForm.patchValue({ seoTitle: this.seoTitleComposer })
      }
      let componentArray = this.seoTitleComposerForm.value.componentArray;

      if (componentArray.length) {
        let componets = ""
        componentArray.forEach((val, index) => {
          if (val.categoryName && (val.materialName || val.colourName)) {
            componets += (index ? " " : "") + "and" + " " + (val.categoryName[0]?.componentName || "") + " in " + (val.colourName || "") + ((val.materialName && val.colourName) ? " " : "") + (val.materialName || "")
          }
        })
        this.seoTitleComposer += componets
        this.seoTitleComposerForm.patchValue({ seoTitle: this.seoTitleComposer })
      }
    } else {
      this.seoTitleComposer += (values.productName || "") + (" " + (values.tagId ? values.tagId : "")) + (values.filterId ? " " + values.filterId : "");
      this.seoTitleComposerForm.patchValue({ seoTitle: this.seoTitleComposer })
    }
    this.isDisable = false
  }

  renderName(item) {
    let componets = "";
    let cat;
    let colour;
    let material;
    let moodclip;
    let style;
    if (item.fieldNameStr == "Brand") {
      componets += item.disabledField + " "
    } else if (item.fieldNameStr == "Product Name") {
      componets += item.disabledField + " "
    } else if (item.fieldNameStr == "Variant Name") {
      componets += item.disabledField + " "
    } else if (item.fieldNameStr == "Other") {
      componets += item.fieldValue ? item.fieldValue + " " : "" + " "
    } else if (item.fieldNameStr == 'Category') {
      if (item.fieldValueId) {
        cat = this.categoriesItems.find(f => f.id == item.fieldValueId)
        componets += cat.name + " "
      }
    } else if (item.fieldNameStr == 'Colour') {
      if (item.fieldValueId) {
        colour = this.colours.find(c => c.id == item.fieldValueId)
        componets += colour.name + " "
      }
    } else if (item.fieldNameStr == 'Material') {
      if (item.fieldValueId) {
        material = this.materials.find(c => c.id == item.fieldValueId)
        componets += material.name + " "
      }
    } else if (item.fieldNameStr == 'Moodclip Keyword') {
      if (item.fieldValueId) {
        moodclip = this.filterTagKeyword.find(c => c.id == item.fieldValueId)
        componets += moodclip.name + " "
      }
    } else if (item.fieldNameStr == 'Style Keyword') {
      if (item.fieldValueId) {
        style = this.styleTagKeyword.find(c => c.id == item.fieldValueId)
        componets += style.name + " "

      }
    }
    return componets
  }

  generateMetaTitle() {
    const value = this.seoTitleComposerForm.getRawValue()
    this.metaTitleComposer = ""
    let componets = "";
    value.metaTitleArray.forEach((f, index) => {
      componets += this.renderName(f)
      // componets += f.value ? " " + f.value : ""
    });
    this.metaTitleComposer += componets
    this.seoTitleComposerForm.patchValue({ metaTitle: this.metaTitleComposer })
  }

  onAdd(event) {
    const value = this.seoTitleComposerForm.getRawValue()
    const dummyItem = {
      fieldName: 'Other',
      fieldNameStr: 'Other',
      limit: 15,
      fieldValue: "",
      priority: value.metaTitleArray.length + 1,
      selected: true,
      fieldType: 'other'
    }
    if (event == 'Other') {
      this.metaTitleComponent.push(this.newComponent(dummyItem));
    } else {
      let found = value.metaTitleArray.some(ele => ele.fieldNameStr === event);
      if (!found) {
        let filterRecord = this.metaTitleFieldsValues.find(f => f.fieldNameStr == event)
        if (filterRecord == undefined) {
          switch (event) {
            case 'Brand':
              let brnd = this.metaTitleFields.find(f => f.fieldNameStr == 'Brand')
              brnd['fieldValueId'] = this.brandId
              brnd['priority'] = value.metaTitleArray.length + 1
              this.metaTitleComponent.push(this.newComponent(brnd));
              break;
            case 'Product Name':
              let pro = this.metaTitleFields.find(f => f.fieldNameStr == 'Product Name')
              pro['fieldValueId'] = this.productIdMetaTitle
              pro['priority'] = value.metaTitleArray.length + 1
              this.metaTitleComponent.push(this.newComponent(pro));
              break;
            case 'Variant Name':
              let vrnt = this.metaTitleFields.find(f => f.fieldNameStr == 'Variant Name')
              vrnt['fieldValueId'] = this.variantIdMetaTitle
              vrnt['priority'] = value.metaTitleArray.length + 1
              this.metaTitleComponent.push(this.newComponent(vrnt));
              break;
            case 'Category':
              let f = this.metaTitleFields.find(f => f.fieldNameStr == 'Category')
              let cat = this.tags.filter(f => f.type == 'category')
              f['fieldValueId'] = cat && cat.length ? cat[0].id : ""
              f['priority'] = value.metaTitleArray.length + 1
              this.assignArrays(f.fieldNameStr)
              this.metaTitleComponent.push(this.newComponent(f));
              break;
            case 'Colour':
              let c = this.metaTitleFields.find(f => f.fieldNameStr == 'Colour')
              let colour = this.tags.filter(f => f.type == 'colour')
              c['fieldValueId'] = colour && colour.length ? colour[0].id : ""
              c['priority'] = value.metaTitleArray.length + 1
              this.assignArrays(c.fieldNameStr)
              this.metaTitleComponent.push(this.newComponent(c));
              break;
            case 'Material':
              let m = this.metaTitleFields.find(f => f.fieldNameStr == 'Material')
              let mat = this.tags.filter(f => f.type == 'material')
              m['fieldValueId'] = mat && mat.length ? mat[0].id : ""
              m['priority'] = value.metaTitleArray.length + 1
              this.assignArrays(m.fieldNameStr)
              this.metaTitleComponent.push(this.newComponent(m));
              break;
            case 'Style Keyword':
              let s = this.metaTitleFields.find(f => f.fieldNameStr == 'Style Keyword')
              let sty = this.tags.filter(f => f.type == 'style')
              s['fieldValueId'] = sty && sty.length ? sty[0].id : ""
              s['priority'] = value.metaTitleArray.length + 1
              this.assignArrays(s.fieldNameStr)
              this.metaTitleComponent.push(this.newComponent(s));
              break;
            case 'Moodclip Keyword':
              let moodclip = this.metaTitleFields.find(f => f.fieldNameStr == 'Moodclip Keyword')
              let fil = this.tags.filter(f => f.type == 'filter')
              moodclip['fieldValueId'] = fil && fil.length ? fil[0].id : ""
              fil['priority'] = value.metaTitleArray.length + 1
              this.assignArrays(moodclip.fieldNameStr)
              this.metaTitleComponent.push(this.newComponent(moodclip));
              break;
          }
        } else {
          filterRecord['priority'] = value.metaTitleArray.length + 1
          this.metaTitleComponent.push(this.newComponent(filterRecord));
        }
      } else {
        swal("Info", `Field is already there`, "info");
      }
    }
    this.isDisable = false;
    this.generateMetaTitle()
  }

  deleteTitle(index, name: string) {
    this.metaTitleComponent.removeAt(index);
    const array: any = this.seoTitleComposerForm.get('metaTitleArray') as FormArray
    array.controls.forEach((val, i) => {
      if (index <= i && val) {
        array.controls[i].controls.priority.setValue(i + 1);
      }
    });
    this.isDisable = false;
    this.generateMetaTitle()
  }

  variantForm() {
    let materialName;
    if (this.categories.length && this.categories[0].mainMaterialId) {
      materialName = this.materials?.filter(f => f.id == this.categories[0].mainMaterialId);
    }
    let colourName;
    if (this.categories.length && this.categories[0].mainColourId) {
      colourName = this.colours?.filter(f => f.id == this.categories[0].mainColourId);
    }
    let styleKeyword = this.styles?.find(f => f.keyword);
    let filterKeyword = this.filters?.find(f => f.keyword);
    const tagId = this.styles?.length && styleKeyword?.keyword ? styleKeyword.keyword : this.styleTagKeyword.length ? this.styleTagKeyword[0].name : ""
    const filterId = this.filters?.length && filterKeyword?.keyword ? filterKeyword.keyword : this.filterTagKeyword.length ? this.filterTagKeyword[0].name : ""
    const categoryId = this.categories ? this.categories[0]?.tag.name : null;
    this.materialId = materialName?.length ? materialName[0].name : null
    this.colorId = colourName?.length ? colourName[0].name : null
    if (categoryId) {
      this.isAddButtonShow = true;
      this.selectTagCompond = this.categories[0]
    }
    this.seoTitleComposerForm.patchValue({
      productName: this.productName,
      brandName: this.brandName,
      variantName: this.variantName,
      seoTitle: [this.seoTitleComposer],
      metaTitle: [this.metaTitleComposer],
      seoDescription: this.variant.seoDescription,
      tagId: tagId,
      filterId: filterId,
      categoryId: categoryId,
      colourId: this.colorId,
      materialId: this.materialId
    })
    // const metaObject = {
    //   "brandName": {
    //     name: "Brand Name",
    //     value: this.brandName
    //   },
    //   "productName": {
    //     name: "Product Name",
    //     value: this.productName
    //   },
    //   "categoryId": {
    //     name: "Category Name",
    //     value: categoryId
    //   },
    //   "colourId": {
    //     name: "Colour Name",
    //     value: this.colours.length ? this.colours[0].name : null
    //   },
    //   "materialId": {
    //     name: "Material Name",
    //     value: this.materials.length ? this.materials[0].name : null,
    //   },
    //   "tagId": {
    //     name: "Style Tag Keyword",
    //     value: tagId,
    //   },
    //   "filterId": {
    //     name: "Moodclip",
    //     value: filterId,
    //   },
    //   "variantName": {
    //     name: "Variant Name",
    //     value: this.variantName
    //   }
    // }

    // this.addMetaTitleComponent(metaObject)
    if (this.metaTitleFieldsValues?.length) {
      this.addMetaTitleComponent()
    }

    if (this.selectTagCompond?.components) {
      for (let i = 0; i <= this.selectTagCompond?.components.length; i++) {
        this.onAddCategoryComponent(this.selectTagCompond?.components[i])
      }
    }
  }

  get metaTitleComponent(): FormArray {
    return this.seoTitleComposerForm.get('metaTitleArray') as FormArray;
  }

  assignArrays(key) {
    switch (key) {

      case 'Category':
        this.itemDictionary[key] = this.categoriesItems
        break;

      case 'Colour':
        this.itemDictionary[key] = this.colours
        break;
      case 'Material':
        this.itemDictionary[key] = this.materials
        break;
      case 'Style Keyword':
        this.itemDictionary[key] = this.styleTagKeyword
        break;
      case 'Moodclip Keyword':
        this.itemDictionary[key] = this.filterTagKeyword
        break;
    }
  }

  newComponent(item?: any): FormGroup {
    let catId;
    let colourId;
    let materialId;
    let moodclipId;
    let styleId;

    if (item.fieldNameStr == 'Category') {
      catId = this.categoriesItems.find(f => f.id == item.fieldValueId)
    } else if (item.fieldNameStr == 'Colour') {
      colourId = this.colours.find(c => c.id == item.fieldValueId)
    } else if (item.fieldNameStr == 'Material') {
      materialId = this.materials.find(c => c.id == item.fieldValueId)
    } else if (item.fieldNameStr == 'Moodclip Keyword') {
      moodclipId = this.filterTagKeyword.find(c => c.id == item.fieldValueId)
    } else if (item.fieldNameStr == 'Style Keyword') {
      styleId = this.styleTagKeyword.find(c => c.id == item.fieldValueId)
    }

    let dictionary = {
      "Brand": this.brandId,
      "Product Name": this.productIdMetaTitle,
      "Variant Name": this.variantIdMetaTitle,
      "Category": catId ? catId.id : this.categoriesItems ? this.categoriesItems[0].id : "",
      "Material": materialId ? materialId.id : this.materials.length ? this.materials[0].id : "",
      "Colour": colourId ? colourId.id : this.colours.length ? this.colours[0].id : "",
      "Moodclip Keyword": moodclipId ? moodclipId.id : this.filterTagKeyword.length ? this.filterTagKeyword[0].id : "",
      "Style Keyword": styleId ? styleId.id : this.styleTagKeyword ? this.styleTagKeyword[0].id : ""
    }

    let dictionary1 = {
      "Brand": this.brandName,
      "Product Name": this.productName,
      "Variant Name": this.variantName,
    }

    const fg = this.formBuilder.group({
      fieldName: item.fieldName,
      disabledField: [{ value: dictionary1[item?.fieldNameStr] || item?.fieldName, disabled: ['Product Name', 'Brand', 'Variant Name'].indexOf(item.fieldNameStr) >= 0 }],
      fieldNameStr: item?.fieldNameStr || null,
      limit: item.limit || null,
      priority: item?.priority || null,
      selected: item?.selected || null,
      fieldType: item.fieldType || null,
      fieldValueId: dictionary[item?.fieldNameStr],
      fieldValue: item.fieldValue || null,
      itemsKey: [item?.fieldName]
    });
    return fg;
  }

  addMetaTitleComponent() {
    this.metaTitleFieldsValues?.forEach((item: any) => {
      this.assignArrays(item.fieldNameStr)
      this.metaTitleComponent.push(this.newComponent(item));
    })
    const opt = this.metaTitleFields.map(f => f.fieldNameStr)
    this.options = opt.concat("Other")
    // Object.values(metaObject).forEach((f: any) => {
    //   this.metaTitleComponent.push(
    //     this.formBuilder.group(
    //       {
    //         name: f.name,
    //         value: [{ value: f.value, disabled: ['Product Name', 'Brand Name', 'Variant Name'].indexOf(f.name) >= 0 }]
    //       }
    //     ))
    // })
  }

  drop(event: CdkDragDrop<any>) {
    moveItemInFormArray(
      this.metaTitleComponent,
      event.previousIndex,
      event.currentIndex
    );
    const array: any = this.seoTitleComposerForm.get('metaTitleArray') as FormArray
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
    this.isDisable = false;
    this.generateMetaTitle()
  }

  getControlsForOption1() {
    return (<FormArray>this.seoTitleComposerForm.controls.componentArray).controls;
  }

  components = []
  onAddCategoryComponent(component?: any) {
    if (component) {
      this.components.push(component.componentId)
    }
    const componentArray = (<FormArray>this.seoTitleComposerForm.controls.componentArray);
    if (componentArray.length < this.selectTagCompond?.components?.length) {
      componentArray.push(this.formBuilder.group({
        categoryName: [component ? [{ componentName: component?.componentName, componentId: component?.componentId }] : []],
        colourName: [this.colorId ? null : component?.colourName],
        materialName: [this.materialId ? null : component?.materialName]
      }));
    }
  }

  onChangeCategoryComponent(event: any, fg: FormGroup) {
    const record = this.selectTagCompond?.components.filter(f => f.componentName == event.target.value)
    fg.get('colourName').setValue(record[0].colourName)
    fg.get('materialName').setValue(record[0].materialName)
    this.generateSeoTitle();
  }

  onItemSelect(event, control: FormGroup) {
    if (event) {
      let componentArray = (<FormArray>this.seoTitleComposerForm.controls.componentArray).value as Array<any>;
      componentArray = componentArray.map(c => c.categoryName[0]);
      const items = componentArray.filter(c => c && (c.componentId == event.componentId));
      if (items.length > 1) {
        control.get('categoryName').setErrors({ repeated: true })
      }
      else {
        const record = this.selectTagCompond?.components.find(f => f.componentName == event.componentName);
        if (record) {
          control.get('colourName').setValue(record.colourName)
          control.get('materialName').setValue(record.materialName)
        }
        control.get('categoryName').setErrors(null)
      }
      this.generateSeoTitle();
    }
  }

  onDeSelect(event, control: FormGroup) {
    this.generateSeoTitle();
  }

  checkIfArrayIsUnique(myArray) {
    console.log(myArray.length, new Set(myArray).size)
    return myArray.length === new Set(myArray).size;
  }

  onRemove(index: number) {
    const componentArray = (<FormArray>this.seoTitleComposerForm.controls.componentArray);
    componentArray.removeAt(index);
    let components = componentArray.value as Array<any>;
    components = components.map(c => c.categoryName[0].componentId);
    componentArray.controls.forEach((f: FormGroup) => {
      if (!this.checkIfArrayIsUnique(components)) {
        f.get('categoryName').setErrors({ repeated: true })
      } else {
        f.get("categoryName").setErrors(null)
      }
    })
    this.generateSeoTitle();
  }

  saveSeotitleComposer() {
    this.submitted = true;
    if (this.seoTitleComposerForm.invalid) {
      return
    }
    else {
      const metaTitleFieldsValues = []
      this.seoTitleComposerForm.getRawValue().metaTitleArray.forEach((f, index) => {
        metaTitleFieldsValues.push({
          fieldName: f.fieldName,
          fieldType: f.fieldType,
          fieldValue: f.fieldValue,
          fieldNameStr: f.fieldNameStr,
          priority: f.priority,
          selected: f.selected,
          limit: f.limit,
          fieldValueId: f.fieldValueId,
        })
      })
      this.submitted = false
      this.isSaveLoader = true;
      const value = this.seoTitleComposerForm.value
      const body = {
        seoTitle: value.seoTitle,
        metaTitle: value.metaTitle,
        metaTitleFieldsValues: metaTitleFieldsValues
      }
      if (value.seoDescription) {
        body['seoDescription'] = value.seoDescription;
      }
      this._productService.generateSeoTitleComposer(this.variant.product.id, this.variant.id, body).subscribe(res => {
        this.variant.seoTitle = res.seoTitle;
        this.variant.metaTitle = res.metaTitle
        this.isDisable = true;
        if (res.seoDescription) {
          this.variant.seoDescription = res.seoDescription;
        }
        swal("Success", `change successfully`, "success");
        this.isSaveLoader = false;
      }, (error) => {
        console.log("error", error);
        this.isSaveLoader = false;
        swal("Error", error.error.message, "error");
      })
    }
  }

}
