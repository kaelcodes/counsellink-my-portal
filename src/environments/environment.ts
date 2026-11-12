// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  hitpayScriptUrl: 'https://sandbox.hit-pay.com/hitpay.js',
  hitpayPaymentUrl: 'http://securecheckout.sandbox.hit-pay.com/payment-request/@test-1/',
  hitpayDomain: 'sandbox.hit-pay.com',
  hitpayApiDomain: 'sandbox.hit-pay.com',

  // CounselLink API (Guidance Counseling micro-service).
  // TODO: replace with the real host once confirmed by the backend team (must end with /api/).
  // e.g. 'https://counsellink.usl.edu.ph/api/'
  counsellinkApi: ''
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
