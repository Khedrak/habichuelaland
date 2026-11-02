import { createContext, Fragment, useContext, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { createCalendarEvent, decodeGuestName, getConfirmationUrl, invitationConfig } from '../lib/invitation.js';

const SceneProgress = createContext(null);
const assets = '/assets/';

function useGuest() {
  const [guest, setGuest] = useState(invitationConfig.defaultGuest);
  useEffect(() => {
    setGuest(decodeGuestName(new URLSearchParams(window.location.search).get('n')));
  }, []);
  return { guest };
}

function Scene({ className = '', children, id, label, background = 'paper' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  return <section ref={ref} id={id} className={`scene scene--${background} ${className}`} aria-label={label}>
    {background === 'paper' && <><div className="scene-background" aria-hidden="true"><picture>
      <source media="(max-width: 600px)" srcSet={`${assets}invitation-background-mobile-soft.webp`} />
      <img src={`${assets}invitation-background-desktop-soft.webp`} alt="" />
    </picture></div><div className="scene-tint" aria-hidden="true" /></>}
    <SceneProgress.Provider value={scrollYProgress}>{children}</SceneProgress.Provider>
  </section>;
}

function FloatingArt({ src, className = '', speed = 45, delay = 0, float = 9, phase = [0, 1], damping = 25, loading = 'lazy', driftDirection = 0, flipX = false }) {
  const progress = useContext(SceneProgress);
  const reduced = useReducedMotion();
  const offset = useTransform(progress, phase, [speed * 0.55, -speed * 0.55]);
  const y = useSpring(offset, { stiffness: 70, damping, mass: 0.7 });
  return <motion.div className={`floating-art ${className}`} style={{ y: reduced ? 0 : y }} animate={reduced || !driftDirection ? undefined : { x: ['0vw', `${driftDirection * 110}vw`, '0vw'] }} transition={driftDirection ? { x: { duration: 58, delay, ease: 'linear', repeat: Infinity } } : undefined} aria-hidden="true">
    <motion.img className={flipX ? 'floating-art-flipped' : undefined} src={`${assets}${src}`} alt="" loading={loading} animate={reduced ? undefined : { y: [0, -float, 0], rotate: [-1, 1, -1] }} transition={{ duration: 7 + delay, delay, ease: 'easeInOut', repeat: Infinity }} />
  </motion.div>;
}

function Reveal({ children, className = '' }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { y: 5, opacity: 0.98 }} whileInView={reduced ? undefined : { y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.55, ease: [0.2, 0.65, 0.3, 1] }}>{children}</motion.div>;
}

function TextReveal({ as = 'p', children, delay = 0, ...props }) {
  const reduced = useReducedMotion();
  const Element = motion[as];
  return <Element {...props} initial={reduced ? false : { opacity: 0, y: 7 }} whileInView={reduced ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: reduced ? 0.1 : 0.65, delay: reduced ? 0 : delay, ease: [0.2, 0.65, 0.3, 1] }}>{children}</Element>;
}

function EnvelopeOpening({ guest, onOpened }) {
  const reduced = useReducedMotion();
  const guestNameSize = Math.max(32, Math.min(72, 1450 / Math.max([...guest.trim()].length, 1)));
  const [phase, setPhase] = useState('closed');
  const phaseRef = useRef('closed');
  const [lift, setLift] = useState(48);
  const cardVisible = phase === 'card' || phase === 'revealed';
  const openVisible = phase === 'open' || cardVisible;
  const changePhase = (next) => { phaseRef.current = next; setPhase(next); };

  const beginOpening = () => {
    if (phaseRef.current !== 'closed') return;
    setLift(Math.min(64, window.innerHeight * 0.07));
    changePhase(reduced ? 'open' : 'lifting');
  };

  return <Scene className={`opening-scene opening-phase-${phase}`} id="inicio" label="Tu invitación personal">
    <FloatingArt src="cloud.webp" className="welcome-cloud-left" speed={22} driftDirection={1} loading="eager" />
    <FloatingArt src="cloud.webp" className="welcome-cloud-right" speed={-22} delay={1.5} phase={[0.15, 0.85]} driftDirection={-1} loading="eager" />
    <FloatingArt src="star.webp" className="welcome-star" speed={28} delay={2} loading="eager" />
    <FloatingArt src="star.webp" className="welcome-star-secondary" speed={-18} delay={1.2} float={6} loading="eager" />
    <FloatingArt src="moon.webp" className="welcome-moon" speed={14} delay={2.4} float={8} loading="eager" />
    <FloatingArt src="balloons-gold.webp" className="welcome-balloons" speed={-90} delay={1} phase={[0.2, 0.9]} loading="eager" />
    <div className="opening-content">
      <motion.p className="opening-kicker" initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: phase === 'closed' ? 1 : 0, y: phase === 'closed' ? 0 : -8 }} transition={{ duration: reduced ? 0.1 : 0.6, delay: reduced ? 0 : 0.1 }}>Una noticia llena de amor</motion.p>
      <motion.h1 className="opening-title" initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: phase === 'closed' ? 1 : 0, y: reduced || phase === 'closed' ? 0 : -12 }} transition={{ duration: reduced ? 0.1 : 0.7, ease: [0.22, 0.65, 0.3, 1] }}>Tienes una<br /><em>invitación</em></motion.h1>
      <div className="opening-stage envelope-frame" data-phase={phase}>
        <motion.div className="opening-artwork" initial={false}>
          <motion.button className="opening-trigger" type="button" onClick={beginOpening} disabled={phase !== 'closed'} aria-label="Abrir la invitación" aria-hidden={openVisible ? true : undefined} initial={false} animate={{ opacity: openVisible ? 0 : 1, y: reduced || phase === 'closed' ? 0 : -lift }} transition={{ duration: reduced ? 0.1 : 1.2, ease: [0.22, 0.75, 0.25, 1] }} onAnimationComplete={() => { if (phaseRef.current === 'lifting') changePhase('open'); }}>
            <motion.img className="closed-envelope" src={`${assets}envelope-stationery-closed.webp`} width="1612" height="975" alt="Sobre cerrado con un sello de cera con lazo" fetchPriority="high" animate={reduced ? { x: 0, rotate: 0 } : phase === 'closed' ? { x: [0, -2, 2, -1, 0], rotate: [0, -0.55, 0.55, -0.3, 0] } : { x: 0, rotate: 0 }} transition={phase === 'closed' && !reduced ? { x: { duration: 0.65, delay: 2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }, rotate: { duration: 0.65, delay: 2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' } } : { duration: 0.2, ease: 'easeOut' }} />
          </motion.button>
          <motion.div className="opening-open-envelope" style={{ y: reduced ? 0 : -lift }} initial={{ opacity: 0 }} animate={{ opacity: openVisible ? 1 : 0 }} transition={{ duration: reduced ? 0.08 : 0.35 }} aria-hidden={!openVisible} onAnimationComplete={() => { if (phaseRef.current === 'open') changePhase('card'); }}>
            <img className="open-envelope" src={`${assets}envelope-stationery-open.webp`} width="1374" height="1145" alt="El mismo sobre, ahora abierto" loading="eager" />
          </motion.div>
          {cardVisible && <motion.article className="invitation-letter opening-letter" initial={{ opacity: 0, y: reduced ? 0 : -lift + 12, rotate: reduced ? 0 : -5 }} animate={{ opacity: 1, y: reduced ? 0 : -lift, rotate: reduced ? 0 : -1.7 }} transition={{ duration: reduced ? 0.12 : 0.85, delay: reduced ? 0.05 : 0.25, ease: [0.22, 0.65, 0.3, 1] }} onAnimationComplete={() => { if (phaseRef.current === 'card') { changePhase('revealed'); onOpened(); } }}>
            <TextReveal delay={0.08}>Para</TextReveal><TextReveal as="h2" delay={0.14} className="guest-name" style={{ '--guest-name-fit-size': `${guestNameSize}px` }}>{guest}</TextReveal><span className="letter-rule" aria-hidden="true" /><TextReveal delay={0.22}>Te invitamos a nuestra</TextReveal><TextReveal as="h3" delay={0.3}>Revelación<br /><em>de género</em></TextReveal><TextReveal delay={0.38} className="letter-date">{invitationConfig.dateLabel}</TextReveal><TextReveal delay={0.44} className="letter-time">{invitationConfig.timeLabel}</TextReveal>
          </motion.article>}
        </motion.div>
        <FloatingArt src="teddy-thinking-back.webp" className="opening-teddy-reading" speed={0} delay={0.5} float={3} loading="eager" />
        <FloatingArt src="teddy-welcome.webp" className="opening-teddy-card" speed={0} delay={0.5} float={3} loading="eager" />
      </div>
      <div className="opening-cue-slot" aria-live="polite">
        {phase === 'closed' && <TextReveal className="open-cue">Toca el sobre para abrir</TextReveal>}
        {(phase === 'lifting' || phase === 'open') && <TextReveal className="opening-status" role="status">Abriendo tu invitación…</TextReveal>}
        {phase === 'revealed' && <motion.a className="opening-down-cue" href="#historia" aria-label="Desplazarse para ver más detalles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0.1 : 0.5 }}><motion.span aria-hidden="true" animate={reduced ? undefined : { y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>↓</motion.span></motion.a>}
      </div>
    </div>
  </Scene>;
}

export function InvitationExperience() {
  const { guest } = useGuest();
  const [opened, setOpened] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [finalRsvpVisible, setFinalRsvpVisible] = useState(false);
  const reduced = useReducedMotion();
  const floatingHidden = heroVisible || finalRsvpVisible;
  useEffect(() => {
    if (!opened) return;
    const heroSection = document.getElementById('inicio');
    const finalSection = document.getElementById('confirmar');
    if (!heroSection || !finalSection) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === heroSection) setHeroVisible(entry.isIntersecting);
        if (entry.target === finalSection) setFinalRsvpVisible(entry.isIntersecting);
      }
    }, { threshold: 0.12, rootMargin: '-8% 0px -18% 0px' });
    observer.observe(heroSection);
    observer.observe(finalSection);
    return () => observer.disconnect();
  }, [opened]);
  return <main className="experience-page" data-opened={opened}>
    <EnvelopeOpening guest={guest} onOpened={() => setOpened(true)} />
    {opened && <><motion.div className="invitation-details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0.1 : 0.7 }}><InvitationSections guest={guest} /></motion.div><motion.a className="rsvp-floating" href={getConfirmationUrl(guest)} target="_blank" rel="noopener noreferrer" aria-label="Confirmar asistencia por WhatsApp" aria-hidden={floatingHidden} tabIndex={floatingHidden ? -1 : 0} initial={{ opacity: 0, y: 10 }} animate={{ opacity: floatingHidden ? 0 : 1, y: floatingHidden ? 10 : 0 }} style={{ pointerEvents: floatingHidden ? 'none' : 'auto' }} transition={{ duration: reduced ? 0.1 : 0.4 }}><svg className="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.88 11.88 0 0 0 12.04 0C5.44 0 .06 5.37.06 11.98c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62a11.98 11.98 0 0 0 5.86 1.49h.01c6.6 0 11.98-5.37 11.98-11.98a11.9 11.9 0 0 0-3.51-8.41ZM12.04 21.85a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.67.96.98-3.57-.24-.37a9.88 9.88 0 0 1-1.52-5.3c0-5.49 4.47-9.96 9.96-9.96 2.66 0 5.15 1.04 7.03 2.92a9.87 9.87 0 0 1 2.92 7.04c0 5.49-4.47 9.95-9.95 9.95Zm5.46-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.11 3.22 5.12 4.52.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" /></svg><span>Confirmar asistencia</span></motion.a></>}
  </main>;
}

function Countdown() {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(invitationConfig.dateTime).getTime() - Date.now()));
    tick(); const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const values = remaining === null ? ['—', '—', '—', '—'] : [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60, Math.floor(remaining / 1000) % 60].map(value => String(value).padStart(2, '0'));
  return <div className="countdown" role="timer" aria-label={`Tiempo hasta el ${invitationConfig.dateLabel}`}><TextReveal as="p">Falta muy poquito</TextReveal><div className="countdown-values">{values.map((value, i) => <Fragment key={i}>{i > 0 && <span className="countdown-separator" aria-hidden="true">:</span>}<div className="countdown-unit"><strong>{value}</strong><span>{['días', 'horas', 'minutos', 'segundos'][i]}</span></div></Fragment>)}</div></div>;
}

function CalendarButton() {
  const openCalendar = async () => {
    const file = new Blob([createCalendarEvent()], { type: 'text/calendar;charset=utf-8' });
    const calendarFile = new File([file], 'revelacion-de-genero-2026-11-28.ics', { type: 'text/calendar' });
    if (navigator.canShare?.({ files: [calendarFile] }) && navigator.share) {
      try { await navigator.share({ files: [calendarFile], title: 'Revelación de género' }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'revelacion-de-genero-2026-11-28.ics';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <button className="calendar-button" type="button" onClick={openCalendar}>
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M7.5 3v4M16.5 3v4M4 9.5h16M8 13h3v3H8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <span>Agregar al calendario</span>
  </button>;
}

function InvitationSections({ guest }) {
  const reduced = useReducedMotion();
  return <>
    <Scene className="story-scene" id="historia" label="Nuestra pequeña gran noticia" background="plain">
      <FloatingArt src="cloud.webp" className="story-cloud-top" speed={24} delay={1} phase={[0, 0.8]} driftDirection={-1} />
      <FloatingArt src="moon.webp" className="story-moon" speed={-65} delay={2} float={12} phase={[0.2, 1]} />
      <FloatingArt src="star.webp" className="story-star-left" speed={45} float={5} />
      <FloatingArt src="star.webp" className="story-star-right" speed={-90} delay={1} phase={[0.1, 0.7]} />
      <div className="story-composition">
        <figure className="ultrasound-easel">
          <div className="ultrasound-easel-frame"><img src={`${assets}ultrasound-first-look.webp`} width="1200" height="860" alt="Ecografía de nuestro bebé creciendo en el vientre." loading="lazy" /></div>
          <div className="easel-stand" aria-hidden="true"><span className="easel-leg easel-leg-left" /><span className="easel-leg easel-leg-middle" /><span className="easel-leg easel-leg-right" /></div>
        </figure>
        <Reveal className="story-copy"><TextReveal as="h2">El amor ya lo sabemos.<br /><em>La sorpresa, todavía no.</em></TextReveal><TextReveal delay={0.12}>Hay alguien que aún no conocemos y que ya llena nuestros días de ilusión.</TextReveal><TextReveal delay={0.22}>Queremos que seas parte de este momento: descubrir juntos si nuestro mundo se llenará de una pequeña niña o un pequeño niño.</TextReveal></Reveal>
      </div>
    </Scene>
    <Scene className="expecting-scene" id="preparativos" label="Preparativos llenos de amor">
      <Reveal className="expecting-content">
        <TextReveal as="h2">Todo lo que hacemos<br /><em>ya es pensando en ti</em></TextReveal>
        <TextReveal className="expecting-intro" delay={0.1}>Entre pequeños preparativos y sueños compartidos, tu llegada ya llena de amor cada rincón de nuestra vida.</TextReveal>
        <div className="expecting-gallery">
          <TextReveal as="figure" className="expecting-photo-card" delay={0.16}>
            <img src={`${assets}expecting-baby-shoes.webp`} width="1200" height="1600" alt="Mamá y papá sostienen juntos unos pequeños zapatitos tejidos para su bebé." loading="lazy" />
          </TextReveal>
          <TextReveal as="figure" className="expecting-photo-card" delay={0.26}>
            <img src={`${assets}first-baby-things.webp`} width="1200" height="1600" alt="Gorras de mamá y papá, zapatitos tejidos y recuerdos de la espera del bebé." loading="lazy" />
          </TextReveal>
        </div>
      </Reveal>
    </Scene>
    <Scene className="details-scene" id="detalles" label="Los detalles de nuestra celebración">
      <FloatingArt src="cloud.webp" className="details-cloud" speed={22} delay={1} driftDirection={1} />
      <FloatingArt src="balloons-gold.webp" className="details-balloons" speed={-115} delay={1} phase={[0.1, 0.75]} damping={35} />
      <Reveal className="details-content">
        <TextReveal as="h2">Guarda esta <em>fecha</em></TextReveal>
        <TextReveal as="div" className="event-date" delay={0.1}><span className="event-day">{invitationConfig.day}</span><div><span>{invitationConfig.weekday}</span><strong>{invitationConfig.month}</strong><span>de {invitationConfig.year}</span></div></TextReveal>
        <div className="event-facts"><TextReveal as="div" delay={0.15}><h3>La hora</h3><p>{invitationConfig.timeLabel}</p></TextReveal><TextReveal as="div" delay={0.24}><h3>El lugar</h3><p>{invitationConfig.address}</p></TextReveal></div>
        <CalendarButton />
        <div className="venue-map">
          <iframe src={invitationConfig.embedUrl} title={`Mapa para llegar a ${invitationConfig.address}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          <FloatingArt src="teddy-curious.webp" className="details-bear-curious" speed={10} float={3} flipX />
        </div>
        <Countdown />
      </Reveal>
    </Scene>
    <Scene className="rsvp-scene" id="confirmar" label="Confirma tu asistencia" background="plain">
      <FloatingArt src="cloud.webp" className="rsvp-cloud-left" speed={-22} driftDirection={1} />
      <FloatingArt src="cloud.webp" className="rsvp-cloud-right" speed={22} delay={2} phase={[0.15, 1]} driftDirection={-1} />
      <FloatingArt src="star.webp" className="rsvp-star" speed={35} delay={1} float={6} />
        <Reveal className="rsvp-content"><TextReveal as="h2">¿Nos acompañas<br /><em>a descubrirlo?</em></TextReveal><TextReveal delay={0.12}>Nos hace mucha ilusión celebrar contigo.<br />Cuéntanos por WhatsApp si podremos abrazarte ese día.</TextReveal><motion.a className="rsvp-button" href={getConfirmationUrl(guest)} target="_blank" rel="noopener noreferrer" initial={reduced ? false : { opacity: 0, y: 7 }} whileInView={reduced ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: reduced ? 0.1 : 0.65, delay: 0.2, ease: [0.2, 0.65, 0.3, 1] }} whileHover={reduced ? undefined : { y: -3 }} whileTap={reduced ? undefined : { scale: 0.98 }}><svg className="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.88 11.88 0 0 0 12.04 0C5.44 0 .06 5.37.06 11.98c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62a11.98 11.98 0 0 0 5.86 1.49h.01c6.6 0 11.98-5.37 11.98-11.98a11.9 11.9 0 0 0-3.51-8.41ZM12.04 21.85a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.67.96.98-3.57-.24-.37a9.88 9.88 0 0 1-1.52-5.3c0-5.49 4.47-9.96 9.96-9.96 2.66 0 5.15 1.04 7.03 2.92a9.87 9.87 0 0 1 2.92 7.04c0 5.49-4.47 9.95-9.95 9.95Zm5.46-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.11 3.22 5.12 4.52.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" /></svg><span>Confirmar mi asistencia</span><span className="rsvp-arrow" aria-hidden="true">↗</span></motion.a><TextReveal as="a" className="back-link" href="#inicio" delay={0.3}>Volver al inicio</TextReveal></Reveal>
      <div className="footer-peeking-window" aria-hidden="true"><img className="footer-peeking-bear" src={`${assets}teddy-peeking-footer.webp`} width="1138" height="1382" alt="" loading="lazy" /></div>
    </Scene>
  </>;
}
