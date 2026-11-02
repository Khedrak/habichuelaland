import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { encodeGuestName, invitationConfig, toTitleCaseName } from '../lib/invitation.js';

export default function AdminInviteForm() {
  const reduced = useReducedMotion();
  const [guestName, setGuestName] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [canShare, setCanShare] = useState(false);
  const linkRef = useRef(null);

  useEffect(() => {
    setCanShare(typeof navigator.share === 'function');
  }, []);

  const clearGeneratedLink = () => {
    setResult(null);
    setError('');
    setFeedback('');
  };

  const generateLink = (event) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    const rawName = guestName.trim();
    if (!rawName || rawName.length > 100 || /[\u0000-\u001f\u007f]/.test(rawName)) {
      setError('Escribe un nombre válido de hasta 100 caracteres.');
      return;
    }
    const name = toTitleCaseName(rawName);

    const url = new URL('/', window.location.origin);
    url.searchParams.set('n', encodeGuestName(name));
    const message = `Hola, ${name}. Queremos invitarte a nuestra revelación de género el ${invitationConfig.dateLabel}. Abre tu invitación aquí:\n${url.href}`;
    const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    setResult({ name, url: url.href, message, isLocal });
  };

  const copyLink = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setFeedback('Enlace copiado. Ya puedes enviarlo.');
    } catch {
      linkRef.current?.focus();
      linkRef.current?.select();
      setFeedback('No fue posible copiar automáticamente. El enlace está seleccionado para que lo copies.');
    }
  };

  const shareLink = async () => {
    if (!result || !navigator.share) return;
    try {
      await navigator.share({ title: 'Una invitación para ti', text: `Hola, ${result.name}. Queremos compartir una pequeña gran sorpresa contigo.`, url: result.url });
      setFeedback('Invitación compartida.');
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setFeedback('No fue posible abrir el menú para compartir. Puedes copiar el enlace.');
    }
  };

  return (
    <>
      <motion.header className="admin-heading" initial={reduced ? false : { y: 5, opacity: 0.98 }} animate={reduced ? undefined : { y: 0, opacity: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
        <motion.p initial={reduced ? false : { opacity: 0 }} animate={reduced ? undefined : { opacity: 1 }} transition={{ delay: 0.12 }}>Herramienta de envío</motion.p>
        <motion.h1 initial={reduced ? false : { y: 3, opacity: 0.98 }} animate={reduced ? undefined : { y: 0, opacity: 1 }} transition={{ delay: 0.08, duration: 0.5 }}>Una invitación <em>personal.</em></motion.h1>
        <motion.span initial={reduced ? false : { opacity: 0.98 }} animate={reduced ? undefined : { opacity: 1 }} transition={{ delay: 0.12, duration: 0.5 }}>Prepara el enlace de cada persona y compártelo con un mensaje.</motion.span>
      </motion.header>
      <motion.div className="admin-tool" initial={reduced ? false : { y: 5, opacity: 0.98 }} animate={reduced ? undefined : { y: 0, opacity: 1 }} transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}>
      <form className="admin-form" onSubmit={generateLink}>
        <div className="admin-field">
          <label htmlFor="admin-guest-name">Nombre de la persona invitada</label>
          <input id="admin-guest-name" type="text" autoComplete="name" maxLength={100} value={guestName} onChange={(event) => { setGuestName(event.target.value); clearGeneratedLink(); }} placeholder="Ejemplo: María José" required />
        </div>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="admin-button admin-button-primary" type="submit">Generar invitación <span aria-hidden="true">↗</span></button>
      </form>

      {result && (
        <motion.section className="admin-result" aria-labelledby="admin-result-title" initial={reduced ? false : { y: 4, opacity: 0.98 }} animate={reduced ? undefined : { y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <h2 id="admin-result-title">La invitación de {result.name}</h2>
          <label className="admin-link-label" htmlFor="admin-generated-link">Enlace personalizado</label>
          <textarea ref={linkRef} id="admin-generated-link" rows={3} readOnly value={result.url} spellCheck={false} />
          {result.isLocal && <p className="admin-share-help">Este enlace apunta a tu servidor local. Para enviarlo a otras personas, abre esta herramienta desde la URL pública del sitio.</p>}
          <div className="admin-actions">
            <button type="button" className="admin-button admin-button-secondary" onClick={copyLink} aria-label="Copiar enlace de invitación"><svg className="admin-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg>Copiar enlace</button>
            {canShare && <button type="button" className="admin-button admin-button-secondary" onClick={shareLink}>Compartir</button>}
            <a className="admin-text-link" href={result.url} target="_blank" rel="noopener noreferrer">Ver invitación <span aria-hidden="true">↗</span></a>
          </div>
          <a className="admin-button admin-button-primary admin-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(result.message)}`} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp <span aria-hidden="true">↗</span></a>
          <p className="admin-share-help">WhatsApp se abrirá con el mensaje preparado; elige el contacto y envíalo manualmente.</p>
        </motion.section>
      )}
      <p className="admin-feedback" role="status" aria-live="polite">{feedback}</p>
      </motion.div>
      <motion.p className="admin-notice" initial={reduced ? false : { opacity: 0.98 }} animate={reduced ? undefined : { opacity: 1 }} transition={{ delay: 0.18, duration: 0.55 }}>Esta ruta no tiene autenticación ni guarda los datos ingresados. Los enlaces ocultan el nombre con una codificación; no son enlaces privados ni cifrados.</motion.p>
    </>
  );
}
