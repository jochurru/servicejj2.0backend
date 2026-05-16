const { ValidationError, AppError } = require('../domain/errors');
const { sendConsultaEmail } = require('../services/mailer.service');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(str, max) {
    const t = String(str ?? '').trim();
    if (t.length > max) return t.slice(0, max);
    return t;
}

async function postConsulta(req, res, next) {
    const nombre = sanitize(req.body?.nombre, 120);
    const email = sanitize(req.body?.email, 254).toLowerCase();
    const mensaje = sanitize(req.body?.mensaje, 8000);

    try {
        if (!nombre || nombre.length < 2) {
            throw new ValidationError('Indicá un nombre válido.');
        }
        if (!email || !EMAIL_RE.test(email)) {
            throw new ValidationError('Indicá un email válido.');
        }
        if (!mensaje || mensaje.length < 5) {
            throw new ValidationError('El mensaje es demasiado corto.');
        }

        await sendConsultaEmail({ nombre, email, mensaje });

        res.status(200).json({
            success: true,
            mensaje: 'Consulta enviada correctamente.',
        });
    } catch (err) {
        if (err instanceof ValidationError) {
            return next(err);
        }
        if (err.code === 'MAIL_NOT_CONFIGURED') {
            console.error('[contact]', err.message);
            return next(
                new AppError(
                    'El envío de consultas no está disponible en este momento. Probá más tarde o escribinos por WhatsApp.',
                    503
                )
            );
        }
        console.error('Error enviando consulta de contacto:', err);
        return next(
            new AppError(
                'No se pudo enviar el correo en este momento. Probá más tarde o escribinos por WhatsApp.',
                502
            )
        );
    }
}

module.exports = { postConsulta };
