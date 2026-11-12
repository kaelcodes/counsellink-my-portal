
import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions} from '@angular/http';
import { GlobalService } from './global.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {

  constructor(public global: GlobalService,private http: Http) { }

  apiPRSendResetKey(id,bdate): Observable<any>{
    return this.http.post(this.global.api+'ForgotPassword/SendEmailResetKey/'+id+'?dateOfBirth='+bdate,{
      },this.global.option)
          .map(response => response.json())
  }
  apiPRResetPWD(id, key): Observable<any>{
    return this.http.put(this.global.api+'ForgotPassword/ResetToDefaultPassword/'+id+'/'+key,{
    },this.global.option)
        .map(response => response.json())
  }
  // apiPRResetPassword(id,bdate,resetkey,email): Observable<any>{
  //   return this.http.get(this.global.api+"",{

  //   },this.global.option).map(response=>response.json())
  // }
}
