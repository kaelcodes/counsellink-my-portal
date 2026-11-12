import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions} from '@angular/http';
import { GlobalService } from './global.service';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { map, switchMap } from 'rxjs/operators';
import JSEncrypt from 'jsencrypt'; // Import the library
import * as uuid from 'uuid';


@Injectable({
  providedIn: 'root'
})
export class StudentApiService {

  constructor(public global: GlobalService,private http: Http) { }

  apiUserLogin(username, password): Observable<any> {
    var header = new Headers();
    header.append("Content-Type", "application/json");
    var option = new RequestOptions({ headers: header });

    const id = this.global.tokenID;

    // 1. Fetch the public key
    return this.http.get(this.global.api + 'Metadata', option).pipe(
      // Map the response to JSON (Legacy Http module style)
      map(response => response.json()),
      switchMap(keyResponse => this.global.apiPublicAPICurrentServerTime().pipe(
        map(serverTime => ({ keyResponse, serverTime }))
      )),

      // 2. switchMap waits for the first request to finish, then allows you to return a new request
      switchMap(({ keyResponse, serverTime }) => {
        const rawPayload = {
          UserName: username,
          Password: password,
          AppName: 'GuidanceCounselLink',
          AppId: 'AF523337-A792-4115-A9E4-FFF3120BECDF',
          Timestamp: new Date(serverTime.data).getTime(),
          Nonce: uuid.v4() // Generate a unique nonce for each request
        };

        if (isNaN(rawPayload.Timestamp)) {
          throw new Error('Invalid server time');
        }

        // Encrypt the payload
        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(keyResponse.metadata);

        const jsonString = JSON.stringify(rawPayload);
        const encryptedString = encryptor.encrypt(jsonString);

        if (!encryptedString) {
          throw new Error('Encryption failed');
        }

        // Prepare the final payload expected by your .NET 10 backend
        const loginPayload = {
          EncryptedPayload: encryptedString
        };

        // 3. Return the POST request 
        return this.http.post(this.global.api + 'Auth/UserLogin', loginPayload, option).pipe(
          map(res => res.json())
        );
      })
      // Handle any errors that occur during the process 
      //,catchError(error => {
      //console.error('Error during login process:', error);
      //return throwError(error);
      //return "Success";
      //})

    );

  }

  apiAuthLogin(username, password): Observable<any> {
    var header = new Headers();
    header.append("Content-Type", "application/json");
    var option = new RequestOptions({ headers: header });
    // const id  = "Ex1yk5S*9ceh"
    const id  = this.global.tokenID
    return this.http.post(this.global.api+'Auth/login' ,{
      'userName':username,
      'password':password,
      'AppName':'GuidanceCounselLink',
      'AppId':'AF523337-A792-4115-A9E4-FFF3120BECDF'
    },option)
      .map(response => response.json())
  }



  apiAuthUserInfo(option): Observable<any>{
    return this.http.get(this.global.api+'Auth/UserInfo',option)
    .map(response => response.json())
  }

  apiPersonInfo(username): Observable<any>{
  	var header = new Headers();
    header.append("Content-Type", "application/json");
  	var option = new RequestOptions({ headers: header });
  	return this.http.get(this.global.api+'StudentPortal/PersonInfo/'+username,option)
    .map(response => { response.json() });
  }


  apiEmailConfirm(username): Observable<any>{
    var header = new Headers();
    header.append("Content-Type", "application/json");
    var option = new RequestOptions({ headers: header });
    return
    this.http.put(this.global.api+'StudentPortal/EmailConfirm/'+username+'/1',{},option)
    .map(response => { response.json() });
  }

  getPublicNotifications() {
    return this.http.get(this.global.api + 'PublicAPI/Notifications', this.global.option)
  }
  apiAccess(): Observable<any>{
    return this.http.get(this.global.api+'Access/'+this.global.requestid(),this.global.option)
    .map(response => response.json())
  }

  apiStudentPortalFamilyBG(): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/FamilyBG/',this.global.option)
    .map(response => response.json())
  }
  apiStudentPortalEducBG(): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/EducBG/',this.global.option)
    .map(response => response.json())
  }


  apiPublicAPISchools(): Observable<any>{
    return this.http.get(this.global.api+'PublicAPI/Schools',this.global.option)
        .map(response => response.json())
  }

  apiStudentPortalParent(memberIdNumber): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/Parent?parentId='+memberIdNumber,this.global.option)
    .map(response => response.json())
  }

  apiPublicAPILocation(loc,param=''): Observable<any>{
    return this.http.get(this.global.api+'PublicAPI/'+loc+'/',this.global.option)
    .map(response => response.json())
  }


  apiPublicAPIProvinces(): Observable<any>{
    return this.http.get(this.global.api+'PublicAPI/Provinces',this.global.option)
    .map(response => response.json())
  }

  apiPublicAPITownsCities(province): Observable<any>{
    return this.http.get(this.global.api+'PublicAPI/TownsCities/'+province,this.global.option)
    .map(response => response.json())
  }

  apiPublicAPIBarangays(province,town): Observable<any>{
    return this.http.get(this.global.api+'PublicAPI/Barangays/'+province+'/'+town,this.global.option)
    .map(response => response.json())
  }

  apiStudentPortalCurriculum(progid): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/Curriculum/'+progid,this.global.option)
    .map(response => response.json())
  }

  apiStudentPortalID(id,progid): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/'+id+'/'+progid,this.global.option)
    .map(response => response.json())
  }

  apiAcademicHistoryEvaluation(id): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/AcademicHistoryEvaluation/'+id,this.global.option)
    .map(response => response.json())
  }

  apiSubjectAcademicHistoryMapping(id,progid): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/SubjectAcademicHistoryMapping/'+id+'/'+progid,this.global.option)
    .map(response => response.json())
  }

  apiStatusList(): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/StatusList',this.global.option)
    .map(response => response.json())
  }

  apiStudentPortalPost(id,progid): Observable<any>{
  return this.http.post(this.global.api+'StudentPortal/',{
    "idNumber": id,
    "programId": progid
    },this.global.option)
        .map(response => response.json())
  }

  apiSubjectAcademicHistoryMappingPost(id,acadhistid): Observable<any>{
  return this.http.post(this.global.api+'StudentPortal/SubjectAcademicHistoryMapping/',{
      "studentEvaluationChecklistId": parseInt(id),
      "academicHistoryRecordId": parseInt(acadhistid),
      "statusId": 0
      },this.global.option)
          .map(response => response.json())
  }

  apiHistoryPost(id,progid): Observable<any>{
  return this.http.post(this.global.api+'StudentPortal/History',{
      "idNumber": id,
      "programId": progid,
      "schoolYear": this.global.studinfo.lastSY,
      "evaluatedBy": this.global.requestid()
    },this.global.option)
        .map(response => response.json())
  }

  apiRetentionPolicyLastSY(): Observable<any>{
  return this.http.get(this.global.api+'StudentPortal/RetentionPolicyLastSY/'+this.global.userinfo.idNumber,this.global.option)
  .map(response => response.json())
  }

  apiBasicEdStudentSchedule(sy): Observable<any>{

    var section = this.global.enrollmenthist[this.global.enrollmenthist.length-1].section;
    if(this.global.oldshs_col)
      section = this.global.studinfo.section
    if(this.global.oldjhs_shs)
      section = this.global.studinfo.section

  return this.http.get(this.global.api+'StudentPortal/BasicEdStudent/Schedule/'+sy+'/'+section+'/'+this.global.requestid(),this.global.option)
  .map(response => response.json())
  }

  apiHSEnrollmentStudentElective(sy): Observable<any>{
  return this.http.get(this.global.api+'StudentPortal/HSEnrollment/Student/Elective/'+sy+'?idNumber='+this.global.requestid(),this.global.option)
  .map(response => response.json())
  }


  apiHSEnrollmentElectives(sy): Observable<any>{
  return this.http.get(this.global.api+'StudentPortal/HSEnrollment/Electives/'+sy,this.global.option)
  .map(response => response.json())
  }

  apiHSEnrollmentElectivesPost(selected,sy): Observable<any>{
  return this.http.post(this.global.api+'StudentPortal/HSEnrollment/Student/Elective/' ,{
      "IdNumber": this.global.requestid(),
      "ElectiveId": selected,
      "SchoolYear": sy
    },this.global.option)
     .map(response => response.json())
  }


  apigetexcelaccesscodes(): Observable<any>{
  return this.http.get(this.global.acctgApi+'getexcel/access-codes/?sy='+this.global.sy)
  .map(response => response.json())
  }


  // apiPreferredLearningModality(sy): Observable<any>{
  // return this.http.get(this.global.api+'StudentPortal/PreferredLearningModality/'+sy+'?idNumber='+this.global.requestid(),this.global.option)
  // .map(response => response.json())
  // }
  apiPreferredLearningModality(sy): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/PreferredLearningModality/'+sy+'?idNumber='+this.global.requestid(),this.global.option)
    .map(response => response.json())
    }

  apiLearningModalities(sy): Observable<any>{
  return this.http.get(this.global.api+'StudentPortal/LearningModalities/?schoolYear='+sy,this.global.option)
  .map(response => response.json())
  }

  apiLearningModalityPost(selected,sy): Observable<any>{
  return this.http.post(this.global.api+'StudentPortal/LearningModality/' ,{
    "IdNumber": this.global.requestid(),
    "LearningModalityId": selected,
    "SchoolYear": sy
  },this.global.option)
        .map(response => response.json())
  }



  apiPreEnrollmentSubmittedRequirement(year): Observable<any>{

  return this.http.get(this.global.api+'StudentPortal/PreEnrollment/SubmittedRequirement/'+year+"?idNumber="+this.global.requestid()+'&includePic=1',this.global.option)
  .map(response => response.json())
  }

  apiOnlineRegistrationCoursesWithStrand(): Observable<any>{
  return this.http.get(this.global.api+'OnlineRegistration/CoursesWithStrand')
  .map(response => response.json())
  }

  apiSetDetails(id): Observable<any>{
  return this.http.get(this.global.api+'StudentPortal/SetDetails/'+id,this.global.option)
  .map(response => response.json())
  }

  apiAdmitStudentPost(idNumber,enrollmentsy,progid,year): Observable<any>{
  return this.http.post(this.global.api+'StudentPortal/AdmitStudent' ,{
        "idNumber": idNumber,
        "schoolYear": enrollmentsy,
        "programID": progid,
        "year": year,
        "type": 1,
        "isAdmittedOnline": true
    },this.global.option)
      .map(response => response.json())
  }
  apiAdmitEnrollStudent(headerId,idNumber,enrollmentsy,progid,year): Observable<any>{
    return this.http.post(this.global.api+'StudentPortal/AdmitEnrollStudent/'+headerId ,{
          "idNumber": idNumber,
          "schoolYear": enrollmentsy,
          "programID": progid,
          "year": year,
          "type": 1,
          "isAdmittedOnline": true
      },this.global.option)
        .map(response => response.json())
    }


  apiConflictSchedules(idNumber,codeno,day,time,enrollmentsy): Observable<any>{
  return this.http.get(this.global.api+'StudentPortal/ConflictSchedules/'+idNumber+'/'+codeno+'/'+day+'/'+time+'/'+enrollmentsy,this.global.option)
  .map(response => response.json())
  }

  apiEnrolledSubjectsCodeNo(codeno,enrollmentsy): Observable<any>{
  return this.http.get(this.global.api+'StudentPortal/EnrolledSubjects/Code No/'+codeno+'/'+this.global.enrollmentsy+'/true',this.global.option)
  .map(response => response.json())
  }

  apiEnrolledSubjectsPost(idNumber,codeNo,enrollmentsy): Observable<any>{
  return this.http.post(this.global.api+'StudentPortal/EnrolledSubjects/'+idNumber+'/'+ codeNo +'/'+ enrollmentsy,{},this.global.option)
  .map(response => response.json())
  }

  apiEnrolledSubjectsDelete(idNumber,codeNo,enrollmentsy): Observable<any>{
  return this.http.delete(this.global.api+'StudentPortal/EnrolledSubjects/'+idNumber+"/"+codeNo+"/"+enrollmentsy,this.global.option)
        .map(response => response.text())
  }

  apiEnrollmentHistoryDelete(enrollmentsy): Observable<any>{
  return this.http.delete(this.global.api+'StudentPortal/EnrollmentHistory/'+enrollmentsy,this.global.option)
          .map(response => response.json())
  }

  apiContactInfo(cno,tno,email,permNoStreet,permPSGC,currNoStreet,currPSGC): Observable<any>{
  return this.http.put(this.global.api+'StudentPortal/ContactInfo/'+this.global.userinfo.idNumber,{
          "mobileNo": cno,
          "telNo": tno,
          "emailAddress": email,
          "permAddressNoStreet": permNoStreet,
          "permAddressPSGC": permPSGC,
          "currAddressNoStreet": currNoStreet,
          "currAddressPSGC": currPSGC,
          "landLordLady": "",
          "boardingPhoneNo": ""
       },this.global.option)
         .map(response => response.json())
  }

  apiEncryptedString(): Observable<any>{
  return this.http.get(this.global.api+'StudentPortal/EncryptedString',this.global.option)
  .map(response => response.json())
  }


  apigetphpfileacctgapis(encryp): Observable<any>{


  return this.http.get(this.global.acctgApi+'getphpfile/acctgapis.php?action=VerifyPreEnrollment&en='+encodeURIComponent(encryp)+'&year='+encodeURIComponent(this.global.serverdate.substring(this.global.serverdate.length - 4)))
  .pipe(
    timeout(10000)
  ).map(response => response.json())
  }

  // .map(response => response.json())
  // }

  apiOnlineRegistrationApplicants(HSplacementyear,id): Observable<any>{
  return this.http.get(this.global.api+'OnlineRegistration/Applicants/'+HSplacementyear+'?idNumber='+id,this.global.option)
  .map(response => response.json())
  }



  apiPreEnrollmentSubmittedRequirementPut(
    idpicturevarsave,idPicture_Status,idPicture_Remarks,
    birthcertvarsave,birthCert_Status,birthCert_Remarks,
    reportCardSave,reportCard_Status,reportCard_Remarks,
    dSignsave,digitalSignature_Status,digitalSignature_Remarks,
    popsave,ProofOfPaymentStatus,proofOfPayment_Remarks,
    pdate,PaymentType): Observable<any>{
  return this.http.put(this.global.api+'StudentPortal/PreEnrollment/SubmittedRequirement/'+this.global.requestid()+'/'+this.global.colpreenrollmentyear,{
        "IdPicture": idpicturevarsave,
        "IdPictureStatus": idPicture_Status,
        "IdPictureRemarks": idPicture_Remarks,
        "BirthCert": birthcertvarsave,
        "BirthCertStatus": birthCert_Status,
        "BirthCertRemarks": birthCert_Remarks,
        "ProofOfPayment": popsave,
        "ProofOfPaymentStatus": ProofOfPaymentStatus,
        "ProofOfPaymentRemarks": proofOfPayment_Remarks,
        "DateOfPayment": pdate,
        "PaymentType": PaymentType,
        "reportCard": reportCardSave,
        "reportCardStatus": reportCard_Status,
        "reportCardRemarks": reportCard_Remarks,
        "signature": dSignsave,
        "signatureStatus": digitalSignature_Status,
        "signatureRemarks": digitalSignature_Remarks
      },this.global.option)
        .map(response => response.json())
  }

  apiPreEnrollmentSubmittedRequirementPost(
    IdNumber,
    SchoolYear,
    IdPicture,
    BirthCert,
    ReportCard,
    DigitalSignature,
    ProofOfPayment,
    DateOfPayment,
    PaymentType): Observable<any>{
      // console.log(SchoolYear)
      // console.log(DateOfPayment)
  return this.http.post(this.global.api+'StudentPortal/PreEnrollment/SubmittedRequirement',{
              "IdNumber": IdNumber,
              "SchoolYear": SchoolYear,
              "IdPicture": IdPicture,
              "BirthCert": BirthCert,
              "ProofOfPayment": ProofOfPayment,
              "DateOfPayment": DateOfPayment,
              "PaymentType": PaymentType,
              "reportCard": ReportCard,
              "signature": DigitalSignature
            },this.global.option)
              .map(response => response.json())
  }

 apiPlacementPut(
   ExamDate,
   PreferredCourse,
   AlternativeCourse,
   Level,
   VIT,
   NVIT,
   PreferredCourseId,
  AlternativeCourseId1,
  AlternativeCourseId2,
  ExemptionType,
  Strand,
  Result,
  GResult,
  TestSchedule,
  ExamRoom,
  ExamForSchoolYear,
  Elem_ExamResult,
  Elem_CourseId,
  Elem_Course,
  JHS_ExamResult,
  JHS_CourseId,
  JHS_Course,
  SHS_ExamResult,
  SHS_PriorityStrandId1,
  SHS_PriorityStrand1,
  SHS_PriorityStrandId2,
  SHS_PriorityStrand2){
  return this.http.put(this.global.api+'StudentPortal/Placement/'+this.global.requestid(),{
      "ExamDate": ExamDate,
      "PreferredCourse": PreferredCourse,
      "AlternativeCourse": AlternativeCourse,
      "Level": Level,
      "VIT": VIT,
      "NVIT":NVIT,
      "PreferredCourseId": PreferredCourseId,
      "AlternativeCourseId1": AlternativeCourseId1,
      "AlternativeCourseId2": AlternativeCourseId2,
      "ExemptionType":ExemptionType,
      "Strand": Strand,
      "Result": Result,
      "GResult":GResult,
      "TestSchedule":TestSchedule,
      "ExamRoom":ExamRoom,
      "ExamForSchoolYear":ExamForSchoolYear,
      "Elem_ExamResult": Elem_ExamResult,
      "Elem_CourseId":Elem_CourseId,
      "Elem_Course": Elem_Course,
      "JHS_ExamResult":JHS_ExamResult,
      "JHS_CourseId":JHS_CourseId,
      "JHS_Course": JHS_Course,
      "SHS_ExamResult":SHS_ExamResult,
      "SHS_PriorityStrandId1":SHS_PriorityStrandId1,
      "SHS_PriorityStrand1":SHS_PriorityStrand1,
      "SHS_PriorityStrandId2": SHS_PriorityStrandId2,
      "SHS_PriorityStrand2": SHS_PriorityStrand2
    },this.global.option)
      .map(response => response.json())
 }



  apiPublicAPIStrands(): Observable<any>{
  return this.http.get(this.global.api+'PublicAPI/Strands')
  .map(response => response.json())
  }

  apiStudentPortalEducBGDelete(id): Observable<any>{
  return this.http.delete(this.global.api+'StudentPortal/EducBG/'+id+'/',this.global.option)
  .map(response => response.json())
  }

  apiStudentPortalFamilyMemberDelete(id): Observable<any>{
  return this.http.delete(this.global.api+'StudentPortal/FamilyMember/'+id,this.global.option)
  .map(response => response.json())
  }

  apiStudentPortalPersonalInfoPut(
    numberOfSibling, birthOrder, skillTalent,
    contestToJoin, physicalDefect, healthProblem,
    medicalAdvise, nearestNeighbor, ethnicity,
    motherTongue, languageSpoken, generalAverage,
    neatScore, firstGenStudent, urbanRuralPoor, farmersFisherHousehold, ethnicity_Others, physicalDefect_Others, underPriviledged, coveredByMagnaCarta, dependentOfSoloParent, dependentOfSC): Observable<any> {
    return this.http.put(this.global.api + 'StudentPortal/PersonalInfo?', {
      "NumberOfSibling": parseInt(numberOfSibling),
      "BirthOrder": parseInt(birthOrder),
      "SkillTalent": skillTalent,
      "ContestToJoin": contestToJoin,
      "PhysicalDefect": physicalDefect,
      "HealthProblem": healthProblem,
      "MedicalAdvise": medicalAdvise,
      "NearestNeighbor": nearestNeighbor,
      "Ethnicity": ethnicity,
      "MotherTongue": motherTongue,
      "LanguageSpoken": languageSpoken,
      "GeneralAverage": generalAverage,
      "NEATScore": neatScore,
      "FirstGenStudent": firstGenStudent,
      "UrbanRuralPoor": urbanRuralPoor,
      "FarmersFisherHousehold": farmersFisherHousehold,
      "Ethnicity_Others": ethnicity_Others,
      "PhysicalDefect_Others": physicalDefect_Others,
      "underPriviledged": underPriviledged,
      "coveredByMagnaCarta": coveredByMagnaCarta,
      "dependentOfSoloParent": dependentOfSoloParent,
      "dependentOfSC": dependentOfSC
    }, this.global.option)
      .map(response => response.json())
  }
  apiStudentPortalPersonInfoPut(
    IDNumber,FirstName,MiddleName,
    LastName,SuffixName,PlaceOfBirth,
    Religion,DateOfBirth,Gender,
    CivilStatus,IDNo,MobileNo,
    TelNo,EmailAddress,Nationality): Observable<any>{
  return this.http.put(this.global.api+'StudentPortal/PersonInfo/',{
          "IDNumber": IDNumber,
          "FirstName": FirstName,
          "MiddleName": MiddleName,
          "LastName": LastName,
          "SuffixName": SuffixName,
          "PlaceOfBirth": PlaceOfBirth,
          "Religion": Religion,
          "DateOfBirth": DateOfBirth,
          "Gender": Gender,
          "CivilStatus": CivilStatus,
          "IDNo": IDNo,
          "MobileNo": MobileNo,
          "TelNo": TelNo,
          "EmailAddress": EmailAddress,
          "Nationality": Nationality,
        },this.global.option)
         .map(response => response.json())
    }

  apiStudentPortalSacramentsReceivedPut(
    baptism,confession,communion,
    confirmation,instruction): Observable<any>{
  return this.http.put(this.global.api+'StudentPortal/SacramentsReceived/' ,{
              "baptism": baptism,
              "confession":  confession,
              "communion":  communion,
              "confirmation":  confirmation,
              "instruction":  instruction
          },this.global.option)
              .map(response => response.json())
    }

  apiStudentPortalEducBGHSPut(sgfId,sgfsy,average,slaId,slaSy): Observable<any>{
    return  this.http.put(this.global.api+'StudentPortal/EducBGHS/',{
          "SGFId": sgfId,
          "SGFSy": sgfsy,
          "SGFAv": parseFloat(average),
          "SLAId": slaId,
          "SLASy": slaSy
        },this.global.option)
         .map(response => response.json())
    }
    apiStudentPortalEducSchoolTypePut(companyID,_bit): Observable<any>{
      return  this.http.put(this.global.api+'StudentPortal/Company/IsPrivate/'+companyID+'/'+_bit,{},this.global.option).map(response => response.json())
    }

  apiRetentionPolicyWholeSY(idNumber): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/RetentionPolicyWholeSY/'+idNumber,this.global.option)
    .map(response => response.json())
  }
  apiRetentionPolicySpecificSubjectType(idNumber): Observable<any>{
    return this.http.get(this.global.api+'StudentPortal/RetentionPolicySpecificSubjectType/'+idNumber,this.global.option)
    .map(response => response.json())
  }


  //#region //-----Faculty evaluation
    apiFacEvalSubjectsToEvaluateGet(): Observable<any>{
      var sy = this.global.schoolyear
      console.log('sy', sy);
      if(this.global.studinfo.level !='COLLEGE' && this.global.studinfo.level != 'GRADUATE SCHOOL')
        sy = this.global.schoolyear.substring(0,6);
      return this.http.get(this.global.api+'StudentPortal/FacultyEvaluation/StudentSubjectsToEvaluate/'+sy,this.global.option)
      .map(response => response.json())
    }

    apiFacEvaluatinSheetPost(facultyID,subject,section,codeNo,schedType): Observable<any>{
      var proglevel = this.global.studinfo.level
      var sy = this.global.schoolyear
      if(this.global.studinfo.level !='COLLEGE' && this.global.studinfo.level != 'GRADUATE SCHOOL')
        sy = this.global.schoolyear.substring(0,6);
      return this.http.post(this.global.api+'StudentPortal/FacultyEvaluation/EvaluationSheet/',{
        "idNumber": this.global.requestid(),
        "progLevel": proglevel,
        "schoolYear": sy,
        "facultyID": facultyID,
        "subject": subject,
        "section": section,
        "codeNo": codeNo,
        "schedType": schedType,
        "isActive": true
      },this.global.option)
            .map(response => response.json())
      }
    apiFacEvalQuestionsGet(id): Observable<any>{
        return this.http.get(this.global.api+'StudentPortal/EvaluationTool?id='+id,this.global.option)
        .map(response => response.json())
      }

    apiFacEvalSubmitAnswers(id,mainQuestionRate): Observable<any>{
      var sy = this.global.schoolyear
      if(this.global.studinfo.level !='COLLEGE' && this.global.studinfo.level != 'GRADUATE SCHOOL')
        sy = this.global.schoolyear.substring(0,6);
      return this.http.put(this.global.api+'StudentPortal/EvaluationSheetAnswerMain/'+id+'/'+mainQuestionRate+'/'+sy,{},this.global.option)
              .map(response => response.json())
      }

    apiFacEvalSubmitAdditionalAnswers(id,additionalQuestionRate): Observable<any>{
        var sy = this.global.schoolyear
        if(this.global.studinfo.level !='COLLEGE' && this.global.studinfo.level != 'GRADUATE SCHOOL')
          sy = this.global.schoolyear.substring(0,6);
        return this.http.put(this.global.api+'StudentPortal/EvaluationSheetAnswerAdditional/'+id+'/'+additionalQuestionRate+'/'+sy,{},this.global.option)
                .map(response => response.json())
      }
    apiFacEvalSubmitComment(id,comment): Observable<any>{
      var sy = this.global.schoolyear
      if(this.global.studinfo.level !='COLLEGE' && this.global.studinfo.level != 'GRADUATE SCHOOL')
        sy = this.global.schoolyear.substring(0,6);

      return this.http.put(this.global.api+'StudentPortal/EvaluationSheetStudent/'+id+'/'+sy,{
        "comments": comment
      },this.global.option)
              .map(response => response.json())
      }
  //#endregion


  apiStudentPortalgetParentInfoBG(pID): Observable<any> {
    return  this.http.get(this.global.api+'StudentPortal/Parent?parentId='+pID.toString(),this.global.option)
    .map(response => response.json())
  }


// ------------------------Mico/Enrollment/03/08/23-------------------//
  getDownpaymentStatus(): Observable<any> {
    return this.http.get(this.global.api + 'StudentPortal/PreEnrollmentPaymentVerfication', this.global.option)
    .map(response => response.json())
  }

//-----------------------------------------------//
//
  getEncryptedString(id){
    return this.http.get(this.global.api+'EmployeePortal/EncryptedString',this.global.option)
    .map(response => response.json())
  }
//
//-----------------------------------------------//
//
getStudentAssessment(schoolYear){
  return this.http.get(this.global.api+'StudentPortal/Assessment/'+schoolYear,this.global.option)
  .map(response => response.json())
}

getStudentDues(schoolYear){
  return this.http.get(this.global.api+'StudentPortal/DuesBreakdown/'+schoolYear,this.global.option)
  .map(response => response.json())
}

  getStudentClearance() {
    return this.http.get(this.global.api + 'StudentPortal/FinalsClearanceCheckList', this.global.option)
      .map(response => response.json())
  }
  //


  //Carl John
  getDisabilityTypes() {
    return this.http.get(this.global.api + 'StudentPortal/CONSTDisabilityTypes', this.global.option)
      .map(response => response.json())
  }

  getIndigenousPeopleAndCulturalCommunities() {
    return this.http.get(this.global.api + 'StudentPortal/CONSTIndigenousPeopleAndCulturalCommunities', this.global.option)
      .map(response => response.json())
  }
}