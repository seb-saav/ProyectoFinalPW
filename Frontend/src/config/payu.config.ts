const IS_PROD = import.meta.env.PROD;
const BASE_URL = IS_PROD ? 'https://seb-saav.github.io/ProyectoFinalPW' : 'http://localhost:5173';

export const PAYU_CONFIG = {
  merchantId: '508029',
  accountId: '512321',
  apiKey: '4Vj8eK4rloUd272L48hsrarnUA',
  test: true, 
  paymentUrl: 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/',
  // Configuración dinámica para Local vs GitHub Pages
  responseUrl: `${BASE_URL}/recarga-exitosa`, 
  confirmationUrl: `${BASE_URL}/recarga-exitosa`,
};
