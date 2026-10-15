import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Hero3D, { SCENES, DURATIONS } from './components/Hero3D';
import './App.css';

/* ---------- EDITABLE CONTENT ---------- */
// TODO: Replace with verified details from "JSA Company Profile.pdf" (the PDF and the original logo
// were not available in the workspace, so nothing here is invented).
const CONTACTS = [
  { role: 'City Office / Main Branch', phone: '0321 6610075', address: 'First Floor, Azra Center, Munshi Muhala, Street #06, Amipur Bazar, Faisalabad.' },
  { role: 'Marketing Office', phone: '0321 6684665', address: '82-B Commercial Center, Millat Chowk, Sheikhupura Road, opposite Laraib Bouquet Hall, Faisalabad 38000.' },
  { role: 'Contact Person', phone: '0300 0197459', address: '' },
] as const;
const EMAIL = '[Add verified email from company profile]';
const tel = (p: string) => `tel:+92${p.replace(/\s/g, '').replace(/^0/, '')}`;
const LOGO_SRC: string | null = null; // e.g. '/images/jsa-logo.png' once the original logo file is added
const FORM_ENDPOINT: string = import.meta.env.VITE_FORM_ENDPOINT ?? ''; // e.g. Formspree URL; no secrets here

const NAV = [['Home', '#home'], ['About', '#about'], ['Services', '#services'], ['Products', '#products'], ['Our Vision', '#vision'], ['Contact', '#contact']] as const;

const CORE_SERVICES = [
  'Hang Tags', 'Labels', 'Stickers', 'Insert Cards', 'Thermal Stickers', 'Business Cards', 'Letterheads',
  'Writing Pads', 'Brochures', 'Flyers', 'Manuals', 'Calendars', 'Award Shields',
];
const PRODUCT_LINES = [
  'Printed Fabric Labels', 'Garment Boxes', 'Packing Bands', 'Barcode & Carton Stickers', 'Leather Patches',
  'Price Tickets', 'Foil Stamping', 'Size Strips', 'Decal Stickers', 'Woven Labels',
];
const ALL_OPTIONS = [...CORE_SERVICES, ...PRODUCT_LINES];

const GROUPS = [
  { title: 'Tags, Labels & Stickers', tone: 'emerald', img: '/images/hang_tag.jpg', alt: 'Ivory hang tags with gold foil and cotton string on emerald velvet',
    desc: 'Identity that travels with the garment — from hang tags to label and sticker formats.',
    items: ['Hang Tags', 'Labels', 'Stickers', 'Thermal Stickers', 'Insert Cards', 'Price Tickets', 'Size Strips', 'Decal Stickers', 'Barcode & Carton Stickers'] },
  { title: 'Garment Labelling', tone: 'ivory', img: '/images/woven_labels.jpg', alt: 'Woven garment labels with gold thread on linen',
    desc: 'Woven and printed fabric labels, and leather patches for finished products.',
    items: ['Woven Labels', 'Printed Fabric Labels', 'Leather Patches'] },
  { title: 'Packaging', tone: 'burgundy', img: '/images/garment_box.jpg', alt: 'Burgundy rigid garment box with gold foil logo and ribbon',
    desc: 'Garment boxes and packing bands that present the product as well as protect it.',
    items: ['Garment Boxes', 'Packing Bands'] },
  { title: 'Stationery & Corporate Print', tone: 'ivory', img: '/images/business_cards.jpg', alt: 'Thick emerald business cards with gold foil on marble',
    desc: 'Everyday brand print, finished with care — including foil stamping.',
    items: ['Business Cards', 'Letterheads', 'Writing Pads', 'Brochures', 'Flyers', 'Manuals', 'Calendars', 'Award Shields', 'Foil Stamping'] },
];

const SHOWCASE = [
  { id: 'tags', label: 'Hang Tags', img: '/images/hang_tag.jpg', note: 'Eyelet, string and foil-stamped finish', alt: 'Premium hang tags' },
  { id: 'cards', label: 'Business Cards', img: '/images/business_cards.jpg', note: 'Thick stock with foil stamping', alt: 'Foil-stamped business cards' },
  { id: 'woven', label: 'Woven Labels', img: '/images/woven_labels.jpg', note: 'Fine woven detail for garments', alt: 'Woven garment labels' },
  { id: 'box', label: 'Garment Boxes', img: '/images/garment_box.jpg', note: 'Rigid box with foil and ribbon', alt: 'Printed garment box' },
  { id: 'leather', label: 'Leather Patches', img: '/images/leather_patch.jpg', note: 'Debossed leather with stitched border', alt: 'Debossed leather patch on denim' },
];

const STEPS = [
  ['Share Your Requirements', 'Tell us the product, size and quantity you have in mind.'],
  ['Discuss Your Printing Needs', 'We talk through materials, finishes and your brand details.'],
  ['Confirm Artwork & Specifications', 'Review and approve the artwork and specification together.'],
  ['Production & Delivery Coordination', 'Your order goes into production and we coordinate delivery with you.'],
];

/* ---------- Helpers ---------- */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function Chars({ text, start = 0 }: { text: string; start?: number }) {
  return <>{text.split(' ').map((w, wi, arr) => (
    <span className="word" key={wi} aria-hidden="true">
      {w.split('').map((c, i) => <span className="ch" key={i} style={{ animationDelay: `${start + (wi * 5 + i) * 0.028}s` }}>{c}</span>)}
      {wi < arr.length - 1 ? '\u00A0' : ''}
    </span>
  ))}</>;
}

function Brand({ light }: { light?: boolean }) {
  return LOGO_SRC
    ? <img className="logo-img" src={LOGO_SRC} alt="JSA Printing Solutions logo" />
    : (
      <span className={`brand ${light ? 'light' : ''}`} title="Original JSA logo goes here — set LOGO_SRC in App.tsx">
        <span className="brand-mark">JSA</span>
        <span className="brand-sub">Printing Solutions</span>
      </span>
    );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('#home');
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on(); window.addEventListener('scroll', on, { passive: true });
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive('#' + e.target.id)), { threshold: .35 });
    NAV.forEach(([, h]) => { const s = document.querySelector(h); s && io.observe(s); });
    return () => { window.removeEventListener('scroll', on); io.disconnect(); };
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, []);
  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <a href="#home" className="logo-link" aria-label="JSA Printing Solutions — home"><Brand light={!scrolled} /></a>
      <nav id="primary-nav" aria-label="Primary" className={`nav ${open ? 'open' : ''}`}>
        {NAV.map(([l, h]) => <a key={h} href={h} className={active === h ? 'active' : ''} onClick={() => setOpen(false)}>{l}</a>)}
        <a href="#contact" className="btn btn-gold nav-cta" onClick={() => setOpen(false)}>Request a Quote</a>
      </nav>
      <button className="burger" aria-expanded={open} aria-controls="primary-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}>
        <span /><span />
      </button>
    </header>
  );
}

function Hero() {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (failed || paused || reduced) return;
    const id = window.setTimeout(() => setIdx(i => (i + 1) % SCENES.length), (DURATIONS[idx] + 0.9 + (idx === 0 ? 1 : 0)) * 1000);
    return () => window.clearTimeout(id);
  }, [idx, failed, paused, reduced]);
  const last = idx === SCENES.length - 1;
  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <div className="hero-bg" />
      {failed
        ? <div className="hero3d hero-fallback" role="img" aria-label="Printed hang tags, business cards and garment boxes">
            <img src="/images/hang_tag.jpg" alt="" /><img src="/images/business_cards.jpg" alt="" /><img src="/images/garment_box.jpg" alt="" />
          </div>
        : <Hero3D index={idx} onFail={onFail} />}
      <div className="hero-copy">
        <p className="eyebrow reveal-line"><span className="rule" /> Offset printing · Labels · Packaging</p>
        <h1 id="hero-title" className="hero-title" aria-label="Print That Makes Your Brand Impossible to Ignore.">
          <span className="line"><Chars text="Print That Makes" start={0.4} /></span>
          <span className="line"><Chars text="Your Brand" start={0.8} /></span>
          <span className="line italic gold-text"><Chars text="Impossible to Ignore." start={1.1} /></span>
        </h1>
        <p className="hero-sub fade-up" style={{ animationDelay: '1.9s' }}>From distinctive labels and packaging to premium business stationery, we transform your brand into beautifully crafted print experiences.</p>
        <div className="hero-ctas fade-up" style={{ animationDelay: '2.2s' }}>
          <a className="btn btn-gold" href="#services">Explore Our Services</a>
          <a className="btn btn-ghost" href="#contact">Request a Quote</a>
        </div>
      </div>
      {!failed && (
        <div className="scene-bar" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <p className="scene-caption" aria-live="polite" key={idx}><b>0{idx + 1}</b> {SCENES[idx].title}<span>{SCENES[idx].note}</span></p>
          <div className="scene-dots" role="tablist" aria-label="Printing scenes">
            {SCENES.map((s, i) => (
              <button key={s.title} role="tab" aria-selected={i === idx} aria-label={`Scene ${i + 1}: ${s.title}`} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)}>
                <i style={i === idx && !paused && !reduced ? { animationDuration: `${DURATIONS[i] + 0.9}s` } : undefined} />
              </button>
            ))}
          </div>
        </div>
      )}
      {last && !failed && (
        <div className="scene-cta" key="cta">
          <span className="scene-cta-brand">JSA Printing Solutions</span>
          <span>Labels, stickers and packaging, crafted for your brand.</span>
          <a className="btn btn-gold" href="#contact">Request a Quote</a>
        </div>
      )}
    </section>
  );
}

function SectionHead({ kicker, title, children, light }: { kicker: string; title: ReactNode; children?: ReactNode; light?: boolean }) {
  return (
    <div className={`sec-head ${light ? 'light' : ''}`} data-reveal>
      <p className="eyebrow"><span className="rule" /> {kicker}</p>
      <h2>{title}</h2>
      {children && <p className="lead">{children}</p>}
    </div>
  );
}

function About() {
  return (
    <section id="about" className="section about">
      <div className="container about-grid">
        <div>
          <SectionHead kicker="About JSA" title={<>Print is <em>craft</em>, material and precision.</>}>
            JSA Printing Solutions is an offset printing company delivering print solutions to its clients — from labels, tags and stickers to stationery and promotional print.
          </SectionHead>
          <p className="body" data-reveal>Every product we make is judged on the details: the stock, the finish, the register of the ink and the foil. We treat each job as an extension of your brand.</p>
          <p className="note" data-reveal>Company history and figures can be added here once confirmed from the company profile.</p>
        </div>
        <div className="about-art" data-reveal>
          <figure className="art-main"><img loading="lazy" src="/images/business_cards.jpg" alt="Thick foil-stamped business cards on marble" width="1200" height="896" /></figure>
          <figure className="art-small"><img loading="lazy" src="/images/hang_tag.jpg" alt="Hang tag detail with gold foil and string" width="1200" height="896" /></figure>
          <div className="art-tag">Foil · Emboss · Offset</div>
        </div>
      </div>
    </section>
  );
}

function Services({ onPick }: { onPick: (s: string) => void }) {
  return (
    <section id="services" className="section services">
      <div className="container">
        <SectionHead kicker="Our Services" title={<>Everything your brand <em>wears, carries and hands over.</em></>}>
          Thirteen core print services and ten product lines from our catalogue, grouped by how they are used.
        </SectionHead>
        <div className="svc-list">
          {GROUPS.map((g, i) => (
            <article key={g.title} className={`svc svc-${g.tone} ${i % 2 ? 'flip' : ''}`} data-reveal>
              <div className="svc-img"><img loading="lazy" src={g.img} alt={g.alt} width="1200" height="896" /></div>
              <div className="svc-body">
                <span className="svc-no">0{i + 1}</span>
                <h3>{g.title}</h3>
                <p>{g.desc}</p>
                <ul className="chips">
                  {g.items.map(it => <li key={it}><button type="button" onClick={() => onPick(it)} title={`Enquire about ${it}`}>{it}</button></li>)}
                </ul>
                <a className="link-arrow" href="#contact" onClick={() => onPick(g.items[0])}>Enquire about this range →</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  const [cur, setCur] = useState(0);
  const [open, setOpen] = useState(false);
  const item = SHOWCASE[cur];
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') setCur(c => (c + 1) % SHOWCASE.length);
      if (e.key === 'ArrowLeft') setCur(c => (c - 1 + SHOWCASE.length) % SHOWCASE.length);
    };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [open]);
  return (
    <section id="products" className="section showcase">
      <div className="container">
        <SectionHead light kicker="Signature Products" title={<>The detail <em>is</em> the product.</>}>Select a product to explore it up close.</SectionHead>
        <div className="show-grid" data-reveal>
          <div className="show-tabs" role="tablist" aria-label="Product categories">
            {SHOWCASE.map((s, i) => (
              <button key={s.id} role="tab" aria-selected={i === cur} className={i === cur ? 'on' : ''} onClick={() => setCur(i)}>
                <span>0{i + 1}</span>{s.label}
              </button>
            ))}
          </div>
          <button className="show-stage" onClick={() => setOpen(true)} aria-label={`Open larger view of ${item.label}`}>
            <img key={item.id} src={item.img} alt={item.alt} width="1200" height="896" />
            <span className="show-cap"><b>{item.label}</b>{item.note}<em>Click to enlarge</em></span>
          </button>
        </div>
      </div>
      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.label} onClick={() => setOpen(false)}>
          <button className="lb-x" aria-label="Close" onClick={() => setOpen(false)}>×</button>
          <img src={item.img} alt={item.alt} onClick={e => e.stopPropagation()} />
          <p>{item.label} — {item.note}</p>
        </div>
      )}
    </section>
  );
}

function Vision() {
  return (
    <section id="vision" className="section vision">
      <div className="container">
        <SectionHead kicker="Our Vision & Mission" title={<>Where we are going, <em>and how we get there.</em></>} />
        <div className="vm">
          <blockquote data-reveal className="vm-block emerald">
            <h3>Our Vision</h3>
            <p>“To be the premier offset printing company recognized for its innovation, quality &amp; sustainable practices, driving success for our clients.”</p>
          </blockquote>
          <div className="vm-photo" data-reveal><img loading="lazy" src="/images/leather_patch.jpg" alt="Debossed leather patch with stitched border" width="1200" height="896" /></div>
          <blockquote data-reveal className="vm-block burgundy">
            <h3>Our Mission</h3>
            <p>“To deliver outstanding print solutions to our clients while ensuring exceptional customer service, environmental sustainability, and the continual advancement of our technology and skills.”</p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section className="section process" aria-labelledby="process-h">
      <div className="container">
        <SectionHead kicker="How We Work" title={<span id="process-h">A simple path from <em>idea to delivery.</em></span>}>A suggested way to work with us — adjusted to each order.</SectionHead>
        <ol className="steps">
          {STEPS.map(([t, d], i) => (
            <li key={t} data-reveal style={{ transitionDelay: `${i * 0.12}s` }}>
              <span className="step-no">0{i + 1}</span>
              <h3>{t}</h3><p>{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

type Errs = Partial<Record<'name' | 'contact' | 'service' | 'details', string>>;

function Contact({ service, setService }: { service: string; setService: (s: string) => void }) {
  const [errs, setErrs] = useState<Errs>({});
  const [status, setStatus] = useState<{ type: 'idle' | 'sending' | 'ok' | 'err' | 'unconfigured'; msg?: string; text?: string }>({ type: 'idle' });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? '').trim();
    const x: Errs = {};
    if (v('name').length < 2) x.name = 'Please enter your name.';
    const c = v('contact');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) && !/^[+\d][\d\s()-]{6,}$/.test(c)) x.contact = 'Enter a valid email address or phone number.';
    if (!v('service')) x.service = 'Please choose a product or service.';
    if (v('details').length < 10) x.details = 'Please describe your project (at least 10 characters).';
    setErrs(x);
    if (Object.keys(x).length) { setStatus({ type: 'idle' }); return; }
    const text = `Name: ${v('name')}\nContact: ${c}\nProduct/Service: ${v('service')}\nQuantity: ${v('qty') || '—'}\nDetails: ${v('details')}`;
    if (!FORM_ENDPOINT) { setStatus({ type: 'unconfigured', text }); return; }
    setStatus({ type: 'sending' });
    try {
      const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.fromEntries(f)) });
      if (!r.ok) throw new Error(String(r.status));
      setStatus({ type: 'ok' }); (e.target as HTMLFormElement).reset();
    } catch { setStatus({ type: 'err', msg: 'We could not send your enquiry. Please try again or contact us directly.' }); }
  };

  return (
    <section id="contact" className="section contact">
      <div className="container contact-grid">
        <div data-reveal>
          <SectionHead light kicker="Contact" title={<>Let’s print something <em>worth keeping.</em></>}>Tell us what you need and we’ll get back to you.</SectionHead>
          <ul className="contact-list">
            {CONTACTS.map(c => (
              <li key={c.role}>
                <h3>{c.role}</h3>
                <a className="tel" href={tel(c.phone)}>{c.phone}</a>
                {c.address && <p>{c.address}</p>}
              </li>
            ))}
            <li><h3>Email</h3><p className="ph">{EMAIL}</p></li>
          </ul>
        </div>
        <form className="form" onSubmit={submit} noValidate data-reveal aria-describedby="form-status">
          <label>Your name<input name="name" autoComplete="name" aria-invalid={!!errs.name} />{errs.name && <small role="alert">{errs.name}</small>}</label>
          <label>Email or phone<input name="contact" autoComplete="email" aria-invalid={!!errs.contact} />{errs.contact && <small role="alert">{errs.contact}</small>}</label>
          <label>Product / service
            <select name="service" value={service} onChange={e => setService(e.target.value)} aria-invalid={!!errs.service}>
              <option value="">Select…</option>
              {ALL_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            {errs.service && <small role="alert">{errs.service}</small>}
          </label>
          <label>Quantity (optional)<input name="qty" inputMode="numeric" placeholder="e.g. 5,000 pcs" /></label>
          <label>Project details<textarea name="details" rows={4} aria-invalid={!!errs.details} />{errs.details && <small role="alert">{errs.details}</small>}</label>
          <button className="btn btn-gold" type="submit" disabled={status.type === 'sending'}>{status.type === 'sending' ? 'Sending…' : 'Send Enquiry'}</button>
          <div id="form-status" aria-live="polite">
            {status.type === 'ok' && <p className="msg ok">Thank you — your enquiry was sent.</p>}
            {status.type === 'err' && <p className="msg bad">{status.msg}</p>}
            {status.type === 'unconfigured' && (
              <div className="msg bad">
                <p><b>Not sent.</b> Email delivery isn’t configured yet (set <code>VITE_FORM_ENDPOINT</code>). Your enquiry was validated but nothing was submitted.</p>
                <button type="button" className="btn btn-ghost sm" onClick={() => navigator.clipboard?.writeText(status.text ?? '')}>Copy enquiry text</button>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container foot-grid">
        <div><Brand light /><p className="foot-statement">Craftsmanship, material and precision — printed for your brand.</p></div>
        <nav aria-label="Footer services"><h4>Services</h4><ul>{['Hang Tags', 'Labels', 'Woven Labels', 'Garment Boxes', 'Business Cards', 'Foil Stamping'].map(s => <li key={s}><a href="#services">{s}</a></li>)}</ul></nav>
        <nav aria-label="Footer"><h4>Explore</h4><ul>{NAV.map(([l, h]) => <li key={h}><a href={h}>{l}</a></li>)}</ul></nav>
        <div><h4>Contact</h4><ul className="ph-list">{CONTACTS.map(c => <li key={c.role}><b>{c.role}</b><br /><a href={tel(c.phone)}>{c.phone}</a>{c.address && <><br />{c.address}</>}</li>)}</ul></div>
      </div>
      <p className="copy">© {new Date().getFullYear()} JSA Printing Solutions. All rights reserved.</p>
    </footer>
  );
}

export default function App() {
  const [service, setService] = useState('');
  useReveal();
  const pick = (s: string) => setService(s);
  return (
    <>
      <a className="skip" href="#about">Skip to content</a>
      <Header />
      <main>
        <Hero />
        <About />
        <Services onPick={pick} />
        <Showcase />
        <Vision />
        <Process />
        <Contact service={service} setService={setService} />
      </main>
      <Footer />
    </>
  );
}
