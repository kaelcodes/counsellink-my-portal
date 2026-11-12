import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http, Headers, RequestOptions } from '@angular/http';
import { SESSION_STORAGE, WebStorageService, LOCAL_STORAGE } from 'angular-webstorage-service';
import { MatDialog } from '@angular/material';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { DomSanitizer } from '@angular/platform-browser';
import Swal from 'sweetalert2';
const swal = Swal;
import { AnnouncementComponent } from './pages/announcement/announcement.component';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable()
export class GlobalService {
  token: any;
  role = '';
  basicedsy = '';

  loading = false;
  borrowRequestCount = 0;


  api = 'https://apidev.usl.edu.ph/api/'; // production server
  tokenID = "Ex1yk5S*9ceh"
  api2 = 'https://phpservices.usl.edu.ph/getphpfile/acctgapis.php/';
  acctgApi = 'https://phpservices.usl.edu.ph/';
  signalR_Api = "https://apidev.usl.edu.ph/api/notify"
  signalR_Notify_Api = "https://apidev.usl.edu.ph/api/notify"
  signalR_TechDesk_Api = "https://apidev.usl.edu.ph/api/techdesk"

  header = new Headers();
  option: any;
  idnumber = '';

  viewdomain = [];
  access = [];
  schoolyearsettings = null;

  wifi;
  image;
  filter;

  absenceCount = 0;

  sy = '';
  constSY = '';
  sydisplay;
  lastSYDisplay = '';
  nextSYDisplay = '';
  lastSYLevel = '';
  nextSYlevel = '';

  lastSYStudInfo;
  nextSYStudInfo;


  displaysem;
  userroles = [];

  userinfo;
  userdemog;
  studinfo;
  enrollment = -1;
  onlineEnrollment;

  familyarray = [];

  familyarrayinfo = []
  educarray = [];
  gradearray = [];
  ClassSchedule = [];
  HSClassSchedule = [];
  noHSClassSchedule = [];
  ExamSchedule = [];
  nextSYClassSchedule = [];


  noempHSClassSchedule = [];
  empHSClassSchedule = [];

  lockCodes = 1;
  setarray = [];

  // Removed unused employee/HR variables and arrays
  portaltext = '';

  majors = [];

  hsfirstyear = false;
  firstyearEnrollment = '';

  jhs_shs = [];
  oldjhs_shs = false;
  enrolloldhs = false;
  oldshs_col = false;
  oldshs_enroll = false;
  studentIsInList = false; //this variable is a boolean to check if the incoming first year belongs to the list given by SHS

  firstyear = false;
  strandfiltered = [];
  gsfirstyear = false;
  enrollmenthist = [];



  //employee and student classlist variables//myportal

  codeListArr = [];
  HScodeListArr = [];
  noclasslist = false;
  noHSclasslist = false;
  hsSY = '';
  sectionListArr = [];
  ActiveConfiguration = '';
  placement;
  currentplacementstatus = '';
  enrollmentype = 0;



  getplacement = false;
  getplacementshs = false;
  getplacementjhs = false;
  lastSY = '';
  nextSY = '';
  schoolyear
  serverdate = '';
  settings;

  colpreenrollment = false;
  jhspreenrollment = false;
  shspreenrollment = false;
  preenrollmenteligible = false;
  preenrollmenteligibleHS = false;
  preenrollmenteligibleElemToHS = false;

  colpreenrollmentyear = 'NoSY';
  HSplacementyear = 'NoSY';

  foreign = 0;
  BADGE = true;

  // foreign=0; // already declared above

  currentYear: number = new Date().getFullYear();
  selectedStudentAbsences = [];
  requiredDocuments = [
    {
      "otr": "0",
      "cnso": "0",
      "marriageContract": "False",
      "cForm138": "0"
    }
  ]
  hasAbsence$: any;

  besGlobalActiveSy = '202627'; // Default value for the active school year in BES Global
  empInfo: any;
  empBInfo: any;
  empPInfo: any;
  empChildren: any;
  empEducBcgArray: any;
  empWorkXP: any;
  empAppntmt: any;
  empContracts: any;
  empWorkXPArray: any;
  empchildArray: any;
  empEligArray: any;
  setactivesy: any;
  activesy: string;

  constructor(
    public dialog: MatDialog,
    @Inject(LOCAL_STORAGE) private storage: WebStorageService,
    private router: Router,
    private http: Http,
    private domSanitizer: DomSanitizer) {
    if (this.storage.get('token') != null) {
      this.requestToken(this.storage.get('token'));
    } else {

    }

  }



  private panelState = new BehaviorSubject<boolean>(false); // Default to false (collapsed)
  panelState$ = this.panelState.asObservable();

  setPanelState(isExpanded: boolean): void {
    this.panelState.next(isExpanded);
  }

  //check token session expiration
  getTokenStatus() {
    var jwtToken;
    var expires;
    var dateTimeNow
    if (this.getSession()) {
      jwtToken = JSON.parse(atob(this.getSession().split('.')[1]))
      expires = new Date(jwtToken.exp * 1000).toISOString()
      dateTimeNow = new Date().toISOString();
      if (dateTimeNow > expires) {
        //get refresh token
        //if refresh token getter message is expired, return true to logout user else, assign new token to session storage
        //if expired: res.message: "Expired refresh token"
        //else: res.token
        this.apiAuthRefreshToken(this.getSession())
          .subscribe(res => {

            if (!res.token) {
              this.logout();
              return true;
            } else {
              this.removeSession(); // destroys current session
              this.setSession(res.token);// assigns new token session
              this.requestToken(res.token); // assigns new header instance for api authorization
              return false;
            }
          }, Error => {
            this.swalAlertError(Error)
            console.log(Error)
          });

      } else
        return false;

    } else {
      // return false;
    }
  }

  resetthis() {
    this.hsfirstyear = false;
    this.oldjhs_shs = false;
    this.enrolloldhs = false;
    this.firstyear = false;
    this.oldshs_col = false;
    this.oldshs_enroll = false;
    this.getplacement = false;
    this.loading = false;
  }
  requestid() {
    return this.storage.get('id');
  }

  setdefaultvalidate(pw, vali, pwd = null) {
    this.storage.set('defaultpw', pw);
    if (vali == null) {
      this.storage.set('validated', false);
    } else {
      this.storage.set('validated', vali);
    }

    this.storage.set('pwd', pwd);
  }

  getvalidation() {
    var arr;
    arr = { dp: this.storage.get('defaultpw'), vali: this.storage.get('validated'), pwd: this.storage.get('pwd') };
    return arr;
  }

  setidname(val1) {
    this.storage.set('id', val1);
  }
  setrole(val1) {
    this.storage.set('role', val1);
  }
  requestrole() { return this.storage.get('role'); }

  requestToken(toks) {
    this.token = toks;
    this.header = new Headers();//re assign new instance for new header
    this.header.append('Content-Type', 'application/json');
    this.header.append('Authorization', 'Bearer ' + this.token);
    this.option = new RequestOptions({ headers: this.header });
    this.setSession(toks);
    return this.option;
  }

  swalAlert(title, text, type) {
    swal({
      type: type,
      title: title,
      html: text,
      allowEnterKey: false,
    },
    );
  }

  swalLoading(val) {
    swal({
      title: val, allowOutsideClick: false,
    });
    swal.showLoading();
  }

  swalClose() {
    swal.close();
  }

  swalAlertError(error = null) {
    if (error == null) {
      swal('Looks like the server is taking too long to respond, please try again later.', '', 'warning');
    } else {
      if (error.url == null) {
        swal('Looks like the server is taking too long to respond, please try again later.', '', 'warning');
      } else {
        swal('Looks like the server is taking too long to respond, please try again later.', '' + 'Error reference: (' + error.status + ') ' + error.statusText + '<br>Target: ' + error.url.replace(this.api, ''), 'warning');
      }
    }

  }

  setSession(val) {
    this.storage.set('token', val);
  }

  getSession() {
    return this.storage.get('token');
  }

  removeSession() {
    this.storage.remove('token');
  }

  logout() {
    let timerInterval;
    swal({
      allowOutsideClick: false,
      title: 'Auto close alert!',
      html: 'You will be Logged out from the system.',
      timer: 2000,
      onOpen: () => {
        swal.showLoading();
        timerInterval = setInterval(() => {
        }, 100);
      },
      onClose: () => {
        clearInterval(timerInterval);
      }
    }).then((result) => {
      if (
        // Read more about handling dismissals
        result.dismiss === swal.DismissReason.timer
      ) {
        this.storage.remove('token');
        this.storage.remove('id');
        this.storage.remove('role');
        window.location.reload();
      }
    });
  }

  swalSuccess(bat) {
    swal({
      type: 'success',
      title: bat,
      showConfirmButton: false,
      timer: 1500
    });
  }

  getaccess(x) {
    for (var i = 0; i < x.length; ++i) {
      for (var u = 0; u < x[i].accessRights.length; ++u) {
        for (var n = 0; n < x[i].accessRights[u].actions.length; ++n) {
          if (!this.access.includes(x[i].accessRights[u].actions[n].id)) {
            this.access.push(x[i].accessRights[u].actions[n].id);
          }
        }
      }
    }
  }
  viewdomainname = [];
  getdomain(x) {
    if (x != undefined && x != null) {
      for (var i = 0; i < x.length; ++i) {
        if (!this.viewdomain.includes(x[i].departmentId)) {
          this.viewdomain.push(x[i].departmentId);
        }
      }
    }

    if (x != undefined && x != null) {
      for (var i = 0; i < x.length; ++i) {
        if (!this.viewdomainname.includes(x[i].departmentCode)) {
          this.viewdomainname.push(x[i].departmentCode);
        }
      }
    }
  }

  checkdomain(x) {
    if (this.viewdomain.includes(x)) {
      return true;
    }
    return false;
  }

  checkaccess(x) {
    if (this.access.includes(x)) {
      return true;
    }
    return false;
  }

  syDisplay(x) {
    var y = x.substring(0, 4);
    var z = parseInt(y) + 1;
    var a = y.toString() + ' - ' + z.toString();
    var b = x.substring(6, 7);
    var c;
    if (b == 1) {
      c = '1st Semester';
    } else if (b == 2) {
      c = '2nd Semester';
    } else if (b == 3) {
      c = 'Summer';
    } else {
      c = '';
    }
    return c + ' SY ' + a;
  }

  sysettingsarray = [];
  enrollmentsy = '';
  year;

  getCurrentServerTime() {
    this.apiPublicAPICurrentServerTime()
      .subscribe(res => {
        var today: any = new Date(res.data);
        var dd = String(today.getDate() - 1).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        today = mm + '/' + dd + '/' + yyyy;
        this.serverdate = today;
        return this.serverdate
      });
  }



  getallapi(z, message) {
    this.swalLoading('loading student information');
    var dt = new Date();
    this.year = dt.getFullYear().toString();
    this.apiPublicAPISYOptionsList()
      .subscribe(res => {
        this.sysettingsarray = res.data;
        this.sysettings = [];
        this.loopsysetting(0, res.data, z, message);  //loop to find latest open enrollment setting
      }, Error => {
        this.logout();
      });
  }

  shsGrade11Enrollment = 0;
  shsEnrollment = 0;
  jhsGrade7Enrollment = 0;
  jhsEnrollment = 0;

  hsEnrollment = 0;
  requireAdmission = 0;

  sysettings;
  studOtherInfo = '';
  // activeSYsettingsSY;

  // insider g12 to college parameters-------------------------- 02/23/2023
  g12CurrentYearLevel = 0;
  g12EnrollmentStatus = '';
  g12CourseCode = '';
  g12ToCollegeG12Data;
  g12ToCollegeCollegeData;
  // ----------------------------------------------------------


  loopsysetting(limit, array, z, message) {
    if (limit < 6) {
      // this.activeSYsettingsSY = array[limit].syWithSem;
      this.apiSYSettings(array[limit].syWithSem)
        .subscribe(res => {
          this.sysettings.push(res.data);
          this.loopsysetting(limit + 1, array, z, message);
        }, Error => {
          this.logout();
        });
    } else {
      this.enrollmentsy = 'none';
      this.onlineEnrollment = 0;
      this.loaddata(z, message);
    }
  }

  electivesy = '';
  checksettings(x) {

    for (var i = 0; i < this.settings.length; ++i) {
      if (x === this.settings[i].code && this.settings[i].status == 1) {
        return true;
      }
    }
    return false;
  }
  checksettingsgetyear(x) {
    for (var i = 0; i < this.settings.length; ++i) {
      if (x === this.settings[i].code && this.settings[i].status == 1) {
        return this.settings[i].name.split(' ')[this.settings[i].name.split(' ').length - 1];
      }
    }
    return 'NoSY';
  }

  notifSHSTrigger = false;

  loaddata(z, message) {
    this.resetthis();
    this.image = 'assets/noimage.jpg';
    var that = this;


    this.apiOnlineRegistrationSettings().subscribe(res => {
      this.settings = res.data;
      CurrentServerTime()////FUNCTION
    }, Error => {
      this.swalAlertError();
      this.logout();
    });

    function CurrentServerTime() {//get the current server time


      that.apiPublicAPICurrentServerTime()
        .subscribe(res => {
          var today: any = new Date(res.data);
          var dd = String(today.getDate()).padStart(2, '0');
          var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
          var yyyy = today.getFullYear();
          today = mm + '/' + dd + '/' + yyyy;
          that.serverdate = today;
          ActiveConfiguration();
        }, Error => {
          that.swalAlertError();
          that.logout();
        });
    }

    function ActiveConfiguration() {
      //get the current active configuration
      that.apiActiveConfiguration().subscribe(res => {
        that.ActiveConfiguration = res.data.schoolYear;
        that.sy = res.data.schoolYear;
        that.constSY = res.data.schoolYear;
        that.sydisplay = that.syDisplay(res.data.schoolYear);

        // Removed commented-out code for test school year assignment


        CheckPlacement();
      }, Error => {
        that.swalAlertError();
        that.logout();
      });
    }

    function CheckPlacement() {
      //check and get placement base in student's yearlevel
      that.apiPlacement().subscribe(res => {
        that.colpreenrollmentyear = that.checksettingsgetyear('ColPreEnroll');
        that.HSplacementyear = that.checksettingsgetyear('USL_SHS_PreEnrollment');

        if (that.HSplacementyear == 'NoSY') {
          that.HSplacementyear = that.checksettingsgetyear('USL_JHS_PreEnrollment');
        }
        that.placement = res.data;
        if (that.placement.examForSchoolYear == null) {
          that.placement.examForSchoolYear = '';
        }

        if (res.data.elem_CourseId != '' && res.data.elem_CourseId != null) {
          that.currentplacementstatus = 'ELEM';
        }

        if (res.data.jhS_CourseId != '' && res.data.jhS_CourseId != null) {
          that.currentplacementstatus = 'JHS';
        }

        if (res.data.shS_PriorityStrandId1 != '' && res.data.shS_PriorityStrandId1 != null) {
          that.currentplacementstatus = 'SHS';
        }

        if (res.data.preferredCourseId != '' && res.data.preferredCourseId != null) {
          that.currentplacementstatus = 'COLLEGE';
        }
        that.getplacement = false;
        if (res.data != null && (res.data.result === 'P' || res.data.result === 'R')) {
          const { preferredCourseId, examForSchoolYear, shS_PriorityStrandId1, jhS_CourseId } = res.data;
          // Check college placement
          if (preferredCourseId && examForSchoolYear === that.colpreenrollmentyear) {
            that.getplacement = true;
          }
          // Check SHS placement
          const examYear = examForSchoolYear.length > 6 ? examForSchoolYear.substring(0, 6) : examForSchoolYear;
          if (examYear === that.HSplacementyear && shS_PriorityStrandId1) {
            that.getplacementshs = true;
          }
          // Check JHS placement
          if (examForSchoolYear === that.HSplacementyear && jhS_CourseId) {
            that.getplacementjhs = true;
          }
        }

        if (res.data.examForSchoolYear != null) {
          if (res.data.result == 'P' && res.data.examForSchoolYear === that.colpreenrollmentyear && res.data.preferredCourseId != null && res.data.preferredCourseId != '') {
            that.colpreenrollment = that.checksettings('ColPreEnroll');
          }
          if (res.data.result == 'R' && res.data.examForSchoolYear === that.colpreenrollmentyear && res.data.gResult != null && res.data.gResult != '') {
            that.colpreenrollment = that.checksettings('ColPreEnroll');
          }
        }

        that.jhspreenrollment = that.checksettings('USL_JHS_PreEnrollment');

        that.shspreenrollment = that.checksettings('USL_SHS_PreEnrollment');

        for (var i = 0; i < that.settings.length; ++i) {
          if ('USLJHSElective' === that.settings[i].code && that.settings[i].status == 1) {
            that.electivesy = that.settings[i].description.slice(that.settings[i].description.length - 6);
          }
        } //get the active year in elective
        GetEnrollmentHistory();
      }, Error => {
        that.swalAlertError();
        that.logout();
      });
    }

    function GetEnrollmentHistory() {
      //Enrollment History
      //Student Information
      that.schoolyear = that.sy;
      that.apiEnrollmentHistory().subscribe(res => {
        that.enrollmenthist = res.data;
        //---find shs record: for documents notification
        const findSHS = res.data.filter(hist => hist.programLevel == 20 && hist.yearOrGradeLevel == 6)
        if (findSHS.length > 0)
          that.notifSHSTrigger = true
        else
          that.notifSHSTrigger = false
        // /\find shs record: for documents notification


        if (that.enrollmenthist.length > 0) {

          if (that.enrollmenthist[that.enrollmenthist.length - 1].programLevel < 30) {
            that.schoolyear = that.sy.substring(0, that.sy.length - 1);
          }
          if (parseInt(that.schoolyear) <= parseInt(that.enrollmenthist[that.enrollmenthist.length - 1].schoolYear)) {
            that.schoolyear = that.enrollmenthist[that.enrollmenthist.length - 1].schoolYear;

            //logic for getting the two schoolyear if student is a usl graduate. lastSYStudInfo | nextSYStudInfo
            that.apiStudentInfo(that.constSY).subscribe(res => {
              that.lastSYStudInfo = res.data;

              if (res.data.departmentCode == 'HS') {
                that.lastSYLevel = 'G' + (parseInt(res.data.yearOrGradeLevel) + 6);
                that.lastSYDisplay = that.syDisplay(that.constSY.substring(0, that.sy.length - 1))
              }
              else {
                that.lastSYDisplay = that.syDisplay(that.constSY)
                that.lastSY = res.data.enrollmentStatus;
              }
              that.foreign = res.data.foreign === null ? false : res.data.foreign;
            });

            that.apiStudentInfo(that.schoolyear).subscribe(res => {
              that.nextSYStudInfo = res.data;
              if (res.data.departmentCode == 'HS')
                that.nextSYlevel = res.data.course + ' - G' + (parseInt(res.data.yearOrGradeLevel) + 6);
              else
                that.nextSYlevel = res.data.course + ' - ' + res.data.yearOrGradeLevel;




              that.nextSYDisplay = that.syDisplay(that.schoolyear)
              that.nextSY = res.data.enrollmentStatus;
              that.foreign = res.data.foreign === null ? false : res.data.foreign;
            });
            //logic for getting the two schoolyear if student is a usl graduate. lastSYStudInfo | nextSYStudInfo
          } else {
            that.apiStudentInfo(that.enrollmenthist[that.enrollmenthist.length - 1].schoolYear).subscribe(res => {
              that.lastSY = res.data.enrollmentStatus;
              that.foreign = res.data.foreign === null ? false : res.data.foreign;
            });
          }
        }

        // Removed commented-out code for old enrollment history logic
        GetStudInfo(that.constSY);//FUNCTION
        // GetStudInfo(that.schoolyear);//FUNCTION

      }, Error => {
        that.swalAlertError();
        that.logout();
      });
    }

    function getG12toCollegeData(sy) {
      that.apiStudentInfo(sy).subscribe(res => {
        return res.data
      });
    }

    function set_Insider_G12_to_College_Parameters(studinfo) {

      that.g12CurrentYearLevel = studinfo.yearOrGradeLevel;
      that.g12CourseCode = studinfo.courseCode;
      that.g12EnrollmentStatus = studinfo.enrollmentStatus;
    }

    function GetStudInfo(schoolyear) {
      //Student Information
      //Placement
      //Curriculum
      //Course Majors
      //demography

      var requestedID = that.requestid();
      that.apiStudentInfo(schoolyear).subscribe(res => {
        that.enrollmentype = res.data.enrollmentType;
        that.image = that.domSanitizer.bypassSecurityTrustUrl('data:image/jpeg;base64,' + res.data.idPicture);
        that.studinfo = res.data;
        if (that.getplacement && res.data.enrollmentStatus == 'For Admission') {
          that.firstyear = true;
        }
        const activeOnlineEnrollmentSetting = (that.sysettings && that.sysettings.find((s: any) => s && s.onlineEnrollment == 1)) || null;
        const activeOnlineEnrollmentSY = activeOnlineEnrollmentSetting ? activeOnlineEnrollmentSetting.schoolYear : null;


        if ((that.placement.examForSchoolYear == activeOnlineEnrollmentSY) && that.studinfo.new == true && that.placement.preferredCourseId != null && that.placement.preferredCourseId != '' && (that.placement.result == 'P' || that.placement.result == 'R')) {
          that.firstyear = true;
        }
        if ((that.studinfo.departmentCode == 'HS' && that.studinfo.yearOrGradeLevel == 6)) { //usl g12 to college
          //-------------bypass checking of usl g12 to incoming 1st year college


          if (schoolyear.substring(0, 6) == that.schoolyear) {
            that.apiStudentInfo(that.sysettings[0].schoolYear).subscribe(res => {

              that.nextSYStudInfo = res.data;

              if (res.data.departmentCode == 'HS')
                that.nextSYlevel = res.data.course + ' - G' + (parseInt(res.data.yearOrGradeLevel) + 6);
              else
                that.nextSYlevel = res.data.course + ' - ' + res.data.yearOrGradeLevel;

              that.nextSYDisplay = that.syDisplay(that.schoolyear)
              that.nextSY = res.data.enrollmentStatus;

              if (that.checksettings('ColPreEnroll') && that.studinfo.yearOrGradeLevel == 6 && that.studinfo.courseCode == 'SHS' && that.nextSYStudInfo.enrollmentStatus == 'For Admission') {
                that.oldshs_col = true;
                that.oldshs_enroll = true;
                that.firstyear = true;
                //codes for pre-enrollment process/logic for old shs g12 to 1st year college
                that.studentIsInList = true;

              } else {
                that.oldshs_col = false;
              }
            });
          }

          // Removed commented-out code for excel-based G12 to college checking
        } else if (that.getplacementjhs) {
          that.hsfirstyear = true;
        } else if (that.getplacementshs) {
          that.hsfirstyear = true;
          that.oldjhs_shs = true;
        } else if (that.studinfo.yearOrGradeLevel == 4 && that.studinfo.departmentCode == 'HS' && that.studinfo.enrollmentStatus == 'Paid') {
          that.oldjhs_shs = true
        }
        if (that.studinfo.course == '' || that.studinfo.course == null || that.studinfo.course == undefined || (that.getplacement && !that.firstyear)) {
          if (that.studinfo.enrollmentStatus != 'Paid' && that.studinfo.lastSY != schoolyear) {//added this condition to filter transferee that has placement record
            that.apiPlacement().subscribe(async res => {
              if (that.getplacement) {
                if (await that.checkEnrollmentHistory(50, 1) == false) {
                  that.firstyear = true;
                  that.studinfo.yearOrGradeLevel = 1;
                  if (res.data.gResult == null || res.data.gResult == '' || res.data.gResult == ' ' || res.data.result == 'P') {
                    that.studinfo.programID = res.data.preferredCourseId;
                  } else {
                    that.studinfo.programID = res.data.gResult;
                  }
                  if (res.data.result != 'F') {
                    that.apiCurriculum(that.studinfo.programID).subscribe(res => {
                      if (res.data == null) {
                        that.studinfo.programID = res.data.preferredCourseId;

                        that.apiCurriculum(that.studinfo.programID)
                          .subscribe(res => {


                            that.studinfo.course = res.data.courseCode;
                            var tempcourse = that.studinfo.course.replace('/', '-');
                            that.apiCourseMajors(tempcourse)
                              .subscribe(res => {
                                that.majors = [];
                                for (var i2 = 0; i2 < res.data.length; ++i2) {
                                  if (res.data[i2].major != '') {
                                    that.majors.push(res.data[i2]);
                                  }
                                }
                              });
                          });
                      } else {
                        that.studinfo.course = res.data.courseCode;
                        var tempcourse = that.studinfo.course.replace('/', '-');
                        that.apiCourseMajors(tempcourse)
                          .subscribe(res => {
                            that.majors = [];
                            for (var i2 = 0; i2 < res.data.length; ++i2) {
                              if (res.data[i2].major != '') {
                                that.majors.push(res.data[i2]);
                              }
                            }
                          });
                      }
                    });
                  }
                  else
                    that.firstyear = false;
                } else {

                  that.studinfo.yearOrGradeLevel = 0;
                }

              } else if (res.data.shS_PriorityStrandId1 != null && res.data.shS_PriorityStrandId1 != '' || that.getplacementshs) {
                that.hsfirstyear = true;
                that.studinfo.programID = res.data.shS_PriorityStrandId1;
                that.apiCurriculum(res.data.shS_PriorityStrandId1)
                  .subscribe(res => {
                    that.studinfo.course = res.data.courseCode;
                    that.studinfo.major = res.data.abbreviatedMajor;
                  });
                that.studinfo.yearOrGradeLevel = 5;
                that.studinfo.departmentCode = 'HS';
              } else if ((res.data.jhS_CourseId != null && res.data.jhS_CourseId != '' || that.getplacementjhs)) {
                that.hsfirstyear = true;
                that.studinfo.programID = res.data.jhS_CourseId;
                that.studinfo.course = res.data.courseCode;
                that.studinfo.yearOrGradeLevel = 1;
                that.studinfo.departmentCode = 'HS';
              } else {

              }
            });
          }

        } else if (that.studinfo.departmentCode == 'HS' && that.studinfo.yearOrGradeLevel == 4) {
          that.enrolloldhs = true;
        } else {

        }
        Demography(schoolyear);////////////FUNCTION
      }, Error => {
        that.swalAlertError();
        that.logout();
      });
    }

    function Demography(schoolyear) {
      //Demography
      //Person Info
      //Education Background
      //Family Background
      //Academic History
      //Class Schedule
      //Exam Schedule
      //Retention Policy
      that.apiDemography(that.schoolyear).subscribe(res => {
        that.userdemog = res.data;

        if (res.data.civilStatus == 'M')
          that.requiredDocuments[0].marriageContract = res.data.marriageContract;


        that.requiredDocuments[0].cnso = res.data.cnso;
        that.requiredDocuments[0].cForm138 = res.data.cForm138;
        that.requiredDocuments[0].otr = res.data.otr;


        that.apiPersonInfo().subscribe(res => {
          that.userinfo = res.data;


          that.wifiget(res.data.idNumber, 'StudentPortal');
          that.apiEducBackground(that.userinfo.idNumber).subscribe(res => {
            that.educarray = res.data;
            that.apiFamilyBackground(that.userinfo.idNumber).subscribe(res => {
              that.familyarray = res.data;
              that.apiAcademicHistory(that.requestid()).subscribe(res => {

                that.gradearray = res.data;
                var syear = '';
                if (that.enrollmenthist.length > 0)
                  syear = that.enrollmenthist[that.enrollmenthist.length - 1].schoolYear

                that.apiClassSchedule(that.requestid(), syear).subscribe(res => {
                  that.ClassSchedule = res.data;
                  that.apiExamSchedule(that.requestid()).subscribe(res => {
                    that.ExamSchedule = res.data;
                    that.apiOtherInfo(that.requestid()).subscribe(res => {
                      that.studOtherInfo = res.data;
                      //#region student absences logic

                      //#endregion
                      RetentionPolicy(schoolyear);///////////////////////FUNCTION
                    }, Error => {
                      that.swalAlertError();
                      that.logout();
                    });
                  }, Error => {
                    that.swalAlertError();
                    that.logout();
                  });
                }, Error => {
                  that.swalAlertError();
                  that.logout();
                });
              }, Error => {
                that.swalAlertError();
                that.logout();
              });
            }, Error => {
              that.swalAlertError();
              that.logout();
            });
          }, Error => {
            that.swalAlertError();
            that.logout();
          });
        }, Error => {
          that.swalAlertError();
          that.logout();
        });
      }, Error => {
        that.swalAlertError();
        that.logout();
      });
    }

    function RetentionPolicy(schoolyear) {//checks the retention policy for the student then proceeds to API header setting

      that.apiRetentionPolicyLastSY(that.userinfo.idNumber).subscribe(res => {
        that.filter = res.data;
        if (that.firstyear) { //that loop is for selecting freshmen enrollment SY
          for (var i3 = 0; i3 < that.sysettings.length; ++i3) {

            if (that.sysettings[i3].enrollment != -1) {
              that.enrollmentsy = that.sysettings[i3].schoolYear; // enrollment SY for first year second sem enrollment
            }

            if (that.sysettings[i3].onlineEnrollment == 1) {
              that.enrollmentsy = that.sysettings[i3].schoolYear;
              that.onlineEnrollment = that.sysettings[i3].onlineEnrollment;
              break;
            }
          }

        }
        else if (that.hsfirstyear) { //that loop is for selecting HS freshmen enrollment SY
          for (i3 = 0; i3 < that.sysettings.length; ++i3) {
            if (that.sysettings[i3].jhsGrade7Enrollment == 1 && (that.currentplacementstatus == 'JHS')) {
              that.enrollmentsy = that.sysettings[i3].schoolYear;
              that.jhsGrade7Enrollment = that.sysettings[i3].jhsGrade7Enrollment;
              break;
            }
            if (that.sysettings[i3].shsGrade11Enrollment == 1) {
              that.enrollmentsy = that.sysettings[i3].schoolYear;
              that.shsGrade11Enrollment = 1;
              break;
            }
          }
        } else if (that.oldjhs_shs) { //that loop is for selecting SHS freshmen from USL JHS | enrollment SY
          for (i3 = 0; i3 < that.sysettings.length; ++i3) {
            if (that.sysettings[i3].shsGrade11Enrollment == 1) {
              that.enrollmentsy = that.sysettings[i3].schoolYear;
              that.shsGrade11Enrollment = 1;
              break;
            }
          }
        }
        else if (that.studinfo.departmentCode == 'HS') {
          for (i3 = 0; i3 < that.sysettings.length; ++i3) {
            if (that.sysettings[i3].hsEnrollment == 1 && that.studinfo.yearOrGradeLevel < 5) {
              that.enrollmentsy = that.sysettings[i3].schoolYear;
              that.hsEnrollment = that.sysettings[i3].hsEnrollment;
              break;
            }
            if (that.sysettings[i3].shsEnrollment == 1 && that.studinfo.yearOrGradeLevel == 5) {
              that.enrollmentsy = that.sysettings[i3].schoolYear;
              that.shsEnrollment = that.sysettings[i3].shsEnrollment;
              break;
            }
          }
        } else {
          for (i3 = 0; i3 < that.sysettings.length; ++i3) {
            if (that.sysettings[i3].enrollment != -1) {
              that.enrollmentsy = that.sysettings[i3].schoolYear;
              that.enrollment = that.sysettings[i3].shsEnrollment;
              that.lockCodes = that.sysettings[i3].lockCodes;
              // that.requireAdmission = that.sysettings[i3].requireAdmission;
              break;
            }
          }
          for (let data of that.sysettings) {
            if (data.requireAdmission == 1 || data.requireAdmission == 0) {
              that.requireAdmission = data.requireAdmission;
            }
          }
          if (that.checkEnrollmentHistoryForLevel(50)) { //check if the student has enrollment history for the level 50 (college) 2nd semester
            for (let data of that.sysettings) {
              if (data.enrollment != -1 && data.requireAdmission != -1) {
                that.enrollmentsy = data.schoolYear;
                that.requireAdmission = data.requireAdmission;
                that.enrollment = data.shsEnrollment;
                that.lockCodes = data.lockCodes;
                break;
              }
            }
          }
        }
        that.preenrollmenteligible = false;
        that.preenrollmenteligibleHS = false;
        for (var j = 0; j < that.enrollmenthist.length; ++j) {

          if (that.getPreviousSem(that.colpreenrollmentyear) == that.enrollmenthist[j].schoolYear &&
            that.enrollmenthist[j].status == 'PAID' && (that.enrollmenthist[j].yearOrGradeLevel == 6)) {

            that.preenrollmenteligible = true;

          }

          if (that.getPreviousSem(that.HSplacementyear) == that.enrollmenthist[j].schoolYear &&
            that.enrollmenthist[j].status == 'PAID' && (that.enrollmenthist[j].yearOrGradeLevel == 4)
          ) {
            that.preenrollmenteligibleHS = true;
          }
        }

        if (that.studinfo.yearOrGradeLevel == 6) {
          set_Insider_G12_to_College_Parameters(that.studinfo);
        }

        SetAPIHeaders(schoolyear);//FUNCTION
      }, Error => {
        that.swalAlertError();
        that.logout();
      });
    }
    function SetAPIHeaders(schoolyear) {
      //sets the API Headers
      //Gets Student info
      //Gets Class Schedule
      that.apiSetHeaders(that.enrollmentsy).subscribe(res => {
        that.setarray = res.data;
        if (that.sy == that.colpreenrollmentyear || that.sy.substring(0, 6) == that.HSplacementyear) {
          that.enrollmentsy = that.sy;
        }

        if (
          that.studinfo.enrollmentStatus == 'Paid' &&
          that.enrollment != -1 &&
          !that.firstyear &&
          that.studinfo.departmentCode != 'ELEM' &&
          that.studinfo.departmentCode != 'HS' &&
          that.studinfo.departmentCode != 'GS') {
          that.sy = that.enrollmentsy;

        }
        // if (that.enrollmentsy == that.sy || that.studinfo.enrollmentStatus == 'Admitted')
        var status = that.studinfo.enrollmentStatus;
        if (that.oldshs_col)
          status = that.nextSYStudInfo.enrollmentStatus
        if (status == 'Admitted') {
          that.apiStudentInfo(schoolyear).subscribe(res => {
            if (that.studinfo.enrollmentStatus == 'Paid' && res.data.enrollmentStatus == 'For Admission' && !that.firstyear
              &&
              that.studinfo.departmentCode != 'ELEM' &&
              that.studinfo.departmentCode != 'HS' &&
              that.studinfo.departmentCode != 'GS') {
              that.sy = that.enrollmentsy;
              that.studinfo = res.data;
              that.enrollmentype = res.data.enrollmentType;
            }
            if ((res.data.enrollmentStatus == 'Admitted' || res.data.enrollmentStatus == 'Paid') || that.oldshs_col) {
              that.studinfo = [];
              that.sy = that.enrollmentsy;
              that.studinfo = res.data;
              that.enrollmentype = res.data.enrollmentType;
              that.apiClassSchedule(that.requestid(), that.enrollmentsy).subscribe(res => {
                that.ClassSchedule = res.data;
              });
              that.sydisplay = that.syDisplay(schoolyear);
            }
          });

          that.swalClose();
          that.loading = true;
          that.router.navigate(['../main', { outlets: { div: 'personal-data' } }]);
          if (z == 0) {
            that.openDialogAnnouncement();
          }
          else if (z == 1) {//message : g12 to 1st year college: Insiders
            // that.swalAlert(message+' Your subject registration is successful. You may now settle your down payment to be officially enrolled. Thank you.', 'You may now proceed to your designated program chair for printing of your enrollment form or go to enrollment and click the enrollment form button.', 'success');
            that.swalAlert(message, 'You are now <strong>CONDITIONALLY ENROLLED</strong><br> Go to Enrollment link and print your <span style="font-style: italic">Personal Information Sheet</span> and <span style="font-style: italic">Enrollment Form</span> and submit to the REGISTRAR with your required documents for you to be <strong>officially enrolled.</strong>', 'success');
          }
          else if (z == 2) {
            that.swalAlert('Your online admission is successful.', '<p><b>*NOTE:</b><br>You are now <b>CONDITIONALLY ENROLLED</b><br>Print your Enrollment form and submit to the Senior High School Office with your required documents for you to be <strong>officially enrolled.</strong><br><br><i>Failure to submit enrolment requirements will result to forfeiture of enrollment</i></p>', 'success');
          } else if (z == 3) {
            that.swalAlert('Your online admission is successful.', '<p><b>*NOTE:</b><br>You are now <b>CONDITIONALLY ENROLLED</b><br>Print your Enrollment form and submit to the Junior High School Office with your required documents for you to be <strong>officially enrolled.</strong><br><br><i>Failure to submit enrolment requirements will result to forfeiture of enrollment</i></p>', 'success');
          } else if (z == 4) {
            that.swalAlert('Your online admission is successful.', 'Please download and print your enrolment form and present this to the cashier/bank teller when you pay your down payment.<br>Please settle your downpayment within five working days to be officially enrolled.', 'success');
          }
          // if (z == 0){that.modality();}
        }
        else {
          that.swalClose();
          that.router.navigate(['../main', { outlets: { div: 'personal-data' } }]);
          that.loading = true;
          if (z == 0) {
            that.openDialogAnnouncement();
          } else if (z == 1) {
            // that.swalAlert('Your subject registration is successful. You may now settle your down payment to be officially enrolled. Thank you.', 'You may now proceed to your designated program chair for printing of your enrollment form or go to enrollment and click the enrollment form button.', 'success');
            that.swalAlert(message, 'You are now <strong>CONDITIONALLY ENROLLED</strong><br> Go to Enrollment link and print your <span style="font-style: italic">Personal Information Sheet</span> and <span style="font-style: italic">Enrollment Form</span> and submit to the REGISTRAR with your required documents for you to be <strong>officially enrolled.</strong>', 'success');
          } else if (z == 2) {
            that.swalAlert('Your online admission is successful.', '<p><b>*NOTE:</b><br>You are now <b>CONDITIONALLY ENROLLED</b><br>Print your Enrollment form and submit to the Senior High School Office with your required documents for you to be <strong>officially enrolled.</strong><br><br><i>Failure to submit enrolment requirements will result to forfeiture of enrollment</i></p>', 'success');

            // that.swalAlert('Your online admission is successful.', 'Please download and print your enrolment form and present this to the cashier/bank teller when you pay your down payment.<br>Please settle your downpayment within five working days to be officially enrolled.', 'success');
          } else if (z == 3) {
            that.swalAlert('Your online admission is successful.', '<p><b>*NOTE:</b><br>You are now <b>CONDITIONALLY ENROLLED</b><br>Print your Enrollment form and submit to the Junior High School Office with your required documents for you to be <strong>officially enrolled.</strong><br><br><i>Failure to submit enrolment requirements will result to forfeiture of enrollment</i></p>', 'success');
          } else if (z == 4) {
            that.swalAlert('Your online admission is successful.', 'Please download and print your enrolment form and present this to the cashier/bank teller when you pay your down payment.<br>Please settle your downpayment within five working days to be officially enrolled.', 'success');
          }

          // if (z == 0) {
          //   that.modality();
          // }
        }
      }, Error => {
        that.swalAlertError();
        that.logout();
      });
    }
  }
  openDialogAnnouncement(): void {
    const dialogRef = this.dialog.open(AnnouncementComponent, {
      width: '90%', disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {

      if (
        this.studinfo.level === 'COLLEGE' &&
        !this.enrollmenthist.some(hist => hist.schoolYear === String(this.schoolyear))
      ) {
        return;
      }



      if (result != undefined) {
        if (result.result == 'saved') {
        }
      }
    });
  }




  wifiget(x, y) {
    this.http.get(this.api + y + '/WifiStatus/' + x, this.option)
      .map(response => response.json())
      .subscribe(res => {
        this.wifi = res.data;
        if (this.wifi == null || this.wifi == undefined) {
          this.wifi = {
            "password": '',
            "lastLogin": "",
            "userCredit": 0
          }
        }
      }, Error => {
        this.swalAlertError();
        this.logout();
      });
  }


  getactiveOnline(x) {

  }

  modality() {
    if (
      ((this.studinfo.enrollmentStatus != 'For Admission' &&
        this.studinfo.departmentCode == 'HS') ||

        (this.studinfo.enrollmentStatus == 'Paid' &&
          this.studinfo.departmentCode != 'HS' &&

          this.studinfo.departmentCode != 'ELEM' &&
          this.studinfo.departmentCode != 'GS')) && this.sy.substring(0, 6) == this.HSplacementyear) {

      //&&this.serverdate<'02/04/2021'
      var sy = this.sy;
      if (this.studinfo.departmentCode == 'ELEM' || this.studinfo.departmentCode == 'HS') {
        sy = this.sy.substring(0, 6);
      }

      this.apiPreferredLearningModality(sy)
        .subscribe(ress => {
          if (ress.data != null) {
            if (ress.data.length == 0) {
              this.swalAlert('Learning Modality not yet selected!', 'Please select your preferred Learning Modality.', 'warning');
              this.router.navigate(['../main', { outlets: { div: 'Modality' } }]);
            }
          } else {
            this.swalAlert('Learning Modality not yet selected!', 'Please select your preferred Learning Modality.', 'warning');
            this.router.navigate(['../main', { outlets: { div: 'Modality' } }]);
          }

        });
    }
    var x = [
      '0600874'
    ];

    if (x.includes(this.requestid())) {
      //this.swalAlert("Re-send Confirmation Notice","Please resend a clear copy of your payment confirmation notice not later than February 15, 2021 to make you officially enrolled this second semester. Thank you.","warning")
    }
  }

  getPreviousSem(x) {
    var y1 = parseInt(x.substring(0, 4)) - 1;
    var y2 = parseInt(x.substring(4, 6)) - 1;
    return y1.toString() + y2.toString();
    // if (x.length==7) {
    //   if (x[6]=='1') {
    //     return y1.toString()+y2.toString()+'3'
    //   }else{
    //     return (parseInt(x)-1).toString()
    //   }
    // }else{
    //   return y1.toString()+y2.toString()
    // }

  }

  syDisplaynoSemester(x) {
    var y = x.substring(0, 4)
    var z = parseInt(y) + 1
    var a = y.toString() + " - " + z.toString();
    var b = x.substring(6, 7)
    return " SY " + a
  }

  motherSISinfo = []
  getStudInfoSheetMotherInfo(piD) {
    this.http.get(this.api + 'StudentPortal/Parent?parentId=' + piD, this.option)
      .map(response => response.json())
      .subscribe(res => {
        this.motherSISinfo = res.data
      });
  }

  //#region FUNCTION FOR CHECKING THE ENROLMENT STATUS OF STUDENT 3/22/2023
  checkEnrollmentStatus(param) {
    var rptCard = param.reportCard;
    var nso = param.nso;

    let errorCount = 0;
    // if(this.requiredDocuments[0].marriageCon
    if (this.hsfirstyear) {
      if (this.nextSYStudInfo.level == 'HS') {
        if (rptCard == 0) errorCount += 1;
        if (nso == 0) errorCount += 1;
      }
    }
    if (this.studinfo.level == 'HS') {
      if (param.reportCard == "0") errorCount += 1;
      if (param.nso == "0") errorCount += 1;
    } else if (this.studinfo.level == "COLLEGE") {
      if (this.requiredDocuments[0].cForm138 == "0") errorCount += 1;

      if (this.requiredDocuments[0].cnso == "0") errorCount += 1;

      if (this.studinfo.enrollmentType == 2)
        if (this.requiredDocuments[0].otr == "0") errorCount += 1;
    }
    if (errorCount == 0)
      return "Officially Enrolled"
    else
      return "Conditionally Enrolled" //include checking enrollment status of higher years
  }
  //#endregion

  //function for yearlevel checking for selection of electives in JHS higher years
  checknextStudinfo(year_level) {
    if (this.nextSYStudInfo) {
      if (this.nextSYStudInfo.yearOrGradeLevel == 3)
        return 3
      else
        return this.nextSYStudInfo.yearOrGradeLevel
    }
    else
      return year_level;
  }
  ///
  //function for payment status, year level and elective sy checking for selection of electives in JHS grade 9 and incoming grade 9
  checknextStudinfoStatus(elective_sy) {
    var sy = '';
    var status = '';
    var yearlevel = 0;

    if (this.enrollmenthist.length != 0) {
      sy = this.enrollmenthist[this.enrollmenthist.length - 1].schoolYear;
      status = this.enrollmenthist[this.enrollmenthist.length - 1].status;
      yearlevel = this.enrollmenthist[this.enrollmenthist.length - 1].yearOrGradeLevel;
    }


    if (sy == elective_sy && status == 'PAID' && yearlevel == 3)
      return status;
    else
      return 'null'
  }
  ///

  checkEnrollmentHistory_res
  async checkEnrollmentHistory(program_level, year_level) {

    const hist = await this.apiEnrollmentHistory().toPromise();
    if (hist.data.length != 0) {
      this.checkEnrollmentHistory_res = getRes(hist.data)
      return this.checkEnrollmentHistory_res;
    } else {
      return false;
    }

    function getRes(array) {
      var prog_level = array[array.length - 1].programLevel;
      var y_level = array[array.length - 1].yearOrGradeLevel;
      if ((prog_level == program_level || prog_level == 60) && y_level == year_level) {
        return true;
      } else {
        return false;
      }
    }
  }


  //#region GLOBAL API CALLS



  apiPreferredLearningModality(sy): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/PreferredLearningModality/' + sy + '?idNumber=' + this.requestid(), this.option)
      .map(response => response.json());
  }


  apiPublicAPISYOptionsList(): Observable<any> {
    return this.http.get(this.api + 'PublicAPI/SYOptionsList', this.option)
      .map(response => response.json());
  }

  apiSYSettings(syWithSem): Observable<any> {

    return this.http.get(this.api + 'PublicAPI/SYSettings/' + syWithSem, this.option)
      .map(response => response.json());

  }

  apiOnlineRegistrationSettings(): Observable<any> {
    return this.http.get(this.api + 'OnlineRegistration/Settings', this.option)
      .map(response => response.json());
  }


  apiPublicAPICurrentServerTime(): Observable<any> {
    return this.http.get(this.api + 'PublicAPI/CurrentServerTime', this.option)
      .map(response => response.json());
  }

  getapiPublicAPICurrentServerTime() {
    return this.http.get(this.api + 'PublicAPI/CurrentServerTime', this.option)
  }


  apiActiveConfiguration(): Observable<any> {
    return this.http.get(this.api + 'PublicAPI/ActiveSchoolYear', this.option)
      .map(response => response.json());
  }


  apiPlacement(): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/Placement/' + this.requestid(), this.option)
      .map(response => response.json());
  }



  apiEnrollmentHistory(): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/EnrollmentHistory/' + this.requestid(), this.option)
      .map(response => response.json());
  }

  apiStudentInfo(sy): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/StudentInfo/' + this.requestid() + '/' + sy, this.option)
      .map(response => response.json());
  }

  apigetexcelSHSCOL(sy): Observable<any> {
    return this.http.get(this.acctgApi + 'getexcel/SHS-COL/?sy=' + sy)
      .map(response => response.json());
  }

  apiCurriculum(programID): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/Curriculum/' + programID, this.option)
      .map(response => response.json());
  }

  apiCourseMajors(tempcourse): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/CourseMajors/' + tempcourse, this.option)
      .map(response => response.json());
  }

  apiDemography(sy): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/Demography/' + this.requestid() + '/' + sy, this.option)
      .map(response => response.json());
  }

  apiPersonInfo(): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/PersonInfo/' + this.requestid(), this.option)
      .map(response => response.json());
  }

  apiEducBackground(idNumber): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/EducBackground/' + idNumber, this.option)
      .map(response => response.json());
  }

  apiFamilyBackground(idNumber): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/FamilyBackground/' + idNumber, this.option)
      .map(response => response.json());
  }

  apiAcademicHistory(idNumber): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/AcademicHistory/' + idNumber, this.option)
      .map(response => response.json());
  }

  apiClassSchedule(idNumber, sy): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/ClassSchedule/' + idNumber + '/' + sy, this.option)
      .map(response => response.json());
  }

  apiExamSchedule(idNumber): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/ExamSchedule/' + idNumber, this.option)
      .map(response => response.json());
  }
  apiOtherInfo(idNumber): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/PersonalInfo/' + idNumber, this.option)
      .map(response => response.json());
  }

  apiRetentionPolicyLastSY(idNumber): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/RetentionPolicyLastSY/' + idNumber, this.option)
      .map(response => response.json());
  }

  apiSetHeaders(enrollmentsy): Observable<any> {
    return this.http.get(this.api + 'StudentPortal/SetHeaders/' + enrollmentsy + '/1', this.option)
      .map(response => response.json());
  }

  // added on 2/8/2024 - mico
  apiAuthRefreshToken(token): Observable<any> {
    return this.http.post(this.api + 'Auth/RefreshToken?token=' + token, {}, this.option).map(response => response.json())
  }


  checkEnrollmentHistoryForLevel(level: number): boolean {
    if (!this.enrollmenthist || this.enrollmenthist.length === 0) {
      return false;
    }

    return this.enrollmenthist.some(history => {
      const schoolYear = history.schoolYear;
      const lastDigit = schoolYear.charAt(schoolYear.length - 1);
      return lastDigit === '2' && history.programLevel === level;
    });
  }

  get isSameSy(): boolean {
    return !!this.sy && !!this.enrollmentsy && this.sy === this.enrollmentsy;
  }

  //#endregion









}