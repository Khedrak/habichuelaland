import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { decodeGuestName, getConfirmationUrl, invitationConfig } from '../lib/invitation.js';

const SceneProgress = createContext(null);
const assets = '/assets/';

function useGuest() {
  const [guest, setGuest] = useState(invitationConfig.defaultGuest);
  const [query, setQuery] = useState('');
  useEffect(() => {
    setGuest(decodeGuestName(new URLSearchParams(window.location.search).get('n')));
    setQuery(window.location.search);
  }, []);
  return { guest, query };
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

function FloatingArt({ src, className = '', speed = 45, delay = 0, float = 9, phase = [0, 1], damping = 25, loading = 'lazy' }) {
  const progress = useContext(SceneProgress);
  const reduced = useReducedMotion();
  const offset = useTransform(progress, phase, [speed * 0.55, -speed * 0.55]);
  const y = useSpring(offset, { stiffness: 70, damping, mass: 0.7 });
  return <motion.div className={`floating-art ${className}`} style={{ y: reduced ? 0 : y }} aria-hidden="true">
    <motion.img src={`${assets}${src}`} alt="" loading={loading} animate={reduced ? undefined : { y: [0, -float, 0], rotate: [-1, 1, -1] }} transition={{ duration: 7 + delay, delay, ease: 'easeInOut', repeat: Infinity }} />
  </motion.div>;
}

function Reveal({ children, className = '' }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { y: 5, opacity: 0.98 }} whileInView={reduced ? undefined : { y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.55, ease: [0.2, 0.65, 0.3, 1] }}>{children}</motion.div>;
}

export function EnvelopeWelcome() {
  const { query } = useGuest();
  const reduced = useReducedMotion();
  return <main className="welcome-page"><Scene className="welcome-scene" label="Tu invitación personal">
    <FloatingArt src="cloud.webp" className="welcome-cloud-left" speed={40} loading="eager" />
    <FloatingArt src="cloud.webp" className="welcome-cloud-right" speed={-65} delay={1.5} phase={[0.15, 0.85]} loading="eager" />
    <FloatingArt src="star.webp" className="welcome-star" speed={28} delay={2} loading="eager" />
    <FloatingArt src="balloons-gold.webp" className="welcome-balloons" speed={-90} delay={1} phase={[0.2, 0.9]} loading="eager" />
    <div className="welcome-content">
      <motion.h1 initial={false} animate={reduced ? undefined : { y: 0, opacity: 1 }} transition={{ duration: 0.85, ease: 'easeOut' }}>Tienes una<br /><em>invitación</em></motion.h1>
      <div className="closed-envelope-scene envelope-frame">
        <motion.a className="envelope-link" href={`/invitacion${query}`} aria-label="Abrir la invitación" animate={reduced ? undefined : { y: [0, -6, 0] }} transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }} whileHover={reduced ? undefined : { filter: 'brightness(1.04)' }}>
          <img className="closed-envelope" src={`${assets}envelope-stationery-closed.webp`} width="1612" height="975" alt="Sobre de papel color arena, cerrado con un sello de cera con lazo" fetchPriority="high" />
        </motion.a>
        <FloatingArt src="teddy-bear.webp" className="welcome-teddy" speed={35} delay={0.5} float={5} loading="eager" />
      </div>
      <motion.p className="open-cue" initial={false} animate={reduced ? undefined : { opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}>Toca el sobre para abrir</motion.p>
    </div>
  </Scene></main>;
}

function Countdown() {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(invitationConfig.dateTime).getTime() - Date.now()));
    tick(); const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const values = remaining === null ? ['—', '—', '—', '—'] : [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60, Math.floor(remaining / 1000) % 60].map(value => String(value).padStart(2, '0'));
  return <div className="countdown" role="timer" aria-label={`Tiempo hasta el ${invitationConfig.dateLabel}`}><p>Falta muy poquito</p><div className="countdown-values">{values.map((value, i) => <div key={i}><strong>{value}</strong><span>{['días', 'horas', 'minutos', 'segundos'][i]}</span></div>)}</div></div>;
}

export function InvitationCelebration() {
  const { guest, query } = useGuest();
  const reduced = useReducedMotion();
  return <main className="invitation-page">
    <Scene className="invitation-hero" label="Una invitación para ti">
      <FloatingArt src="cloud.webp" className="hero-cloud-left" speed={105} phase={[0, 0.85]} damping={30} loading="eager" />
      <FloatingArt src="cloud.webp" className="hero-cloud-right" speed={-60} delay={2} phase={[0.2, 1]} loading="eager" />
      <FloatingArt src="star.webp" className="hero-star" speed={50} delay={1} loading="eager" />
      <FloatingArt src="balloons-gold.webp" className="hero-balloons" speed={-135} delay={1.2} phase={[0.1, 0.9]} damping={34} loading="eager" />
      <div className="invitation-hero-content">
        <motion.h1 className="invitation-greeting" initial={false} animate={reduced ? undefined : { y: 0, opacity: 1 }} transition={{ duration: 0.85, ease: 'easeOut' }}>Con mucho cariño</motion.h1>
        <div className="open-envelope-scene envelope-frame">
          <motion.img className="open-envelope" src={`${assets}envelope-stationery-open.webp`} width="1374" height="1145" alt="El mismo sobre de papel color arena, ahora abierto" fetchPriority="high" initial={false} animate={reduced ? undefined : { y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.article className="invitation-letter" initial={false} animate={reduced ? undefined : { y: [0, -6, 0], opacity: 1 }} transition={{ y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 } }}>
            <motion.p initial={false} animate={reduced ? undefined : { y: 0, opacity: 1 }}>Para</motion.p><motion.h2 className="guest-name" initial={false} animate={reduced ? undefined : { y: 0, opacity: 1 }}>{guest}</motion.h2><motion.span className="letter-rule" aria-hidden="true" initial={false} animate={reduced ? undefined : { scaleX: 1 }} /><motion.p initial={false} animate={reduced ? undefined : { y: 0, opacity: 1 }}>Te invitamos a nuestra</motion.p><motion.h3 initial={false} animate={reduced ? undefined : { y: 0, opacity: 1 }}>Revelación<br /><em>de género</em></motion.h3><motion.p className="letter-date" initial={false} animate={reduced ? undefined : { opacity: 1 }}>{invitationConfig.dateLabel}</motion.p><motion.p className="letter-time" initial={false} animate={reduced ? undefined : { opacity: 1 }}>{invitationConfig.timeLabel}</motion.p>
          </motion.article>
        </div>
      </div>
    </Scene>
    <Scene className="story-scene" id="historia" label="Nuestra pequeña gran noticia" background="plain">
      <FloatingArt src="cloud.webp" className="story-cloud-top" speed={90} delay={1} phase={[0, 0.8]} />
      <FloatingArt src="moon.webp" className="story-moon" speed={-65} delay={2} float={12} phase={[0.2, 1]} />
      <FloatingArt src="star.webp" className="story-star-left" speed={45} float={5} />
      <FloatingArt src="star.webp" className="story-star-right" speed={-90} delay={1} phase={[0.1, 0.7]} />
      <div className="story-composition">
        <FloatingArt src="teddy-bear.webp" className="story-teddy" speed={70} float={7} phase={[0.15, 0.95]} damping={32} />
        <Reveal className="story-copy"><h2>El amor ya lo sabemos.<br /><em>La sorpresa, todavía no.</em></h2><p>Hay alguien que aún no conocemos y que ya llena nuestros días de ilusión.</p><p>Queremos que seas parte de este momento: descubrir juntos si nuestro mundo se llenará de una pequeña niña o un pequeño niño.</p></Reveal>
      </div>
    </Scene>
    <Scene className="details-scene" id="detalles" label="Los detalles de nuestra celebración">
      <FloatingArt src="cloud.webp" className="details-cloud" speed={85} delay={1} />
      <FloatingArt src="balloons-gold.webp" className="details-balloons" speed={-115} delay={1} phase={[0.1, 0.75]} damping={35} />
      <Reveal className="details-content">
        <h2>Guarda esta <em>fecha</em></h2>
        <div className="event-date"><span className="event-day">{invitationConfig.day}</span><div><span>{invitationConfig.weekday}</span><strong>{invitationConfig.month}</strong><span>de {invitationConfig.year}</span></div></div>
        <div className="event-facts"><div><h3>La hora</h3><p>{invitationConfig.timeLabel}</p></div><div><h3>El lugar</h3><p>{invitationConfig.address}</p></div></div>
        <div className="venue-map">
          <iframe src={invitationConfig.embedUrl} title={`Mapa para llegar a ${invitationConfig.address}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
        <a className="directions-link" href={invitationConfig.mapsUrl} target="_blank" rel="noopener noreferrer">Cómo llegar <span aria-hidden="true">↗</span></a>
        <Countdown />
      </Reveal>
    </Scene>
    <Scene className="rsvp-scene" id="confirmar" label="Confirma tu asistencia" background="plain">
      <FloatingArt src="cloud.webp" className="rsvp-cloud-left" speed={-70} />
      <FloatingArt src="cloud.webp" className="rsvp-cloud-right" speed={95} delay={2} phase={[0.15, 1]} />
      <FloatingArt src="star.webp" className="rsvp-star" speed={35} delay={1} float={6} />
      <Reveal className="rsvp-content"><h2>¿Nos acompañas<br /><em>a descubrirlo?</em></h2><p>Nos hace mucha ilusión celebrar contigo.<br />Cuéntanos por WhatsApp si podremos abrazarte ese día.</p><motion.a className="rsvp-button" href={getConfirmationUrl(guest)} target="_blank" rel="noopener noreferrer" whileHover={reduced ? undefined : { y: -3 }} whileTap={reduced ? undefined : { scale: 0.98 }}><svg className="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.88 11.88 0 0 0 12.04 0C5.44 0 .06 5.37.06 11.98c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62a11.98 11.98 0 0 0 5.86 1.49h.01c6.6 0 11.98-5.37 11.98-11.98a11.9 11.9 0 0 0-3.51-8.41ZM12.04 21.85a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.67.96.98-3.57-.24-.37a9.88 9.88 0 0 1-1.52-5.3c0-5.49 4.47-9.96 9.96-9.96 2.66 0 5.15 1.04 7.03 2.92a9.87 9.87 0 0 1 2.92 7.04c0 5.49-4.47 9.95-9.95 9.95Zm5.46-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.11 3.22 5.12 4.52.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" /></svg><span>Confirmar mi asistencia</span><span className="rsvp-arrow" aria-hidden="true">↗</span></motion.a><a className="back-link" href={`/${query}`}>Volver al sobre</a></Reveal>
    </Scene>
  </main>;
}
