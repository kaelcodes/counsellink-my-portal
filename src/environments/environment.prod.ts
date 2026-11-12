export const environment = {
  production: true,
  // hitpayScriptUrl: 'https://securecheckout.hit-pay.com/hitpay.js',
  // hitpayPaymentUrl: 'https://securecheckout.hit-pay.com/payment-request/@live-1234/',
  // hitpayDomain: 'hit-pay.com',
  // hitpayApiDomain: 'hit-pay.com'

  // CounselLink API (Guidance Counseling micro-service).
  // TODO: replace with the real production host once confirmed by the backend team (must end with /api/).
  counsellinkApi: ''
};

// Override console methods in production
if (environment.production) {
  window.console.log = () => { };
  window.console.debug = () => { };
  window.console.info = () => { };
  window.console.warn = () => { };
  window.console.error = () => { };
}
