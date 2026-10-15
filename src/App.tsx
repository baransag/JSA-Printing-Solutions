import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Hero3D, { SCENES, DURATIONS } from './components/Hero3D';
import './App.css';

/* ---------- BRAND ASSETS & CONSTANTS ---------- */
const LOGO_SRC = '/images/jsa-logo.png';
const WHATSAPP_MAIN_NUM = '923216610075'; // City Office / Main Branch WhatsApp

const CONTACTS = [
  {
    role: 'City Office / Main Branch',
    phone: '0321 6610075',
    cleanPhone: '923216610075',
    address: 'First Floor, Azra Center, Munshi Muhala, Street #06, Amipur Bazar, Faisalabad.',
    note: 'General enquiries, sample viewing & order placements',
  },
  {
    role: 'Marketing Office',
    phone: '0321 6684665',
    cleanPhone: '923216684665',
    address: '82-B Commercial Center, Millat Chowk, Sheikhupura Road, opposite Laraib Bouquet Hall, Faisalabad 38000.',
    note: 'Corporate branding, contract printing & delivery coordination',
  },
  {
    role: 'Contact Person',
    phone: '0300 0197459',
    cleanPhone: '923000197459',
    address: '',
    note: 'Direct project consultation & urgent quotes',
  },
] as const;

const tel = (p: string) => `tel:+92${p.replace(/\s/g, '').replace(/^0/, '')}`;
const waLink = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT ?? '';

const NAV = [
  ['Home', '#home'],
  ['Featured Products', '#featured-products'],
  ['Services', '#services'],
  ['About JSA', '#about'],
  ['Vision & Mission', '#vision'],
  ['Contact', '#contact'],
] as const;

/* ---------- COMPREHENSIVE PRODUCT CATALOG WITH MULTIPLE IMAGES ---------- */
export interface ProductItem {
  id: string;
  name: string;
  tagline: string;
  category: string;
  featured: boolean;
  priority: number;
  primaryImage: string;
  gallery: { src: string; title: string; desc: string }[];
  description: string;
  customOptions: {
    shapes?: string[];
    finishes?: string[];
    materials?: string[];
    sizes?: string[];
    defaultQty?: string;
  };
  highlights: string[];
}

export const PRODUCTS: ProductItem[] = [
  {
    id: 'garment-boxes',
    name: 'Custom Garment Boxes',
    tagline: 'Luxury rigid apparel boxes, magnetic flaps, sliding drawers & presentation packaging',
    category: 'Packaging & Boxes',
    featured: true,
    priority: 1,
    primaryImage: '/images/garment_box_emerald.jpg',
    gallery: [
      { src: '/images/garment_box_emerald.jpg', title: 'Magnetic Closure Box', desc: 'Deep emerald board with antique gold hot foil crest and double border.' },
      { src: '/images/garment_box_drawer.jpg', title: 'Sliding Drawer Box', desc: 'Warm ivory linen card with gold foil and luxury satin ribbon pull tab.' },
      { src: '/images/garment_box.jpg', title: 'Collapsible Rigid Box', desc: 'Rich burgundy matte finish with gold embossed coat-of-arms and gold ribbon.' },
    ],
    description: 'Bespoke custom garment boxes engineered to elevate your brand presence. Manufactured with heavyweight rigid cardboard, custom die-cut dimensions, magnetic closures, and premium interior tissue wrapping. Every box is crafted to make unboxing an unforgettable luxury experience.',
    customOptions: {
      shapes: ['Magnetic Flap Box', 'Sliding Drawer with Ribbon Pull', 'Two-Piece Lid & Base', 'Book-Style Fold Box'],
      finishes: ['Hot Stamping Gold Foil', 'Matte Velvet Soft-Touch', 'Spot Gloss UV', 'Blind Embossing'],
      materials: ['1200gsm Rigid Kappa Board', 'Textured Linen Paper Wrap', 'Kraft Eco-Board', 'Satin Tissue Lining'],
      sizes: ['Small (Shirt / Scarf)', 'Medium (Hoodie / Knitwear)', 'Large (Suit / Jacket / Denim)', 'Custom Tailored Dimensions'],
      defaultQty: '500 pcs',
    },
    highlights: ['Bespoke structural engineering', 'High-precision foil registration', 'Magnetic & ribbon pull mechanisms', 'Interior branded wrapping'],
  },
  {
    id: 'hang-tags',
    name: 'Garment Hang Tags',
    tagline: 'Multi-layer cardstock tags, metallic eyelets, organic cord & wax seal accents',
    category: 'Tags, Labels & Stickers',
    featured: true,
    priority: 2,
    primaryImage: '/images/hang_tags_collection.jpg',
    gallery: [
      { src: '/images/hang_tags_collection.jpg', title: 'Brand Tag Collection', desc: 'Burgundy, emerald, and ivory tags with wax seal cord and gold foil.' },
      { src: '/images/hang_tag.jpg', title: 'Luxury Minimal Ivory Tag', desc: 'Embossed gold foil typography with antique gold brass grommet and cotton twine.' },
      { src: '/images/leather_patch.jpg', title: 'Denim Leather Tag Combo', desc: 'Debossed leather patch paired with printed cardstock for premium denim.' },
    ],
    description: 'Distinguished apparel hang tags that reflect the quality of the garments they accompany. Available in heavyweight cotton cardstock, duplex/triplex multi-layered paper with sandwich colored edges, precision die-cut shapes, brass eyelets, and customized string cords.',
    customOptions: {
      shapes: ['Classic Rounded Rectangle', 'Custom Die-Cut Contour', 'Fold-Over Booklet Tag', 'Slim Tag Duo Set'],
      finishes: ['Antique Gold Foil', 'Debossed Relief Pattern', 'Matte Soft-Touch', 'Spot UV Sheen'],
      materials: ['450gsm – 800gsm Cotton Stock', 'Textured Linen Card', 'Kraft Stock', 'Sandwich Colored Core'],
      sizes: ['Standard 50 x 90 mm', 'Slim 35 x 110 mm', 'Square 65 x 65 mm', 'Custom Die-Cut Size'],
      defaultQty: '1,000 pcs',
    },
    highlights: ['Brass and antique gold eyelets', 'Twisted cotton or waxed cord', 'Multi-layer paper thickness', 'Sharp offset & foil clarity'],
  },
  {
    id: 'care-labels',
    name: 'Printed Care Labels & Fabric Labels',
    tagline: 'Soft woven satin, organic cotton ribbon, wash care symbols & size strips',
    category: 'Garment Labelling',
    featured: true,
    priority: 3,
    primaryImage: '/images/care_labels_fabric.jpg',
    gallery: [
      { src: '/images/care_labels_fabric.jpg', title: 'Satin Care Instruction Label', desc: 'Razor-sharp international wash symbols and size matrix on soft satin.' },
      { src: '/images/woven_labels.jpg', title: 'Woven Damask Neck Label', desc: 'High-density gold metallic threading on deep navy/emerald woven base.' },
    ],
    description: 'High-definition printed fabric care labels engineered for exceptional wash resistance and skin-soft comfort. Printed on premium satin, organic cotton, or polyester ribbon with non-fading inks compliant with international apparel regulations and care standards.',
    customOptions: {
      shapes: ['Center Folded', 'End Folded', 'Straight Cut / Hot Cut', 'Mitre Fold'],
      finishes: ['Anti-Fray Ultrasonic Heat Cut', 'Glossy Satin Weave', 'Matte Natural Cotton'],
      materials: ['Single / Double Face Polyester Satin', '100% Organic Cotton Ribbon', 'Taffeta Base'],
      sizes: ['25 mm width', '30 mm width', '35 mm width', '40 mm width'],
      defaultQty: '2,000 pcs',
    },
    highlights: ['Skin-friendly soft edges', 'Non-fade wash resistance', 'International care symbol libraries', 'Custom size variations'],
  },
  {
    id: 'insert-cards',
    name: 'Packaging Insert Cards & Thank You Cards',
    tagline: 'Luxury customer appreciation inserts, brand stories & product care cards',
    category: 'Cards & Stationery',
    featured: true,
    priority: 4,
    primaryImage: '/images/insert_cards_apparel.jpg',
    gallery: [
      { src: '/images/insert_cards_apparel.jpg', title: 'Thank You Packaging Inserts', desc: 'Warm ivory textured cotton stock with embossed gold foil monogram.' },
      { src: '/images/canvas_cards_luxury.jpg', title: 'Botanical Brand Story Card', desc: 'Heavy canvas-textured paper with blind deboss details.' },
    ],
    description: 'Tactile packaging insert cards placed inside garment boxes and shipping bags. A powerful branding touchpoint to convey customer gratitude, washing guidelines, brand pedigree, and discount vouchers on heavyweight textured cotton stock.',
    customOptions: {
      shapes: ['A6 Postcard Format', 'Square 120 x 120 mm', 'Slim Bookmark Insert', 'Gatefold Card'],
      finishes: ['Gold Foil Monogram', 'Blind Letterpress Deboss', 'Smooth Matte Finish'],
      materials: ['350gsm Textured Cotton', 'Ivory Felt Paper', 'Eco Recycled Fibers'],
      sizes: ['105 x 148 mm (A6)', '100 x 100 mm', '90 x 150 mm', 'Custom'],
      defaultQty: '1,000 pcs',
    },
    highlights: ['Warm tactile paper textures', 'Foil stamped appreciation notes', 'Matches garment box suites', 'Double-sided offset printing'],
  },
  {
    id: 'header-cards',
    name: 'Retail Header Cards',
    tagline: 'Fold-over packaging cards with euro slot punch for retail display pegs',
    category: 'Packaging & Boxes',
    featured: true,
    priority: 5,
    primaryImage: '/images/header_cards_retail.jpg',
    gallery: [
      { src: '/images/header_cards_retail.jpg', title: 'Botanical Display Header Cards', desc: 'Folded emerald cards with euro slot peg punch and gold foil detailing.' },
    ],
    description: 'Heavyweight cardstock header cards designed to staple or seal over polybags for apparel, socks, accessories, and textile goods. Features precision pre-creasing and clean euro-slot punch holes for retail peg displays.',
    customOptions: {
      shapes: ['Standard Fold-Over', 'Shaped Header with Contour Cut'],
      finishes: ['Gloss Laminate', 'Matte Velvet', 'Spot UV Header'],
      materials: ['350gsm Coated Board', '400gsm Heavy Cardstock'],
      sizes: ['80 x 100 mm (folded to 50mm)', '100 x 120 mm', '120 x 140 mm', 'Custom bag width'],
      defaultQty: '2,500 pcs',
    },
    highlights: ['Euro-slot punch compatibility', 'Crisp mechanical creasing', 'High-strength bag closure', 'Vibrant retail offset graphics'],
  },
  {
    id: 'canvas-cards',
    name: 'Canvas Cards & Specialty Prints',
    tagline: 'Artisan textured canvas paper, blind debossed relief & corporate stationery',
    category: 'Cards & Stationery',
    featured: true,
    priority: 6,
    primaryImage: '/images/canvas_cards_luxury.jpg',
    gallery: [
      { src: '/images/canvas_cards_luxury.jpg', title: 'Artisan Canvas Suite', desc: 'Textured canvas paper with blind deboss floral relief and antique gold foil.' },
      { src: '/images/business_cards.jpg', title: 'Sandwich Edge Cards', desc: 'Ultra-thick business cards on Italian marble setting.' },
    ],
    description: 'Artisan canvas-textured cards, invitations, and promotional prints with a genuine woven fabric feel on paper. Perfect for high-end fashion lookbooks, limited collection cards, and certificates of authenticity.',
    customOptions: {
      shapes: ['Deckled Edge Artisan Card', 'Straight Cut Modern Card', 'Tri-Fold Invitation'],
      finishes: ['Deep Blind Embossing', 'Antique Gold Foil', 'Letterpress Ink Impression'],
      materials: ['Natural Canvas Paper 400gsm', 'Handmade Deckled Cotton', 'Warm White Wove'],
      sizes: ['A5 (148 x 210 mm)', '5 x 7 inches', 'A6 (105 x 148 mm)'],
      defaultQty: '500 pcs',
    },
    highlights: ['Distinctive textile-paper feel', 'High-relief blind debossing', 'Handmade appeal', 'Artisan stationery grade'],
  },
  {
    id: 'custom-stickers',
    name: 'Custom Labels, Stickers & Barcode Rolls',
    tagline: 'Die-cut product packaging stickers, gold foil seals, thermal barcodes & carton decals',
    category: 'Tags, Labels & Stickers',
    featured: true,
    priority: 7,
    primaryImage: '/images/custom_stickers_sheet.jpg',
    gallery: [
      { src: '/images/custom_stickers_sheet.jpg', title: 'Packaging Seal Stickers', desc: 'Round coffee/product seals, gold foil embossed badges, and barcode labels.' },
    ],
    description: 'Precision die-cut stickers and high-speed roll labels. From glossy waterproof vinyl product labels to luxury metallic embossed wafer seals and industrial scannable barcode shipping stickers.',
    customOptions: {
      shapes: ['Custom Kiss-Cut Sheet', 'Continuous Roll Labels', 'Die-Cut Individual Stickers', 'Round Seal'],
      finishes: ['Gold Foil Embossed', 'High-Gloss UV Coat', 'Matte Weatherproof Vinyl'],
      materials: ['Adhesive Coated Paper', 'Clear Transparent BOPP', 'Metallic Gold/Silver Foil Stock', 'Thermal Transfer Paper'],
      sizes: ['30 mm – 150 mm custom sizes'],
      defaultQty: '1,000 pcs',
    },
    highlights: ['Industrial peel-and-stick adhesive', 'Roll or sheet formats', 'Barcode & QR scannability', 'Waterproof & tear resistant'],
  },
  {
    id: 'business-cards',
    name: 'Executive Business Cards & Stationery',
    tagline: 'Ultra-thick 700gsm cotton triplex, antique gold foil stamping & letterheads',
    category: 'Cards & Stationery',
    featured: true,
    priority: 8,
    primaryImage: '/images/business_cards.jpg',
    gallery: [
      { src: '/images/business_cards.jpg', title: 'Triplex Foil Cards', desc: 'Emerald green surface with visible sandwich layer edges and antique gold typography.' },
      { src: '/images/canvas_cards_luxury.jpg', title: 'Coordinated Letterhead Suite', desc: 'Matching cotton envelopes and watermarked writing pads.' },
    ],
    description: 'Executive corporate business cards with substantial hand-feel. Crafted with multi-layered colored sandwich cores, hot stamped antique gold foil, and velvet soft-touch lamination, complemented by official letterheads and writing pads.',
    customOptions: {
      shapes: ['Standard 85 x 55 mm', 'US 3.5 x 2.0 inches', 'Square 60 x 60 mm'],
      finishes: ['Double-Sided Hot Foil', 'Colored Painted Edges', 'Velvet Soft-Touch', 'Spot UV'],
      materials: ['600gsm – 800gsm Cotton Triplex', 'Heavy Linen Card', 'Duplex Emerald & Ivory'],
      sizes: ['85 x 55 mm', '90 x 50 mm'],
      defaultQty: '500 pcs',
    },
    highlights: ['Colored core sandwich layer', 'Metallic foil edge gilding', 'Architectural rigidity', 'Executive stationery matching'],
  },
];

/* ---------- ALL 23 SERVICES GROUPED ACCORDING TO COMPANY PROFILE ---------- */
const ALL_SERVICE_CATEGORIES = [
  {
    title: 'Packaging & Garment Boxes',
    tone: 'emerald',
    img: '/images/garment_box_emerald.jpg',
    desc: 'High-end structural garment boxes, collapsible rigid packaging, and custom printed packing bands.',
    items: ['Garment Boxes', 'Packing Bands', 'Rigid Magnetic Boxes', 'Sliding Drawer Packaging'],
  },
  {
    title: 'Hang Tags & Die-Cut Cards',
    tone: 'burgundy',
    img: '/images/hang_tags_collection.jpg',
    desc: 'Bespoke apparel hang tags with metallic brass eyelets, foil stamping, insert cards, and header cards.',
    items: ['Hang Tags', 'Insert Cards', 'Header Cards', 'Barcode Price Tickets', 'Canvas Cards'],
  },
  {
    title: 'Garment Labelling & Patches',
    tone: 'ivory',
    img: '/images/care_labels_fabric.jpg',
    desc: 'Printed fabric care labels, high-definition woven damask labels, and stitched leather jeans patches.',
    items: ['Printed Fabric Labels', 'Woven Labels', 'Leather Patches', 'Size Strips'],
  },
  {
    title: 'Stickers, Decals & Barcodes',
    tone: 'emerald',
    img: '/images/custom_stickers_sheet.jpg',
    desc: 'Industrial thermal roll stickers, carton shipping decals, product packaging labels, and metallic seals.',
    items: ['Labels', 'Stickers', 'Thermal Stickers', 'Barcode & Carton Stickers', 'Decal Stickers'],
  },
  {
    title: 'Stationery & Corporate Print',
    tone: 'ivory',
    img: '/images/business_cards.jpg',
    desc: 'Foil-stamped business cards, letterheads, writing pads, brochures, manuals, calendars, and award shields.',
    items: ['Business Cards', 'Letterheads', 'Writing Pads', 'Brochures', 'Flyers', 'Manuals', 'Calendars', 'Award Shields', 'Foil Stamping'],
  },
];

/* ---------- HELPER HOOKS ---------- */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function Chars({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {text.split(' ').map((w, wi, arr) => (
        <span className="word" key={wi} aria-hidden="true">
          {w.split('').map((c, i) => (
            <span className="ch" key={i} style={{ animationDelay: `${start + (wi * 4 + i) * 0.022}s` }}>
              {c}
            </span>
          ))}
          {wi < arr.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </>
  );
}

/* ---------- BRAND LOGO COMPONENT ---------- */
function Brand({ light }: { light?: boolean }) {
  return (
    <div className={`brand-wrapper ${light ? 'light' : ''}`}>
      <img
        src={LOGO_SRC}
        alt="JSA Printing Solutions — WE DESIGN, WE PRINT, WE CARE."
        className="brand-logo-img"
        width="180"
        height="84"
      />
    </div>
  );
}

/* ---------- FLOATING WHATSAPP BUTTON ---------- */
function FloatingWhatsApp() {
  const defaultMsg = 'Assalam-o-Alaikum JSA Printing Solutions, I would like to enquire about your custom printing services.';
  return (
    <a
      href={waLink(WHATSAPP_MAIN_NUM, defaultMsg)}
      target="_blank"
      rel="noopener noreferrer"
      className="floating-wa"
      aria-label="Chat with JSA on WhatsApp"
      title="Chat with JSA Printing Solutions on WhatsApp"
    >
      <div className="wa-icon-pulse" />
      <svg className="wa-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.031 2C6.511 2 2.016 6.477 2.016 11.979c0 1.83.504 3.614 1.464 5.174L2 22l4.98-1.428a9.972 9.972 0 0 0 5.051 1.396h.004c5.518 0 10.015-4.477 10.015-9.98C22.05 6.477 17.551 2 12.031 2zm5.787 14.283c-.244.684-1.417 1.309-1.954 1.39-.488.073-1.127.106-3.633-.925-2.146-.882-3.528-3.056-3.635-3.198-.106-.143-.872-1.157-.872-2.207 0-1.05.552-1.567.747-1.782.196-.215.426-.269.568-.269.143 0 .285.002.408.008.13.007.304-.049.475.362.176.425.602 1.466.654 1.573.053.107.089.232.018.375-.072.143-.108.232-.215.357-.107.125-.225.279-.322.375-.107.107-.218.223-.095.434.123.212.547.902 1.173 1.46 0.806.718 1.486.94 1.698 1.047.213.107.337.089.462-.054.125-.143.534-.625.677-.84.142-.214.285-.178.479-.107.195.071 1.238.583 1.45.69.213.107.355.161.408.25.053.089.053.518-.191 1.202z"/>
      </svg>
      <span className="wa-label">WhatsApp Enquiry</span>
    </a>
  );
}

/* ---------- SITE HEADER ---------- */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('#home');

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive('#' + e.target.id)),
      { threshold: 0.3 }
    );
    NAV.forEach(([, h]) => {
      const s = document.querySelector(h);
      if (s) io.observe(s);
    });
    return () => {
      window.removeEventListener('scroll', on);
      io.disconnect();
    };
  }, []);

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <a href="#home" className="logo-link" aria-label="JSA Printing Solutions — Home">
        <Brand light={!scrolled} />
      </a>
      <nav id="primary-nav" aria-label="Primary Navigation" className={`nav ${open ? 'open' : ''}`}>
        {NAV.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className={active === href ? 'active' : ''}
            onClick={() => setOpen(false)}
          >
            {label}
          </a>
        ))}
        <a href="#contact" className="btn btn-gold nav-cta" onClick={() => setOpen(false)}>
          Request a Quote
        </a>
      </nav>
      <button
        className="burger"
        aria-expanded={open}
        aria-controls="primary-nav"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
      </button>
    </header>
  );
}

/* ---------- HERO SECTION (ENERGETIC 3D PRODUCTION STUDIO) ---------- */
function Hero() {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (failed || paused || reduced) return;
    const timeoutDuration = (DURATIONS[idx] + 0.6) * 1000;
    const id = window.setTimeout(() => setIdx((i) => (i + 1) % SCENES.length), timeoutDuration);
    return () => window.clearTimeout(id);
  }, [idx, failed, paused, reduced]);

  const last = idx === SCENES.length - 1;

  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <div className="hero-bg" />
      {failed ? (
        <div className="hero3d hero-fallback" role="img" aria-label="JSA Printed garment boxes, hang tags, and woven labels">
          <img src="/images/garment_box_emerald.jpg" alt="Emerald garment box" />
          <img src="/images/hang_tags_collection.jpg" alt="Hang tag collection" />
          <img src="/images/custom_stickers_sheet.jpg" alt="Custom stickers and labels" />
        </div>
      ) : (
        <Hero3D index={idx} onFail={onFail} />
      )}

      <div className="hero-copy">
        <p className="eyebrow reveal-line">
          <span className="rule" /> Custom Printing · Garment Packaging · Tags & Labels
        </p>
        <h1 id="hero-title" className="hero-title" aria-label="Print That Makes Your Brand Impossible to Ignore.">
          <span className="line"><Chars text="Print That Makes" start={0.2} /></span>
          <span className="line"><Chars text="Your Brand" start={0.45} /></span>
          <span className="line italic gold-text"><Chars text="Impossible to Ignore." start={0.7} /></span>
        </h1>
        <p className="hero-sub fade-up" style={{ animationDelay: '1.1s' }}>
          From distinctive labels and packaging to premium business stationery, we transform your brand into beautifully crafted print experiences.
        </p>
        <div className="hero-ctas fade-up" style={{ animationDelay: '1.3s' }}>
          <a className="btn btn-gold" href="#featured-products">
            Explore Custom Products
          </a>
          <a className="btn btn-ghost" href="#contact">
            Request a Quote
          </a>
        </div>
      </div>

      {!failed && (
        <div className="scene-bar" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <p className="scene-caption" aria-live="polite" key={idx}>
            <b>0{idx + 1}</b> {SCENES[idx].title}
            <span>{SCENES[idx].note}</span>
          </p>
          <div className="scene-dots" role="tablist" aria-label="Printing scenes">
            {SCENES.map((s, i) => (
              <button
                key={s.title}
                role="tab"
                aria-selected={i === idx}
                aria-label={`Production Scene ${i + 1}: ${s.title}`}
                className={i === idx ? 'on' : ''}
                onClick={() => setIdx(i)}
              >
                <i style={i === idx && !paused && !reduced ? { animationDuration: `${DURATIONS[i] + 0.6}s` } : undefined} />
              </button>
            ))}
          </div>
        </div>
      )}

      {last && !failed && (
        <div className="scene-cta" key="final-cta">
          <span className="scene-cta-brand">JSA Printing Solutions</span>
          <span>Fresh stickers & labels rolling off the press.</span>
          <a className="btn btn-gold" href="#contact">Discuss Your Print Job</a>
        </div>
      )}
    </section>
  );
}

/* ---------- SECTION HEADER HELPER ---------- */
function SectionHead({
  kicker,
  title,
  children,
  light,
}: {
  kicker: string;
  title: ReactNode;
  children?: ReactNode;
  light?: boolean;
}) {
  return (
    <div className={`sec-head ${light ? 'light' : ''}`} data-reveal>
      <p className="eyebrow"><span className="rule" /> {kicker}</p>
      <h2>{title}</h2>
      {children && <p className="lead">{children}</p>}
    </div>
  );
}

/* ---------- FEATURED PRODUCTS SECTION (PRIORITY COLLECTION) ---------- */
function FeaturedProducts({ onSelectProduct }: { onSelectProduct: (product: ProductItem) => void }) {
  return (
    <section id="featured-products" className="section featured-products">
      <div className="container">
        <SectionHead
          kicker="Custom Printing Showcase"
          title={<>Masterfully crafted <em>garment packaging, tags &amp; labels.</em></>}
        >
          Explore our premier customized printing products. Click any item to inspect multiple design photographs, explore custom specifications, and request an instant quotation via WhatsApp.
        </SectionHead>

        {/* Priority 1 Spotlight: Custom Garment Boxes */}
        {(() => {
          const boxProduct = PRODUCTS[0];
          return (
            <article className="spotlight-card" data-reveal onClick={() => onSelectProduct(boxProduct)}>
              <div className="spotlight-grid">
                <div className="spotlight-visual">
                  <img
                    src={boxProduct.primaryImage}
                    alt={boxProduct.name}
                    className="spotlight-main-img"
                    loading="lazy"
                    width="1200"
                    height="900"
                  />
                  <div className="spotlight-thumbs-preview">
                    {boxProduct.gallery.map((g, idx) => (
                      <span key={idx} className="spotlight-mini-thumb">
                        <img src={g.src} alt={g.title} loading="lazy" width="200" height="150" />
                        <small>{g.title}</small>
                      </span>
                    ))}
                  </div>
                  <span className="spotlight-badge">Priority Craft #1</span>
                </div>
                <div className="spotlight-content">
                  <span className="spotlight-cat">{boxProduct.category}</span>
                  <h3>{boxProduct.name}</h3>
                  <p className="spotlight-desc">{boxProduct.description}</p>
                  <div className="spotlight-specs">
                    <div>
                      <strong>Available Structures:</strong>
                      <span>Magnetic flap, sliding drawer, rigid lid &amp; base</span>
                    </div>
                    <div>
                      <strong>Finishes &amp; Foils:</strong>
                      <span>Antique gold foil, matte soft-touch, spot UV, ribbon pulls</span>
                    </div>
                  </div>
                  <div className="spotlight-actions">
                    <button type="button" className="btn btn-gold" onClick={(e) => { e.stopPropagation(); onSelectProduct(boxProduct); }}>
                      Inspect Details &amp; Options →
                    </button>
                    <a
                      href={waLink(
                        WHATSAPP_MAIN_NUM,
                        'Assalam-o-Alaikum JSA Printing Solutions, I am interested in customised garment boxes. Please share available options and quotation process.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-wa-inline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      WhatsApp Quote
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })()}

        {/* Priorities 2–8: Grid of Core Custom Products */}
        <div className="products-grid">
          {PRODUCTS.slice(1).map((prod, idx) => (
            <article
              key={prod.id}
              className="product-card"
              data-reveal
              style={{ transitionDelay: `${(idx % 4) * 0.08}s` }}
              onClick={() => onSelectProduct(prod)}
            >
              <div className="prod-img-box">
                <img src={prod.primaryImage} alt={prod.name} loading="lazy" width="800" height="600" />
                <span className="prod-gallery-count">+{prod.gallery.length} Photos</span>
                <span className="prod-click-hint">Click to Inspect</span>
              </div>
              <div className="prod-meta">
                <span className="prod-cat">{prod.category}</span>
                <h4>{prod.name}</h4>
                <p className="prod-tagline">{prod.tagline}</p>
                <div className="prod-footer">
                  <span className="prod-learn-link">View Gallery &amp; Specs</span>
                  <a
                    href={waLink(
                      WHATSAPP_MAIN_NUM,
                      `Assalam-o-Alaikum JSA Printing Solutions, I am interested in customised ${prod.name}. Please share available options and quotation.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="prod-wa-quick"
                    onClick={(e) => e.stopPropagation()}
                    title="Enquire on WhatsApp"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- INTERACTIVE PRODUCT DETAIL MODAL ---------- */
function ProductDetailModal({
  product,
  onClose,
  onSelectOther,
}: {
  product: ProductItem | null;
  onClose: () => void;
  onSelectOther: (p: ProductItem) => void;
}) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [userQty, setUserQty] = useState('');
  const [userSize, setUserSize] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveImgIdx(0);
    setUserQty(product?.customOptions.defaultQty || '');
    setUserSize(product?.customOptions.sizes?.[0] || '');
    setUserNotes('');
    setCopied(false);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setActiveImgIdx((c) => (c + 1) % product.gallery.length);
      if (e.key === 'ArrowLeft') setActiveImgIdx((c) => (c - 1 + product.gallery.length) % product.gallery.length);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  const currentGalleryItem = product.gallery[activeImgIdx] || product.gallery[0];

  const buildWhatsAppMessage = () => {
    let msg = `Assalam-o-Alaikum JSA Printing Solutions, I am interested in customised ${product.name}.\n`;
    if (userQty) msg += `Estimated Quantity: ${userQty}\n`;
    if (userSize) msg += `Preferred Size: ${userSize}\n`;
    if (userNotes) msg += `Project Requirements: ${userNotes}\n`;
    msg += `Please share the available options and quotation process.`;
    return msg;
  };

  const copyDetails = () => {
    navigator.clipboard?.writeText(buildWhatsAppMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <div className="product-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close product modal">
          ✕
        </button>

        <div className="modal-inner-grid">
          {/* Gallery View */}
          <div className="modal-gallery-pane">
            <div className="modal-hero-view">
              <img
                src={currentGalleryItem.src}
                alt={currentGalleryItem.title}
                className="modal-main-image"
                width="1200"
                height="900"
              />
              <div className="modal-img-caption">
                <strong>{currentGalleryItem.title}</strong>
                <span>{currentGalleryItem.desc}</span>
              </div>
            </div>

            <div className="modal-thumbnail-strip">
              {product.gallery.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  className={`modal-thumb-btn ${i === activeImgIdx ? 'active' : ''}`}
                  onClick={() => setActiveImgIdx(i)}
                  aria-label={`View ${g.title}`}
                >
                  <img src={g.src} alt={g.title} width="160" height="120" />
                </button>
              ))}
            </div>
          </div>

          {/* Details & Customisation Pane */}
          <div className="modal-details-pane">
            <span className="modal-cat-tag">{product.category}</span>
            <h3 id="modal-title" className="modal-product-title">{product.name}</h3>
            <p className="modal-tagline">{product.tagline}</p>
            <p className="modal-body-desc">{product.description}</p>

            <div className="modal-highlights">
              <h4>Key Craftsmanship Details:</h4>
              <ul>
                {product.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            {/* Customisation enquiry fields */}
            <div className="modal-enquiry-box">
              <h4>Configure Your Enquiry:</h4>
              <div className="enquiry-fields-grid">
                {product.customOptions.sizes && (
                  <label>
                    <span>Preferred Size / Dimension:</span>
                    <select value={userSize} onChange={(e) => setUserSize(e.target.value)}>
                      {product.customOptions.sizes.map((s, idx) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  <span>Desired Quantity:</span>
                  <input
                    type="text"
                    placeholder="e.g. 1,000 pcs"
                    value={userQty}
                    onChange={(e) => setUserQty(e.target.value)}
                  />
                </label>
              </div>

              <label className="notes-label">
                <span>Branding / Finish / Custom Requirements:</span>
                <textarea
                  rows={2}
                  placeholder="e.g., Gold foil stamping on flap, specific pantone colors, embossed logo..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                />
              </label>

              <div className="modal-action-row">
                <a
                  href={waLink(WHATSAPP_MAIN_NUM, buildWhatsAppMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-wa-modal"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
                    <path d="M12.031 2C6.511 2 2.016 6.477 2.016 11.979c0 1.83.504 3.614 1.464 5.174L2 22l4.98-1.428a9.972 9.972 0 0 0 5.051 1.396h.004c5.518 0 10.015-4.477 10.015-9.98C22.05 6.477 17.551 2 12.031 2zm5.787 14.283c-.244.684-1.417 1.309-1.954 1.39-.488.073-1.127.106-3.633-.925-2.146-.882-3.528-3.056-3.635-3.198-.106-.143-.872-1.157-.872-2.207 0-1.05.552-1.567.747-1.782.196-.215.426-.269.568-.269.143 0 .285.002.408.008.13.007.304-.049.475.362.176.425.602 1.466.654 1.573.053.107.089.232.018.375-.072.143-.108.232-.215.357-.107.125-.225.279-.322.375-.107.107-.218.223-.095.434.123.212.547.902 1.173 1.46 0.806.718 1.486.94 1.698 1.047.213.107.337.089.462-.054.125-.143.534-.625.677-.84.142-.214.285-.178.479-.107.195.071 1.238.583 1.45.69.213.107.355.161.408.25.053.089.053.518-.191 1.202z"/>
                  </svg>
                  Send WhatsApp Enquiry
                </a>
                <button type="button" className="btn btn-ghost sm" onClick={copyDetails}>
                  {copied ? '✓ Copied Details!' : 'Copy Enquiry Details'}
                </button>
              </div>
            </div>

            {/* Related products */}
            <div className="modal-related">
              <h4>Frequently Paired Products:</h4>
              <div className="related-chips">
                {related.map((r) => (
                  <button key={r.id} type="button" onClick={() => onSelectOther(r)}>
                    {r.name} →
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- SERVICES SECTION (ALL 23 FROM COMPANY PROFILE) ---------- */
function Services({ onPick }: { onPick: (s: string) => void }) {
  return (
    <section id="services" className="section services">
      <div className="container">
        <SectionHead kicker="Complete Production Range" title={<>All 23 printing services <em>under one master craft.</em></>}>
          Organized by application for fashion, packaging, corporate branding, and logistics.
        </SectionHead>
        <div className="svc-list">
          {ALL_SERVICE_CATEGORIES.map((g, i) => (
            <article key={g.title} className={`svc svc-${g.tone} ${i % 2 ? 'flip' : ''}`} data-reveal>
              <div className="svc-img">
                <img loading="lazy" src={g.img} alt={g.title} width="1200" height="900" />
              </div>
              <div className="svc-body">
                <span className="svc-no">0{i + 1}</span>
                <h3>{g.title}</h3>
                <p>{g.desc}</p>
                <ul className="chips">
                  {g.items.map((it) => (
                    <li key={it}>
                      <button type="button" onClick={() => onPick(it)} title={`Enquire about ${it}`}>
                        {it}
                      </button>
                    </li>
                  ))}
                </ul>
                <a className="link-arrow" href="#contact" onClick={() => onPick(g.items[0])}>
                  Request specifications for this category →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- ABOUT SECTION (WITH SAFE SOLUTIONS CONNECTION) ---------- */
function About() {
  return (
    <section id="about" className="section about">
      <div className="container about-grid">
        <div data-reveal>
          <SectionHead kicker="About JSA Printing Solutions" title={<>Built on Experience. <em>Focused on Print.</em></>}>
            JSA Printing Solutions brings design and print together to help businesses present their brands with clarity and confidence. From customised garment packaging and labels to printed cards and corporate stationery, we focus on creating print solutions suited to each customer's requirements.
          </SectionHead>

          <p className="body">
            Every product we produce is governed by precision: the paper weight, tactile stock finish, ink registration, and hot foil stamping. Printing is not simply ink on substrate; it is the physical ambassador of your brand.
          </p>

          {/* Tasteful reference to Safe Solutions */}
          <div className="safe-solutions-card">
            <span className="safe-badge">Business Family</span>
            <p className="safe-statement">
              JSA Printing Solutions is part of the wider Safe Solutions business family, connecting printing services with a broader business presence.
            </p>
          </div>
        </div>

        <div className="about-art" data-reveal>
          <figure className="art-main">
            <img loading="lazy" src="/images/garment_box_drawer.jpg" alt="Sliding drawer garment packaging box" width="1200" height="900" />
          </figure>
          <figure className="art-small">
            <img loading="lazy" src="/images/care_labels_fabric.jpg" alt="Soft satin care label" width="800" height="600" />
          </figure>
          <div className="art-tag">WE DESIGN · WE PRINT · WE CARE</div>
        </div>
      </div>
    </section>
  );
}

/* ---------- VISION & MISSION SECTION ---------- */
function Vision() {
  return (
    <section id="vision" className="section vision">
      <div className="container">
        <SectionHead kicker="Our Vision & Mission" title={<>Innovation, quality &amp; <em>sustainable practices.</em></>} />
        <div className="vm">
          <blockquote data-reveal className="vm-block emerald">
            <h3>Our Vision</h3>
            <p>
              “To be the premier offset printing company recognized for its innovation, quality &amp; sustainable practices, driving success for our clients.”
            </p>
          </blockquote>
          <div className="vm-photo" data-reveal>
            <img loading="lazy" src="/images/leather_patch.jpg" alt="Debossed denim leather patch" width="1200" height="900" />
          </div>
          <blockquote data-reveal className="vm-block burgundy">
            <h3>Our Mission</h3>
            <p>
              “To deliver outstanding print solutions to our clients while ensuring exceptional customer service, environmental sustainability, and the continual advancement of our technology and skills.”
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

/* ---------- HOW WE WORK SECTION ---------- */
function Process() {
  const STEPS = [
    ['01', 'Share Your Requirements', 'Tell us the product, size, finish and estimated quantity you envision.'],
    ['02', 'Discuss Printing Needs', 'Our specialists consult on stocks, foil finishes, die lines and samples.'],
    ['03', 'Confirm Artwork & Proofs', 'Review and approve digital & physical proofs before master production.'],
    ['04', 'Production & Delivery Coordination', 'Your print run executes with strict QC and coordinated delivery.'],
  ];

  return (
    <section className="section process" aria-labelledby="process-h">
      <div className="container">
        <SectionHead kicker="How We Work" title={<span id="process-h">A simple path from <em>concept to delivery.</em></span>}>
          Engineered for brands requiring reliable execution and attentive customer care.
        </SectionHead>
        <ol className="steps">
          {STEPS.map(([num, t, d], i) => (
            <li key={t} data-reveal style={{ transitionDelay: `${i * 0.1}s` }}>
              <span className="step-no">{num}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- CONTACT SECTION (ALL 3 VERIFIED CONTACTS) ---------- */
type Errs = Partial<Record<'name' | 'contact' | 'service' | 'details', string>>;

function Contact({ service, setService }: { service: string; setService: (s: string) => void }) {
  const [errs, setErrs] = useState<Errs>({});
  const [status, setStatus] = useState<{
    type: 'idle' | 'sending' | 'ok' | 'err' | 'unconfigured';
    msg?: string;
    text?: string;
  }>({ type: 'idle' });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? '').trim();
    const x: Errs = {};
    if (v('name').length < 2) x.name = 'Please enter your name.';
    const c = v('contact');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) && !/^[+\d][\d\s()-]{6,}$/.test(c)) {
      x.contact = 'Enter a valid email address or phone number.';
    }
    if (!v('service')) x.service = 'Please choose a product or service.';
    if (v('details').length < 10) x.details = 'Please describe your project (at least 10 characters).';
    setErrs(x);
    if (Object.keys(x).length) {
      setStatus({ type: 'idle' });
      return;
    }

    const text = `Name: ${v('name')}\nContact: ${c}\nProduct/Service: ${v('service')}\nQuantity: ${v('qty') || '—'}\nDetails: ${v('details')}`;

    if (!FORM_ENDPOINT) {
      setStatus({ type: 'unconfigured', text });
      return;
    }

    setStatus({ type: 'sending' });
    try {
      const r = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(f)),
      });
      if (!r.ok) throw new Error(String(r.status));
      setStatus({ type: 'ok' });
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus({
        type: 'err',
        msg: 'We could not send your enquiry online. Please message us directly via WhatsApp or phone.',
      });
    }
  };

  return (
    <section id="contact" className="section contact">
      <div className="container contact-grid">
        <div data-reveal>
          <SectionHead light kicker="Direct Contact Hub" title={<>Let’s print something <em>exceptional together.</em></>}>
            Connect directly with our Faisalabad city branch, marketing office, or speak with our project coordinator.
          </SectionHead>

          <ul className="contact-list">
            {CONTACTS.map((c) => (
              <li key={c.role} className="contact-card-item">
                <span className="contact-role-badge">{c.role}</span>
                <div className="contact-phone-row">
                  <a className="tel-link" href={tel(c.phone)}>
                    {c.phone}
                  </a>
                  <a
                    className="contact-wa-link"
                    href={waLink(c.cleanPhone, 'Assalam-o-Alaikum JSA Printing Solutions, I would like to enquire about your printing services.')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp Chat
                  </a>
                </div>
                {c.address && <p className="contact-addr">{c.address}</p>}
                <small className="contact-note">{c.note}</small>
              </li>
            ))}
          </ul>
        </div>

        <form className="form" onSubmit={submit} noValidate data-reveal aria-describedby="form-status">
          <h3>Request a Custom Quote</h3>
          <p className="form-sub">Fill out the specifications below or reach out directly on WhatsApp.</p>

          <label>
            Your Name *
            <input name="name" autoComplete="name" aria-invalid={!!errs.name} placeholder="e.g. Tariq Mehmood" />
            {errs.name && <small role="alert">{errs.name}</small>}
          </label>

          <label>
            Email or WhatsApp Phone *
            <input name="contact" autoComplete="email" aria-invalid={!!errs.contact} placeholder="e.g. 0321-xxxxxxx or email@domain.com" />
            {errs.contact && <small role="alert">{errs.contact}</small>}
          </label>

          <label>
            Product / Category *
            <select name="service" value={service} onChange={(e) => setService(e.target.value)} aria-invalid={!!errs.service}>
              <option value="">Select a product...</option>
              {PRODUCTS.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            {errs.service && <small role="alert">{errs.service}</small>}
          </label>

          <label>
            Estimated Quantity (optional)
            <input name="qty" inputMode="numeric" placeholder="e.g. 2,000 pcs" />
          </label>

          <label>
            Project Details &amp; Custom Specifications *
            <textarea
              name="details"
              rows={4}
              aria-invalid={!!errs.details}
              placeholder="Tell us about your garment box dimensions, tag paper weight, foil stamping, or label artwork details..."
            />
            {errs.details && <small role="alert">{errs.details}</small>}
          </label>

          <button className="btn btn-gold" type="submit" disabled={status.type === 'sending'}>
            {status.type === 'sending' ? 'Sending Enquiry...' : 'Submit Print Enquiry'}
          </button>

          <div id="form-status" aria-live="polite">
            {status.type === 'ok' && (
              <p className="msg ok">Thank you! Your quotation enquiry has been sent. We will respond promptly.</p>
            )}
            {status.type === 'err' && <p className="msg bad">{status.msg}</p>}
            {status.type === 'unconfigured' && (
              <div className="msg bad">
                <p>
                  <b>Enquiry validated:</b> Direct online delivery isn't configured yet (set <code>VITE_FORM_ENDPOINT</code>). You can copy the message and send it directly via WhatsApp to <b>0321 6610075</b>:
                </p>
                <div className="unconfigured-actions">
                  <a
                    href={waLink(WHATSAPP_MAIN_NUM, status.text ?? '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-wa-inline"
                  >
                    Send via WhatsApp
                  </a>
                  <button type="button" className="btn btn-ghost sm" onClick={() => navigator.clipboard?.writeText(status.text ?? '')}>
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

/* ---------- SITE FOOTER ---------- */
function Footer({ onSelectProduct }: { onSelectProduct: (p: ProductItem) => void }) {
  return (
    <footer className="footer">
      <div className="container foot-grid">
        <div className="foot-brand-col">
          <Brand light />
          <p className="foot-tagline">“WE DESIGN, WE PRINT, WE CARE.”</p>
          <p className="foot-statement">
            Offset printing craftsmanship, luxury garment packaging, and woven identity engineered in Faisalabad, Pakistan.
          </p>
          <div className="foot-safe-badge">Safe Solutions Business Family</div>
        </div>

        <nav aria-label="Footer Custom Products">
          <h4>Key Products</h4>
          <ul>
            {PRODUCTS.slice(0, 6).map((p) => (
              <li key={p.id}>
                <button type="button" className="foot-link-btn" onClick={() => onSelectProduct(p)}>
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer Navigation">
          <h4>Navigation</h4>
          <ul>
            {NAV.map(([l, h]) => (
              <li key={h}>
                <a href={h}>{l}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h4>Contact &amp; Offices</h4>
          <ul className="foot-contact-list">
            {CONTACTS.map((c) => (
              <li key={c.role}>
                <b>{c.role}:</b>
                <br />
                <a href={tel(c.phone)}>{c.phone}</a>
                {c.address && <span> — {c.address}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="copy">
        © {new Date().getFullYear()} JSA Printing Solutions (Safe Solutions). All rights reserved.
      </p>
    </footer>
  );
}

/* ---------- MAIN APPLICATION WRAPPER ---------- */
export default function App() {
  const [service, setService] = useState('');
  const [activeModalProduct, setActiveModalProduct] = useState<ProductItem | null>(null);

  useReveal();

  const handlePickService = (s: string) => {
    setService(s);
    // if matching product exists, open modal
    const matched = PRODUCTS.find((p) => p.name.toLowerCase().includes(s.toLowerCase()));
    if (matched) {
      setActiveModalProduct(matched);
    } else {
      const contactSection = document.getElementById('contact');
      contactSection?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <a className="skip" href="#featured-products">
        Skip to content
      </a>
      <Header />
      <main>
        <Hero />
        <FeaturedProducts onSelectProduct={(p) => setActiveModalProduct(p)} />
        <Services onPick={handlePickService} />
        <About />
        <Vision />
        <Process />
        <Contact service={service} setService={setService} />
      </main>
      <Footer onSelectProduct={(p) => setActiveModalProduct(p)} />
      <FloatingWhatsApp />

      {/* Product Detail Interactive Modal */}
      {activeModalProduct && (
        <ProductDetailModal
          product={activeModalProduct}
          onClose={() => setActiveModalProduct(null)}
          onSelectOther={(p) => setActiveModalProduct(p)}
        />
      )}
    </>
  );
}
