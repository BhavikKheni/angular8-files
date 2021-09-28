import { Component, OnInit, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { PatientService } from '../patient/patient.service';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import $ from 'jquery'
import { PatientUpdateComponent } from '../patient-update/patient-update.component';
import * as moment from 'moment';
@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.scss']
})
export class PatientDashboardComponent implements OnInit {
  questionaireForm: FormGroup;
  profileData: any;
  patientCaseId: any;
  loader: boolean = false;
  isSaveQuestionLoader: boolean = false;
  isQuestion: boolean = false;
  isMessage: boolean = false
  messagesDayPlan: Array<any> = [];
  questionnaireDayPlan: Array<any> = [];
  latestDateQuestionnaireDayPlan: any;
  displayString = "abcdefghijklmnopqrstuvwxyz";
  minValue: Number = 0;
  nyhaOptions: any;
  nyhaOptionsDictionary = {}
  investigations = [];
  observations = [];
  patientCases = [];
  patientInvestigations = [];
  patientObservations = [];
  objectKeys = Object.keys;
  selectedSystolic: any;
  selectedDiastolic: any;
  dictionary = {}
  dictionary2 = {}
  //use for patient questionaire answer
  pCaseId: any;
  constructor(public _patientService: PatientService,
    public formBuilder: FormBuilder,
  ) {

  }

  ngOnInit(): void {
    this.getPatientProfile()
    this.initializeForm();
  }

  getPatientProfile() {
    this.loader = true;
    this._patientService.getPatientProfile(username).subscribe(data => {
      sessionStorage.setItem('patientCaseId', JSON.stringify(data.id));
      this.profileData = data;
      let nonClosedCases = this.profileData.patientCases.filter((f) => f.status != "CLOSED");
      let closedCases = this.profileData.patientCases.filter((f) => f.status == "CLOSED");
      let allPatientCases = [...nonClosedCases, ...closedCases]
      this.patientCases = allPatientCases;

      const cases = this.questionaireForm.get('cases') as FormArray;
      this.patientCases.forEach((patient, index) => {
        const fg = this.formBuilder.group({
          id: patient.id,
          caseNo: patient.caseNo,
          dateOfReferral: patient.dateOfReferral,
          referrer: patient.referrer,
          nameOfReferrer: patient.nameOfReferrer,
          referralReason: patient.referralReason,
          status: patient.status,
          nextClinicStartTime: patient.nextClinicStartTime,
          investigationObservationsValue: [patient.investigationObservationsValue],
          currentDrugMedications: [patient.currentDrugMedications],
          questionnaireDayPlan: [patient.questionnaireDayPlan],
          messagesDayPlan: [patient.messagesDayPlan],
          questionArray: this.formBuilder.array([])
        });
        const dayplans = [...patient.questionnaireDayPlan]
        var records = []
        if (patient.nextClinicStartTime) {
          records = dayplans.filter(f => moment(f.clinicStartTime, "DD-MM-YYYYTHH:mm ").format('YYYY-MM-DD') === moment(patient.nextClinicStartTime).format('YYYY-MM-DD'))
        }
        this.renderQuestionaire(patient, records, index, fg);
        cases.push(fg)
      });
      this.loader = false;
    }, (error) => {
      console.log("Error", error)
      this.loader = false;
    });
  }

  initializeForm() {
    this.questionaireForm = this.formBuilder.group({
      cases: this.formBuilder.array([])
    })
  }


  renderQuestionaire(record, selectedQuestionnaireDayPlan, index, fg: FormGroup) {
    this.pCaseId = record.id;
    let questionnaireDayPlan = selectedQuestionnaireDayPlan.length ? selectedQuestionnaireDayPlan[0] : {}
    this.latestDateQuestionnaireDayPlan = questionnaireDayPlan
    let questionnaires = [];
    let nyhaOptions = [];

    questionnaireDayPlan?.questionnaire?.forEach(element => {
      if (element.type !== 'NYHA_OPTION') {
        questionnaires.push(element)
      } else if (element.type === 'NYHA_OPTION') {
        nyhaOptions.push(element)
      }
    });

    this.questionnaireDayPlan = questionnaires
    this.nyhaOptionsDictionary[index] = nyhaOptions.sort((a, b) => a.questionnaire.max - b.questionnaire.max)
    this.nyhaOptions = nyhaOptions && nyhaOptions.sort((a, b) => a.questionnaire.max - b.questionnaire.max);

    this.questionaire(questionnaires, fg)
    let bpBreak = this.latestDateQuestionnaireDayPlan?.bp?.split("/") || ""
    let systolic = bpBreak[0] || null
    let diastolic = bpBreak[1] || null
    this.dictionary2[index] = {
      selectedDiastolic: diastolic,
      selectedSystolic: systolic
    }
  }

  questionaire(questionnaires, fg: FormGroup) {
    questionnaires && questionnaires.forEach(element => {
      (<FormArray>fg.controls.questionArray).push(this.formBuilder.group({
        answer: [element.answer],
        question: [element.question],
        id: [element.id],
        type: [element.typeStr],
        datatype: [element.questionnaire ? element.questionnaire.dataType : 'Text'],
        questionnaire: [element.questionnaire]
      }));
    });
  }

  onClose() {
    $(document).on('click', '.patient-custom-header .close', function () {
      $(this).closest('.tab-pane').removeClass('active show');
      $('.nav-link').removeClass('active').attr('aria-selected', 'false');
    });
  }

  onDownloadDocument(url, name) {
    this._patientService.downloadDocument(url).subscribe((response: any) => {
      const a = document.createElement('a');
      document.body.appendChild(a);
      const blob: any = new Blob([response.body], { type: 'octet/stream' });
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
    })
  }

  saveQuestion(caseId: any, index: any) {

    const value = this.questionaireForm.value
    const data = value.cases.find(f => f.id == caseId)
    let { questionArray } = data;

    let filterAnsRecord = questionArray.filter(f => f.answer)
    let bp = filterAnsRecord.filter(f => f.type == 'BP').map(ab => ({ ...ab, answer: `${this.dictionary2[index].selectedSystolic}/${this.dictionary2[index].selectedDiastolic}` }))
    let restRecord = filterAnsRecord.filter(f => f.type !== 'BP')
    const body = {
      "list": [...restRecord, ...bp]
    }


  }

}
