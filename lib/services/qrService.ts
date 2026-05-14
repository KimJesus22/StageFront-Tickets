import QRCode from "qrcode";

export class QRGeneratorService {
  /**
   * Genera un código QR en formato Base64 (Data URL).
   * @param token El token o ID a codificar en el QR.
   */
  static async generate(token: string): Promise<string> {
    try {
      // Usamos margen 1 y corrección de error H para mayor confiabilidad
      const dataUrl = await QRCode.toDataURL(token, {
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H'
      });
      return dataUrl;
    } catch (error) {
      console.error("Error al generar el código QR:", error);
      throw error;
    }
  }
}
