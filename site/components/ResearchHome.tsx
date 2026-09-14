"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Grid2X2,
  Menu,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, PointerEvent, useEffect, useMemo, useState } from "react";
import { companies, Company, scoreCategories } from "@/lib/data";

type ViewMode = "gallery" | "analyst";

function ScoreRing({ score, size = 92 }: { score: number; size?: number }) {
  const radius = 39;
  const circumference = Math.PI * 2 * radius;
  return (
    <div className="score-ring" style={{ width: size, height: size }} aria-label={`Research score ${score} out of 100`}>
      <svg viewBox="0 0 92 92" role="img">
        <circle className="score-ring-track" cx="46" cy="46" r={radius} />
        <motion.circle
          className="score-ring-value"
          cx="46"
          cy="46"
          r={radius}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - score / 100) }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <strong>{score}</strong>
    </div>
  );
}

function CompanyCard({ company, index, mode }: { company: Company; index: number; mode: ViewMode }) {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setTilt({ x: y * -3.2, y: x * 4.2 });
  };

  return (
    <motion.article
      className={`company-card company-card-${index + 1}`}
      initial={{ opacity: 0, y: 44 + (index % 3) * 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, delay: (index % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="company-card-tilt"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => {
          setHovered(false);
          setTilt({ x: 0, y: 0 });
        }}
        onPointerMove={handlePointerMove}
        style={{ transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        {mode === "gallery" ? (
          <>
            <div className="company-image">
              <Image src={company.image} alt="" fill sizes="(max-width: 760px) 100vw, 45vw" />
              <div className="company-image-wash" />
              <div className="company-sector">{company.sector}</div>
              <motion.div className="company-reveal" animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.24 }}>
                <span>{company.ticker}</span>
                <strong>{company.score}</strong>
                <p>{company.thesis}</p>
              </motion.div>
            </div>
            <div className="company-caption">
              <div>
                <h3>{company.name}</h3>
                <p>{company.ticker} · Updated {company.updated}</p>
              </div>
              <a href={company.href} aria-label={`View ${company.name} analysis`}><ArrowRight size={19} /></a>
            </div>
          </>
        ) : (
          <div className="analyst-card">
            <div className="analyst-card-top">
              <div>
                <span>{company.sector}</span>
                <h3>{company.name}</h3>
                <p>{company.ticker}</p>
              </div>
              <ScoreRing score={company.score} size={84} />
            </div>
            <p className="analyst-thesis">{company.thesis}</p>
            <div className="mini-metrics">
              {company.metrics.map((metric, metricIndex) => (
                <div key={metricIndex}>
                  <span>{["Financial", "Position", "Growth", "Risk"][metricIndex]}</span>
                  <i><b style={{ width: `${metric}%` }} /></i>
                  <strong>{metric}</strong>
                </div>
              ))}
            </div>
            <a href={company.href}>View analysis <ArrowRight size={17} /></a>
          </div>
        )}
      </div>
    </motion.article>
  );
}

function FinancialChart() {
  const data = [273.2, 328.4, 361.5, 388.4, 372.5];
  const margins = [21.6, 21.4, 21.6, 23.3, 24.7];
  const [hovered, setHovered] = useState<number | null>(4);
  const line = margins
    .map((margin, index) => `${index === 0 ? "M" : "L"} ${92 + index * 116} ${170 - (margin - 20) * 19}`)
    .join(" ");

  return (
    <figure className="chart-exhibit">
      <div className="figure-label">Figure 01.1 / What changed beneath the revenue line?</div>
      <div className="chart-question">
        <h3>Revenue recovered. Margin created the earnings base.</h3>
        <div className="chart-legend"><span><i className="legend-bar" />Revenue</span><span><i className="legend-line" />Gross margin</span></div>
      </div>
      <div className="chart-canvas">
        <svg viewBox="0 0 620 270" role="img" aria-label="Kingsmen revenue bars and gross margin line from financial year 2021 to 2025">
          {[48, 92, 136, 180, 224].map((y) => <line key={y} x1="52" x2="576" y1={y} y2={y} className="grid-line" />)}
          {data.map((value, index) => {
            const height = (value / 430) * 176;
            const x = 66 + index * 116;
            return (
              <g key={value} onMouseEnter={() => setHovered(index)} onFocus={() => setHovered(index)} tabIndex={0}>
                <motion.rect
                  x={x}
                  width="54"
                  rx="1"
                  initial={{ y: 224, height: 0 }}
                  whileInView={{ y: 224 - height, height }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.8, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className={hovered === index ? "revenue-bar active" : "revenue-bar"}
                />
                <text x={x + 27} y="252" textAnchor="middle">FY{2021 + index}</text>
                {hovered === index && (
                  <g className="chart-tooltip">
                    <rect x={Math.min(x - 14, 462)} y={Math.max(14, 204 - height)} width="116" height="48" rx="2" />
                    <text x={Math.min(x, 476)} y={Math.max(34, 224 - height)}>S${value.toFixed(1)}m</text>
                    <text x={Math.min(x, 476)} y={Math.max(52, 242 - height)}>{margins[index]}% margin</text>
                  </g>
                )}
              </g>
            );
          })}
          <motion.path
            d={line}
            className="margin-line"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 1.25, delay: 0.3 }}
          />
          {margins.map((margin, index) => (
            <motion.circle
              key={`${margin}-${index}`}
              cx={92 + index * 116}
              cy={170 - (margin - 20) * 19}
              r="5"
              className="margin-point"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 + index * 0.08 }}
            />
          ))}
        </svg>
      </div>
      <figcaption>
        <p><strong>Curator&apos;s note.</strong> Volume explains the recovery; margin explains why the recovered business is more valuable.</p>
        <span>Source: Kingsmen Creatives annual reports, FY2021–FY2025 · Updated September 2026</span>
      </figcaption>
    </figure>
  );
}

export function SiteHeader({ visible }: { visible: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("bog:search", { detail: searchQuery }));
    window.location.hash = "company-gallery";
    setSearchOpen(false);
  };

  return (
    <motion.header
      className="site-header"
      initial={false}
      animate={{ y: visible ? 0 : -92, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <a className="brand" href="#home" aria-label="Beyond Our Gallery home">
        <Image src="/mockup/media/bog-logo-lockup.png" alt="Beyond Our Gallery" width={180} height={60} priority />
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <a href="#company-gallery">Companies</a>
        <a href="#research">Research</a>
        <a href="/methodology.html">Methodology</a>
        <a href="#standards">About</a>
      </nav>
      <div className="header-actions">
        <button className="icon-button" onClick={() => setSearchOpen((open) => !open)} aria-label="Search" aria-expanded={searchOpen}>
          <Search size={19} />
        </button>
        <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Open menu" aria-expanded={menuOpen}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      <AnimatePresence>
        {searchOpen && (
          <motion.form className="header-search" onSubmit={submitSearch} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Search size={17} />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} type="search" placeholder="Search companies or sectors" aria-label="Search companies or sectors" />
            <button type="submit" className="header-search-submit" aria-label="Search covered companies"><ArrowRight size={17} /></button>
          </motion.form>
        )}
        {menuOpen && (
          <motion.nav className="mobile-nav" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <a href="#company-gallery" onClick={() => setMenuOpen(false)}>Companies</a>
            <a href="#research" onClick={() => setMenuOpen(false)}>Research</a>
            <a href="/methodology.html">Methodology</a>
            <a href="#standards" onClick={() => setMenuOpen(false)}>About</a>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export function ResearchHome() {
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [sector, setSector] = useState("All");
  const [query, setQuery] = useState("");
  const [expandedScore, setExpandedScore] = useState(0);
  const { scrollYProgress } = useScroll();
  const routeProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.3 });
  const sectors = ["All", "Experiential", "Attractions", "Film & Media", "Live Events"];
  const visibleCompanies = useMemo(
    () => companies.filter((company) => {
      const sectorMatch = sector === "All" || company.sector === sector;
      const textMatch = `${company.name} ${company.ticker} ${company.sector}`.toLowerCase().includes(query.toLowerCase());
      return sectorMatch && textMatch;
    }),
    [query, sector],
  );

  useEffect(() => {
    const handleHeaderSearch = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setQuery(detail || "");
      setSector("All");
    };
    window.addEventListener("bog:search", handleHeaderSearch);
    return () => window.removeEventListener("bog:search", handleHeaderSearch);
  }, []);

  return (
    <main>
      <motion.div className="museum-route" style={{ scaleX: routeProgress }} aria-hidden="true" />

      <section className="featured section-light" aria-labelledby="featured-heading">
        <div className="section-shell">
          <div className="section-heading-row">
            <div><p className="eyebrow">Featured analysis / Exhibit 02</p><h2 id="featured-heading">Kingsmen Creatives</h2></div>
            <p className="section-intro">A closer look at the business behind museums, retail environments, brand experiences and attractions.</p>
          </div>
          <div className="featured-grid">
            <motion.div className="featured-image" initial={{ clipPath: "inset(0 100% 0 0)" }} whileInView={{ clipPath: "inset(0 0% 0 0)" }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
              <Image src="/mockup/media/strategy-visitors.jpg" alt="Visitors inside an immersive Kingsmen exhibition environment" fill sizes="(max-width: 800px) 100vw, 65vw" />
              <div className="image-annotation"><span>Project format</span><strong>Immersive civic exhibition</strong><span>Economic relevance</span><strong>High-value design and build</strong></div>
            </motion.div>
            <div className="featured-analysis">
              <div className="featured-score"><ScoreRing score={78} size={110} /><span>Overall research score</span></div>
              <h3>Designing experiences.<br /><em>Delivering more than events.</em></h3>
              <p>A diversified platform with exposure to exhibitions, theme parks and brand environments, underpinned by a strengthening regional footprint.</p>
              <div className="featured-meta"><span>SGX: 5MZ</span><span>Updated 12 Sep 2026</span></div>
              <a className="button button-green" href="/kingsmen-creatives.html">Read analysis <ArrowRight size={18} /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="evidence-section section-dark" id="research" aria-labelledby="evidence-heading">
        <div className="section-shell evidence-grid">
          <div className="evidence-copy">
            <p className="eyebrow pink">The evidence / Exhibit 03</p>
            <h2 id="evidence-heading">What changed beneath the revenue line?</h2>
            <p>Our analysis separates reported growth from the economics that make it durable.</p>
          </div>
          <FinancialChart />
        </div>
      </section>

      <section className="company-gallery section-light" id="company-gallery" aria-labelledby="gallery-heading">
        <div className="section-shell">
          <div className="section-heading-row gallery-title-row">
            <div><p className="eyebrow">The company atlas</p><h2 id="gallery-heading">Explore the companies</h2></div>
            <p className="section-intro">Six companies. Four sectors. One clearer view of Singapore&apos;s creative economy.</p>
          </div>
          <div className="gallery-controls">
            <label className="gallery-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search companies" aria-label="Search covered companies" /></label>
            <div className="sector-filters" aria-label="Filter by sector">
              {sectors.map((item) => <button key={item} className={sector === item ? "active" : ""} onClick={() => setSector(item)}>{item}</button>)}
            </div>
            <div className="view-toggle" aria-label="Company display mode">
              <button className={viewMode === "gallery" ? "active" : ""} onClick={() => setViewMode("gallery")} aria-label="Gallery view"><Grid2X2 size={16} />Gallery</button>
              <button className={viewMode === "analyst" ? "active" : ""} onClick={() => setViewMode("analyst")} aria-label="Analyst view"><BarChart3 size={16} />Analyst</button>
            </div>
          </div>
          <motion.div layout className={`company-grid ${viewMode}`}>
            <AnimatePresence mode="popLayout">
              {visibleCompanies.map((company) => <CompanyCard key={company.name} company={company} index={companies.indexOf(company)} mode={viewMode} />)}
            </AnimatePresence>
          </motion.div>
          {visibleCompanies.length === 0 && <p className="empty-state">No covered companies match this search.</p>}
        </div>
      </section>

      <section className="methodology section-pink" aria-labelledby="methodology-heading">
        <div className="section-shell methodology-grid">
          <div className="methodology-copy">
            <p className="eyebrow">Scoring methodology</p>
            <h2 id="methodology-heading">A score should reveal its reasoning.</h2>
            <p>Every company is assessed on the same fixed 100-point Business Quality and Future Readiness framework.</p>
            <a className="text-link" href="/methodology.html">Read the full methodology <ArrowRight size={16} /></a>
          </div>
          <div className="score-accordion">
            {scoreCategories.map((category, index) => {
              const expanded = expandedScore === index;
              return (
                <div className="score-item" key={category.name}>
                  <button onClick={() => setExpandedScore(expanded ? -1 : index)} aria-expanded={expanded}>
                    <span>0{index + 1}</span><strong>{category.name}</strong><em>{category.weight}%</em>{expanded ? <Minus size={19} /> : <Plus size={19} />}
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div className="score-details" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <p>{category.description}</p>
                        <div>{category.metrics.map((metric) => <span key={metric}>{metric}</span>)}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="latest section-light" aria-labelledby="latest-heading">
        <div className="section-shell">
          <div className="section-heading-row"><div><p className="eyebrow">Our insights</p><h2 id="latest-heading">Latest research</h2></div><a className="text-link" href="#research">View all research <ArrowRight size={16} /></a></div>
          <div className="research-list">
            {[
              ["Sector deep dive", "The next chapter for Singapore's live events", "/mockup/media/eta-expo-pavilion.jpg", "11 Sep 2026"],
              ["Company update", "mm2 Asia: a broader stage ahead", "/mockup/media/rws-concept-rendering.jpg", "04 Sep 2026"],
              ["Thematic insight", "Why the creative economy deserves a closer look", "/mockup/media/rd-bicentennial.jpg", "28 Aug 2026"],
            ].map(([type, title, image, date], index) => (
              <motion.article key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <div className="research-image"><Image src={image} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" /></div>
                <div><span>{type}</span><h3>{title}</h3><p>{date}</p><a href="#research" aria-label={`Read ${title}`}><ArrowRight size={18} /></a></div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="standards section-dark" id="standards" aria-labelledby="standards-heading">
        <div className="section-shell standards-grid">
          <div><p className="eyebrow pink">Research standards</p><h2 id="standards-heading">Clear sources.<br />Visible judgement.</h2></div>
          <div className="standards-list">
            <div><span>01</span><h3>Primary sources first</h3><p>Annual reports, SGX filings, investor materials and public contract disclosures anchor every analysis.</p></div>
            <div><span>02</span><h3>Repeatable updates</h3><p>Scores are reviewed after full-year results and when material company events change the thesis.</p></div>
            <div><span>03</span><h3>Independent perspective</h3><p>Beyond Our Gallery is not paid by covered companies and does not provide investment recommendations.</p></div>
            <div><span>04</span><h3>Named authorship</h3><p>Research is prepared by Jiarun Yang, with assumptions and source dates disclosed in each report.</p></div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-shell footer-top">
          <div><Image src="/mockup/media/bog-logo-lockup.png" alt="Beyond Our Gallery" width={218} height={73} /><p>SGX art & media research</p></div>
          <nav aria-label="Footer navigation"><a href="#standards">About</a><a href="mailto:hello@beyondourgallery.com">Contact</a><a href="/methodology.html">Methodology</a><a href="#privacy">Privacy policy</a><a href="#terms">Terms</a></nav>
        </div>
        <div className="section-shell footer-bottom"><p>© 2026 Beyond Our Gallery</p><p>Research is for informational purposes only and is not investment advice. Markets involve risk, including loss of capital.</p></div>
      </footer>
    </main>
  );
}
