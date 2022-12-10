//For restriction the field with allowd chars pattern and retains
//its value when pressed restricted chars
const retainFieldVal = (event: any, regex: any) => {
  let specialKeys = [
    "ArrowLeft",
    "ArrowRight",
    "Escape",
    "Tab",
    "End",
    "Home",
    "Enter",
    "Backspace",
    "Delete",
    "Right",
    "Left",
    "Del",
  ]
  const controlOrCommand = event.ctrlKey === true || event.metaKey === true;
  const key = getName(event)
  if (specialKeys.indexOf(key) !== -1 || (key === "a" && controlOrCommand) || (key === "c" && controlOrCommand) || (key === "v" && controlOrCommand)
    || (key === "x" && controlOrCommand) || (key === "z" && controlOrCommand)
  ) {
    return
  }
  const { firstPart, lastPart } = getSelectionText(event)
  const finalPart = firstPart + event.key + lastPart;

  if (finalPart.match(regex)) {
    return
  } else {
    event.preventDefault()
  }
}

const getName = (e: any) => {
  if (e.key) {
    return e.key;
  } else {
    if (e.keyCode && String.fromCharCode) {
      switch (e.keyCode) {
        case 8:
          return "Backspace";
        case 9:
          return "Tab";
        case 13:
          return "Enter";
        case 27:
          return "Escape";
        case 35:
          return "End";
        case 36:
          return "Home";
        case 37:
          return "ArrowLeft";
        case 39:
          return "ArrowRight";
        case 188:
          return ",";
        case 109:
          return "-";// minus in numpad
        case 190:
          return ".";
        case 189:
          return "-"; // minus in alphabet keyboard in firefox
        case 173:
          return "-"; // minus in alphabet keyboard in chrome
        default:
          return String.fromCharCode(e.keyCode)
      }
    }
  }
}
const pasteHandler = (event: any, regex: any) => {
  let value = ""
  if (window["clipboardData".toString()] && window["clipboardData".toString()].getData) {
    //IE
    value = window["clipboardData".toString()].getData("Text")
  } else if (event.clipboardData && event.clipboardData.getData) {
    // other browser
    value = event.clipboardData.getData("text/plain")
  }
  const { firstPart, lastPart } = getSelectionText(event)
  const finalPart = firstPart + event.key + lastPart;

  if (finalPart.match(regex)) {
    return
  } else {
    event.preventDefault()
  }
};

const getSelectionText = (event: any) => {
  const startIndex = event.target["selectionStart"]
  const stopIndex = event.target["selectionEnd"];
  const currentValue = event.target.value;
  const firstPart = currentValue.slice(0, startIndex)
  const lastPart = currentValue.slice(stopIndex, currentValue.length)
  return {
    firstPart: firstPart,
    lastPart: lastPart
  }
}
// both are input field method like change method
// onKeyDown
const onKeyDown = (event: any) => {
  const regex = /^[a-zA-Z]*$/
  retainFieldVal(event, regex)
}
//onPaste function
const onPaste = (event: any) => {
  const regex = /^[a-zA-Z]*$/
  pasteHandler(event, regex)
}