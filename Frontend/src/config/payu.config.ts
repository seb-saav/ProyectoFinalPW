export const PAYU_CONFIG = {
  merchantId: '508029',
  accountId: '512321',
  apiKey: '4Vj8eK4rloUd272L48hsrarnUA',
  test: true, 
  paymentUrl: 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/',
  // CORRECCIÓN: Quitamos "/tienda" para que coincida con tu Router
  responseUrl: 'http://localhost:5173/recarga-exitosa', 
  confirmationUrl: 'http://localhost:5173/recarga-exitosa',
};