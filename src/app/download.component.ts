
import { HttpResponse } from '@angular/common/http';
this._dashboardService.downloadPdf(date, param).subscribe((response: any) => {
  this.extractData1(response);
}, ((error: any) => {
  console.log("Error", error)
}))

extractData1(response: HttpResponse<any>) {
  const a: any = document.createElement("a");
  document.body.appendChild(a);
  const blob: any = new Blob([response.body], { type: 'octet/stream' });
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = response.headers.get('fileName') || 'test.pdf'
    a.click();
  window.URL.revokeObjectURL(url);
}