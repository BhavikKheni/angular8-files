import { Component, OnInit, Input, ViewChild, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import swal from 'sweetalert2';
import { Tag } from 'src/app/models/tag';
import { TagService } from 'src/app/modules/tags/tag.service';
import { ModalConfig } from 'src/app/shared/components/modal/modal.config';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { ProductService } from '../../product.service';

export interface TagType {
  brands?: Array<string>;
  categories?: Array<string>;
  rooms?: Array<string>;
}

@Component({
  selector: 'app-tag-update-modal',
  templateUrl: './tag-update-modal.html',
  styleUrls: ['./tag-update-modal.scss'],
})
export class TagUpdateModalComponent implements OnInit {
  @ViewChild("multiSelect") multiSelect;
  @ViewChild('modal') private modalComponent: ModalComponent;
  @Input() productId: string;
  @Input() product: any;
  @Input() variant: any;
  @Output() onCloseModal = new EventEmitter();
  tagForm: FormGroup;
  keywordDictionary = {};
  categoryComponentList: Array<any> = []
  errorMessage: string = ""
  // For List
  tags: any = {};
  tagsCopy: any = {};

  // For Edit Tags (Add tag section)
  _tags: any = {};
  _tagsCopy: any = {};

  isAPIRunning: boolean = false;

  variantTags: {};

  productTagList: any;
  productTagListCopy: any;

  modalConfig: ModalConfig = {
    modalTitle: 'Update The Tags',
  };
  submited = false
  showLoader = false;
  seoTitle: string = "";
  seoDescription: string = "";
  seoUpdateAPIRunning: boolean = false;
  settings = {}
  list: any;
  keywords: any = []
  constructor(private _tagService: TagService,
    public formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private _productService: ProductService) { }

  ngOnInit() {
    this.settings = {
      singleSelection: false,
      enableCheckAll: false,
      idField: 'id',
      textField: 'name',
      disabled: false,
      // selectAllText: "Select All",
      allowSearchFilter: false,
      limitSelection: -1,
      clearSearchFilter: true,
      noDataAvailablePlaceholderText: "No data found",
      closeDropDownOnSelection: false,
      showSelectedItemsAtTop: false,
      defaultOpen: false
    }
  }

  initDialog() {
    this.getTagList();
    if (this.product) {
      this.tags = this.groupByType(this.product.tags);
    } else { // for variant
      // this.tags = this.groupByType(this.variant.tags);
      this.tags = this.groupByVariantType(this.variant.variantTags);
      this.createTagForm()
      this.getCategoryComponentList()
    }
    this.tagsCopy = JSON.parse(JSON.stringify(this.tags));
    this.seoTitle = this.variant?.seoTitle;
    this.seoDescription = this.variant?.seoDescription;
  }

  async openModal() {
    await this.modalComponent.open('tagupdate');
  }

  async closeModal() {
    await this.modalComponent.close();
  }

  modalClosed(event) {
    this.onCloseModal.emit(event);
  }

  createTagForm() {
    Object.keys(this.tags).forEach((key, i) => {
      this.tags[key].forEach(r => {
        if (r.tag?.keywordList || r.keywordList) {
          const list = r.tag?.keywordList || r.keywordList
          this.keywords.push(...list)
        }
      });
    })
    this.tagForm = this.formBuilder.group({
      list: this.formBuilder.array([])
    })

    const list = this.tagForm.get('list') as FormArray;

    Object.keys(this.tags).forEach((key, i) => {
      const tagTypeFg = this.formBuilder.group({
        "tags": this.formBuilder.array([]),
        "type": [key]
      })
      if (['style', 'theme', 'filter'].includes(key)) {
        const keyword = this.keywords?.find(f => f.name == this.keywordDictionary[key])
        tagTypeFg.addControl("keywordId", new FormControl(keyword ? keyword.id : null))
      }

      const tags = tagTypeFg.get("tags") as FormArray;

      this.tags[key].forEach((tag, index) => {
        const componentList = tag.components && tag.components.map((component: any) => ({ id: component.componentId, name: component.componentName }))
        if (this.dictionary[key]) {
          if (componentList && componentList.length) {
            this.dictionary[key].push(...componentList.map(c => c.id))
          }
        } else {
          this.dictionary[key] = [];
          if (componentList && componentList.length) {
            this.dictionary[key].push(...componentList.map(c => c.id))
          }
        }
        const fg = this.formBuilder.group({
          tagId: tag.tag?.tagId,
          type: tag.tag.type,
          name: tag.tag.name,
          colorHexCode: tag.tag.colorHexCode,
          mainThumbnail: tag.tag.mainThumbnail,
          priority: undefined
        });
        switch (tag.tag.type) {
          case 'colour':
            fg.addControl("percentage", new FormControl(tag.percentage || 0, [Validators.required, Validators.min(0)]))
          case 'material':
            fg.addControl("componentIds", new FormControl(componentList || []))
            break;
        }
        tags.push(fg)
      });
      list.push(tagTypeFg)
    });

  }

  getCategoryComponentList() {
    this._tagService.getCategoryComponentList(this.variant.id).subscribe(res => {
      this.categoryComponentList = res;

    }, (error) => {
      console.log("Error", error)
    })
  }

  dictionary = {}
  onItemSelect(event, item: FormGroup, control: FormGroup) {
    if (this.dictionary[item.value.type]) {

      const index = this.dictionary[item.value.type].findIndex(value => value == event.id)
      if (index == -1) {
        this.dictionary[item.value.type].push(event.id)
        control.get('componentIds').setErrors(null)
        this.errorMessage = null

      } else {
        const componentIds = control.get('componentIds').value || [];
        const i = componentIds.findIndex(c => c.id == event.id);
        this.errorMessage = `${componentIds[i].name} is already exist`
        componentIds.splice(i, 1);

        // this.dictionary[item.value.type].splice(index, 1)
        control.get('componentIds').patchValue(componentIds)
        control.get('componentIds').setErrors({ repeated: true })

        setTimeout(() => {
          control.get('componentIds').setErrors(null)
          this.errorMessage = null;
        }, 2000)
      }
    } else {
      this.dictionary[item.value.type] = [];
      this.dictionary[item.value.type].push(event.id)
    }
  }

  onSelectAll(event, item: FormGroup, control: FormGroup) {
    if (this.dictionary[item.value.type]) {

      const index = this.dictionary[item.value.type].findIndex(value => value == event.id)
      if (index == -1) {
        this.dictionary[item.value.type].push(event.id)
        control.get('componentIds').setErrors(null)
        this.errorMessage = null

      } else {
        const componentIds = control.get('componentIds').value || [];
        const i = componentIds.findIndex(c => c.id == event.id);
        this.errorMessage = `${componentIds[i].name} is already exist ${item.value.type} in tag type`
        componentIds.splice(i, 1);

        // this.dictionary[item.value.type].splice(index, 1)
        control.get('componentIds').patchValue(componentIds)
        control.get('componentIds').setErrors({ repeated: true })

        setTimeout(() => {
          this.errorMessage = null;
          control.get('componentIds').setErrors(null)
        }, 5000)
      }
    } else {
      this.dictionary[item.value.type] = [];
      this.dictionary[item.value.type].push(event.id)
    }
    // this.categoryComponentList = [...this.categoryComponentList.map(m => ({ ...m, isDisabled: true }))]

  }

  onDeSelectAll(event, item: FormGroup, control: FormGroup) {
  }

  onDeSelect(event, item: FormGroup, control: FormGroup) {
    const index = this.dictionary[item.value.type] && this.dictionary[item.value.type].findIndex(value => value == event.id)
    if (!isNaN(index) && index >= 0) {
      this.dictionary[item.value.type].splice(index, 1)
    }
  }

  getKeywords(type) {
    this.keywords = []
    if (this.tags[type]) {
      this.tags[type].forEach(r => {
        if (r.tag?.keywordList || r.keywordList) {
          const list = r.tag?.keywordList || r.keywordList
          this.keywords.push(...list)
        }
      });
    }
    return this.keywords
  }

  changeOrder(direction, currentIndex, item: FormGroup, control: FormGroup) {
    if (direction == 'up' && currentIndex > 0) {
      const tags = item.get("tags") as FormArray;
      // clone object (otherwise only pointer/reference is saved).
      const temp = Object.assign({}, tags.controls[currentIndex - 1].value);
      tags.controls[currentIndex - 1].setValue(tags.controls[currentIndex].value);
      tags.controls[currentIndex].setValue(temp);
    } else if (direction == 'down' && currentIndex < item.controls.tags.value.length - 1) {
      const tags = item.get("tags") as FormArray;
      // clone object (otherwise only pointer/reference is saved).
      const temp = Object.assign({}, tags.controls[currentIndex + 1].value);
      tags.controls[currentIndex + 1].setValue(tags.controls[currentIndex].value);
      tags.controls[currentIndex].setValue(temp);
    }
  }

  groupByVariantType(array) {
    const dictionary = {};

    array.forEach(element => {
      if (element.tag !== undefined) {
        if (element.keyword) {
          this.keywordDictionary[element.tag.type] = element.keyword
        }
        if (dictionary[element.tag.type]) {
          dictionary[element.tag.type].push(element);
        } else {
          dictionary[element.tag.type] = [];
          dictionary[element.tag.type].push(element);
        }
      }
    });
    return dictionary;
  }

  refreshList() {
    this.tags = JSON.parse(JSON.stringify(this.tagsCopy));
    if (this.product) {
      this.tags = this.groupByType(this.product.tags);
    } else { // for variant
      this.tags = this.groupByType(this.variant.tags);
    }
  }

  groupBy = (key) => array =>
    array.reduce((objectsByKeyValue, obj) => {
      const value = obj[key];
      objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
      return objectsByKeyValue;
    }, {});

  groupByType = this.groupBy('type');

  getTagList() {
    let _tags = null;
    let _tagsCopy = null;

    this.showLoader = true;
    this._tagService.getTagList().subscribe((response: Array<Tag>) => {

      this._tagService.setTagList(response);
      const tagName = this.groupByType(response);
      if (this.product) {
        const productTags = tagName.brand.concat(tagName.category, tagName.room);
        _tags = productTags;
        _tagsCopy = JSON.parse(JSON.stringify(productTags));
      } else if (this.variant) {

        let variantTags = [];
        Object.keys(tagName).forEach((key) => {
          if (key != 'brand' && key != 'category' && key != 'room') {
            variantTags = variantTags.concat(tagName[key]);
          }
        });

        _tags = variantTags;
        _tagsCopy = JSON.parse(JSON.stringify(variantTags));
      }

      this._tags = _tags;
      this._tagsCopy = _tagsCopy;
      this.showLoader = false;
    }, (err) => {
      this.showLoader = false;
    });
  }

  searchTag(key) {
    if (key) {
      this._tags = this._tagsCopy.filter(
        (tag) => tag.name.toLowerCase().indexOf(key.toLowerCase()) > -1
      );
    } else {
      this._tags = JSON.parse(JSON.stringify(this._tagsCopy));
    }
  }

  assignTag(tag) {
    if (this.product) {
      if (this.tags[tag.type]) {
        const index = this.tags[tag.type]?.findIndex((tagInfo => tagInfo.id == tag.id))
        if (index == -1) {
          if (this.product) {
            if (this.tags[tag.type]?.length) {
              alert("Only one tag type allowd per tag");
            } else {
              this.tags[tag.type].push(tag);
            }
          } else {
            this.tags[tag.type].push(tag);
          }
        } else {
          alert("Tag type already added");
        }
      } else {
        this.tags[tag.type] = [tag];
      }
    } else {
      if (this.tags[tag.type]) {
        const index = this.tags[tag.type]?.findIndex((tagInfo => tagInfo.tag.id == tag.id))
        if (index == -1) {
          if (this.product) {
            if (this.tags[tag.type]?.length) {
              alert("Only one tag type allowd per tag");
            } else {
              this.tags[tag.type].push(tag);
            }
          } else {
            this.tags[tag.type].push({ tag: tag, priority: this.tags[tag.type].length + 1 });
            this.addTag(tag)
          }
        } else {
          alert("Tag type already added");
        }
      } else {
        this.tags[tag.type] = [{ tag: tag, priority: 1 }];
        this.addTag(tag)
      }
    }
  }

  addTag(tag: any) {
    const list = this.tagForm.get('list') as FormArray;
    let tagTypeFg = list.controls.find((control: FormGroup) => control.value.type == tag.type) as FormGroup;

    if (!tagTypeFg) {
      const fg = this.formBuilder.group({
        "tags": this.formBuilder.array([]),
        "type": [tag.type]
      })

      if (['style', 'theme', 'filter'].includes(tag.type)) {
        fg.addControl("keywordId", new FormControl())
      }
      list.push(fg)
      tagTypeFg = list.controls.find((control: FormGroup) => control.value.type == tag.type) as FormGroup;
    }
    const tags = tagTypeFg.get('tags') as FormArray;

    if (['style', 'theme', 'filter'].includes(tag.type)) {
      if (!tagTypeFg.contains("keywordId")) {
        tagTypeFg.addControl("keywordId", new FormControl())
      }
    }

    const fg = this.formBuilder.group({
      tagId: tag.tagId,
      type: tag.type,
      name: tag.name,
      colorHexCode: tag.colorHexCode,
      mainThumbnail: tag.mainThumbnail,
      priority: list.length + 1
    });
    switch (tag.type) {
      case 'colour':
        fg.addControl("percentage", new FormControl(tags.length == 0 ? 100 : 0))
      case 'material':
        fg.addControl("componentIds", new FormControl())
        break;
    }
    tags.push(fg)
  }

  saveProductTags() {
    const tags = [];
    Object.keys(this.tags).forEach((tagType) => {
      this.tags[tagType] &&
        this.tags[tagType].forEach((tag) => {
          tags.push(tag.id);
        });
    });
    if (this.product) {
      this.updateProductTags(tags);
    } else {
      this.submited = true
      const value = JSON.parse(JSON.stringify(this.tagForm.value));
      if (this.tagForm.invalid) {
        return
      } else {
        this.submited = false
        value.list.forEach(l => {
          l.tags = l.tags.map((t, index) => {
            t.priority = index + 1
            if (t.componentIds && t.componentIds.length) {
              t.componentIds = t.componentIds?.map(c => c.id)
            }
            return t
          })
        })
        let total = undefined;
        value.list.forEach(f => {
          if (f.type === 'colour') {
            total = 0;
            f.tags.forEach(t => {
              total += t.percentage
            })
          }
        });
        if (total != undefined && (total > 100 || total < 0)) {
          swal('Error', 'Percentage between 0 to 100', 'error');
          this.isAPIRunning = false;
        } else if (total < 100) {
          swal('Error', 'Percentage should be 100', 'error');
          this.isAPIRunning = false;
        }
        else {
          this.updateVariantTags(value.list);
        }
      }
    }
  }

  updateProductTags(tags: any) {
    this.isAPIRunning = true;
    this._tagService.postProductTags(this.product.id, tags).subscribe((res) => {
      this.isAPIRunning = false;
      swal('Success', 'Product tags assigned successfully', 'success');
      this.closeModal().then(() => {
        this.onCloseModal.emit({ tags: res.tags });
      });
    },
      (err) => {
        this.isAPIRunning = false;
        this.refreshList();
      });
  }

  updateVariantTags(tags: any) {
    this.isAPIRunning = true;
    this._tagService.updateVariantTags(this.variant.product?.id, this.variant.id, tags).subscribe((response) => {
      this.isAPIRunning = false;
      this.variant.variantTags = response.variantTags
      this.refreshList()
      swal('Success', 'Variant tags updated successfully', 'success');
      this.closeModal().then(() => {
        this.onCloseModal.emit({ tags: response.variantTags });
      });
    },
      (err) => {
        this.isAPIRunning = false;
        this.refreshList()
      });
  }

  deleteVariantTag(control, tagType, currentIndex, item: FormGroup) {
    const index = this.tags[tagType].findIndex((tag) => tag.tag.id == control.value.tagId)
    if (['style', 'theme', 'filter'].includes(tagType)) {
      const keyword = this.tags[tagType][index]
      this.getKeywords(tagType)
      if (keyword.tag.keywordList?.find(k => k.id == item.get('keywordId').value)) {
        item.controls['keywordId'].patchValue(undefined);
      }
    }
    if (this.dictionary[tagType]) {
      this.dictionary[tagType] = this.dictionary[tagType].filter(f => {
        return !control.value.componentIds?.map(m => m.id).includes(f);
      })
    }
    this.tags[tagType].splice(index, 1);
    const tags = item.get("tags") as FormArray;
    tags.removeAt(currentIndex);
    if (tags.length == 0) {
      const list = this.tagForm.get('list') as FormArray;
      const index = list.controls.findIndex(f => f.value.type == item.value.type)
      if (index >= 0) {
        list.removeAt(index)
      }
    }
  }

  deleteProductTag(tag, tagType) {
    this.tags[tagType].splice(this.tags[tagType].indexOf(tag), 1);
  }

  saveSEODetails() {
    this.seoUpdateAPIRunning = true;
    this.variant["seoTitle"] = this.seoTitle;
    this.variant["seoDescription"] = this.seoDescription;
    this._productService.updateVariantById(this.variant.product.id, this.variant.id, this.variant).subscribe(response => {
      swal("Success", 'Variant info has been updated successfully', "success");
      this.seoUpdateAPIRunning = false;
      this.closeModal().then(() => {
        this.onCloseModal.emit({ seoTitle: response.seoTitle, seoDescription: response.seoDescription });
      });
    }, (err) => {
      this.seoUpdateAPIRunning = false;
    });
  }
}
