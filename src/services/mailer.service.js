const nodemailer = require('nodemailer');

const DEFAULT_TO = 'servicejjok@gmail.com';

function getMailConfig() {
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 587);
    const secure =
        process.env.SMTP_SECURE === 'true' ||
        String(process.env.SMTP_SECURE || '').toLowerCase() === '1';

    return {
        user,
        pass,
        host,
        port,
        secure,
        to: process.env.CONTACT_TO_EMAIL?.trim() || DEFAULT_TO,
        from: process.env.SMTP_FROM?.trim() || user || DEFAULT_TO,
    };
}

function isConfigured() {
    const { user, pass } = getMailConfig();
    return Boolean(user && pass);
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\r?\n/g, '<br/>');
}

/**
 * @param {{ nombre: string; email: string; mensaje: string }} payload
 */
async function sendConsultaEmail(payload) {
    const cfg = getMailConfig();
    if (!cfg.user || !cfg.pass) {
        const err = new Error(
            'El servidor no tiene configurado el envío de correo (SMTP_USER / SMTP_PASS).'
        );
        err.code = 'MAIL_NOT_CONFIGURED';
        throw err;
    }

    const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
    });

    const subject = `[Service JJ] Consulta web — ${payload.nombre}`;
    const text = [
        `Nueva consulta desde el sitio web`,
        ``,
        `Nombre: ${payload.nombre}`,
        `Email: ${payload.email}`,
        ``,
        `Mensaje:`,
        payload.mensaje,
    ].join('\n');

    const html = `
      <p><strong>Nueva consulta</strong> desde el formulario de contacto.</p>
      <p><strong>Nombre:</strong> ${escapeHtml(payload.nombre)}<br/>
      <strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${escapeHtml(payload.mensaje)}</p>
    `;

    await transporter.sendMail({
        from: `"Service JJ web" <${cfg.from}>`,
        to: cfg.to,
        replyTo: payload.email,
        subject,
        text,
        html,
    });
}

module.exports = { sendConsultaEmail };
