import CryptoJS from "crypto-js"
import { PAYU_CONFIG } from "../config/payu.config"

/**
 * Genera la firma MD5 requerida por PayU
 * Formato: MD5(apiKey~merchantId~referenceCode~amount~currency)
 */
export const generatePayUSignature = (referenceCode: string, amount: number, currency = "PEN"): string => {
  const { apiKey, merchantId } = PAYU_CONFIG

  // Formato del string a hashear
  const signatureString = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`

  // Generar MD5
  const signature = CryptoJS.MD5(signatureString).toString()

  console.log("[PayU] Signature generada para referencia:", referenceCode)

  return signature
}

/**
 * Genera un código de referencia único para la transacción
 */
export const generateReferenceCode = (): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `REF-${timestamp}-${random}`
}
