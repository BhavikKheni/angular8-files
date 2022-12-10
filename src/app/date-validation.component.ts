const DateFunctions = {
  getJsDateObjectFromNgDateObject: (ngbDateObject) => {
    if (ngbDateObject && ngbDateObject["year"] && ngbDateObject["month"] && ngbDateObject["day"] && ngbDateObject["day"] && ngbDateObject["year"] !== "" && ngbDateObject["monyh"] !==
      "" && ngbDateObject["day"] !== "") {
      return new Date(
        ngbDateObject["year"], ngbDateObject["month"] - 1, ngbDateObject["day"]
      )
    } else {
      return null
    }
  },
  getNgbDateObjectFromJsDate: (date) => {
    if (date === null) return null
    const jsDate = new Date(date)
    if (jsDate == null) {
      return null
    }
    else {
      const dd = jsDate.getDate();
      const mm = jsDate.getMonth() + 1;
      const yyyy = jsDate.getFullYear()
      return { year: yyyy, month: mm, day: dd }
    }
  },
  dateValidator: (values, oldStartDate, oldEndDate, startControlName, endControlName, msg1, msg2, msg3) => {
    const startDateErrors = {}
    const endDateErrors = {}
    const dummyToday = new Date()
    const today = new Date(dummyToday.getFullYear(), dummyToday.getMonth(), dummyToday.getDate())

    let jsStartDate = null;
    let jsEndDate = null;
    const startDate = DateFunctions.getNgbDateObjectFromJsDate(values[startControlName])
    const endDate = DateFunctions.getNgbDateObjectFromJsDate(values[endControlName])

    const startDateValue = startDate;
    const endDateValue = endDate;
    if (startDateValue !== null) {
      jsStartDate = DateFunctions.getJsDateObjectFromNgDateObject(startDateValue)

      if (oldStartDate !== null) {
        if (!moment(oldStartDate).isSame(jsStartDate) && moment(jsStartDate).isBefore(today)) {
          startDateErrors["pastDateError"] = "Please select current or future dates"
        }
      } else {
        if (moment(jsStartDate).isBefore(today)) {
          startDateErrors["pastDateError"] = "Please select current or future dates"
        }
      }
      if (moment(jsStartDate).isSameOrAfter(moment(today).add(1, "year"))) {
        startDateErrors["futureDateError"] = "Please select an start date within one year from current date";;
      }
    }

    if (endDateValue !== null) {
      jsEndDate = DateFunctions.getJsDateObjectFromNgDateObject(endDateValue)

      if (oldEndDate !== null) {
        if (!moment(oldStartDate).isSame(jsEndDate) && moment(jsEndDate).isBefore(today)) {
          startEndErrors["pastDateError"] = "Please select current or future dates"
        }
      } else {
        if (moment(jsEndDate).isBefore(today)) {
          startEndErrors["pastDateError"] = "Please select current or future dates"
        }
      }
      if (moment(jsEndDate).isSameOrAfter(moment(today).add(1, "years"))) {
        startEndErrors["futureDateError"] = "Please select an end date within one year from current date";
      }
    }
    if (startDateValue == null && endDateValue !== null) {
      startDateErrors["NonNull"] = msg1
    }
    if (startDateValue !== null && endDateValue == null) {
      startDateErrors["NonNull"] = msg2
    }
    if (startDateValue !== null && endDateValue !== null) {
      startDateErrors["RangeError"] = msg3;
      endDateErrors["RangeError"] = msg3
    }
    if (moment(jsEndDate).isBefore(moment(jsStartDate))) {
      startDateErrors["ToggleError"] = "Please select start date less then end date";
      endDateErrors["ToggleError"] = "Please select start date less then end date";
    }

    let obj = {}
    obj[startControlName] = startDateErrors;
    obj[endControlName] = endDateErrors
  }
}
//Example 
const values = {
  startDate = new Date(),
  endDate = new Date()
}
const oldStartDate = null
const oldEndDate = null
let msg1 = "Please select a Dc Order start date for set 2";
let msg2 = "Please select a Dc Order end date for set 2";
let overrideDuration = "Please select a Dc Order override duration of upto 1 year"
const { startDate, endDate } = DateFunctions.dateValidator(values, oldStartDate, oldEndDate, "startDate", "endDate", msg1, msg2, overrideDuration)

