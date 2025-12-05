import nodemailer from 'nodemailer';

export const enviarCorreoBienvenida = async (email: string, name: string, token: string) => {
    try {
        // Configuración del transporter
        // Asegúrate de tener EMAIL_USER y EMAIL_PASS en tu archivo .env
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Puedes cambiar esto según tu proveedor
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const urlVerificacion = `http://localhost:5173/verificar-cuenta?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '¡Bienvenido a ULimeñitaPlay! - Verifica tu cuenta',
            text: `Hola ${name}, gracias por registrarte. Por favor verifica tu cuenta en: ${urlVerificacion}`,
            html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1>¡Solo un paso más, ${name}! 🚀</h1>
          <p>Para activar todas las funciones de ULimeñitaPlay, confirma tu correo.</p>
          
          <div style="margin: 20px 0;">
            <a href="${urlVerificacion}" 
               style="background-color: #ff9900; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               Verificar mi Cuenta
            </a>
          </div>

          <p>Si el botón no funciona, copia este link: ${urlVerificacion}</p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado: ' + info.response);
    } catch (error) {
        console.error('Error al enviar correo:', error);
        // No lanzamos el error para no interrumpir el flujo de registro, 
        // pero lo logueamos.
    }
};