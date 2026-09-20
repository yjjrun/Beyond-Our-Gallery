"use client";

import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const GalleryScene = dynamic(() => import("./GalleryScene"), { ssr: false });

type HeroExperienceProps = {
  onReleaseChange: (released: boolean) => void;
};

const stages = [
  "The bigger picture",
  "Observer steps away",
  "From artwork to evidence",
  "The numbers come forward",
];

export function HeroExperience({ onReleaseChange }: HeroExperienceProps) {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const revenueValue = useRef<HTMLElement>(null);
  const marginValue = useRef<HTMLElement>(null);
  const scoreValue = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [released, setReleased] = useState(false);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const element = root.current;
    if (!element) return;
    const siteHeader = document.querySelector<HTMLElement>(".site-header");
    const metrics = { revenue: 0, margin: 0, score: 0 };
    const renderMetrics = () => {
      if (revenueValue.current) revenueValue.current.textContent = `S$${metrics.revenue.toFixed(1)}m`;
      if (marginValue.current) marginValue.current.textContent = `${metrics.margin.toFixed(1)}%`;
      if (scoreValue.current) scoreValue.current.textContent = String(Math.round(metrics.score));
    };
    renderMetrics();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      progress.current = 0.92;
      element.style.setProperty("--hero-progress", "0.92");
      metrics.revenue = 372.5;
      metrics.margin = 24.7;
      metrics.score = 78;
      renderMetrics();
      setStage(3);
      setReleased(true);
      onReleaseChange(true);
      gsap.set(element.querySelector(".hero-copy"), { autoAlpha: 0 });
      gsap.set(element.querySelector(".portal-callouts"), { autoAlpha: 0 });
      gsap.set(element.querySelector(".portal-nav"), { autoAlpha: 0 });
      gsap.set(element.querySelector(".hero-evidence"), { autoAlpha: 0 });
      gsap.set(element.querySelector(".portal-route"), { autoAlpha: 0 });
      gsap.set(element.querySelector(".hero-release"), { autoAlpha: 1, clipPath: "inset(0 0 0 0%)" });
      gsap.set(element.querySelector(".hero-release-shell"), { autoAlpha: 1, y: 0 });
      if (siteHeader) gsap.set(siteHeader, { autoAlpha: 1, y: 0 });
      return;
    }

    const scene = { progress: 0 };
    let activeStage = 0;
    let releaseActive = false;

    const syncProgress = () => {
      const value = scene.progress;
      progress.current = value;
      element.style.setProperty("--hero-progress", String(value));

      const nextStage = value < 0.18 ? 0 : value < 0.42 ? 1 : value < 0.58 ? 2 : 3;
      if (nextStage !== activeStage) {
        activeStage = nextStage;
        setStage(nextStage);
      }

      const nextReleased = value >= 0.78;
      if (nextReleased !== releaseActive) {
        releaseActive = nextReleased;
        setReleased(nextReleased);
        onReleaseChange(nextReleased);
      }
    };

    const context = gsap.context(() => {
      gsap.set(".hero-copy", { autoAlpha: 1, y: 0 });
      gsap.set(".portal-callouts", { autoAlpha: 1 });
      gsap.set(".portal-nav", { autoAlpha: 1, y: 0 });
      gsap.set(".hero-evidence", { autoAlpha: 0, x: 20 });
      gsap.set(".hero-release", { autoAlpha: 0, clipPath: "inset(0 0 0 100%)" });
      gsap.set(".hero-release-shell", { autoAlpha: 0, y: 28 });
      gsap.set(".portal-route", { autoAlpha: 1 });
      if (siteHeader) gsap.set(siteHeader, { autoAlpha: 0, y: -92 });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: element,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.2,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(scene, { progress: 1, duration: 1, onUpdate: syncProgress }, 0)
        .to(".portal-callouts", { autoAlpha: 0, duration: 0.06 }, 0.14)
        .to(".hero-copy", { autoAlpha: 0, y: -18, duration: 0.08 }, 0.2)
        .to(metrics, { revenue: 372.5, margin: 24.7, score: 78, duration: 0.18, onUpdate: renderMetrics }, 0.52)
        .fromTo(".hero-evidence", { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: 0.1 }, 0.56)
        .to(".portal-nav", { autoAlpha: 0, y: -18, duration: 0.08 }, 0.72)
        .to(".hero-evidence", { autoAlpha: 0, x: -12, duration: 0.08 }, 0.74)
        .to(".portal-route", { autoAlpha: 0, duration: 0.06 }, 0.74)
        .fromTo(
          ".hero-release",
          { autoAlpha: 0, clipPath: "inset(0 0 0 100%)" },
          { autoAlpha: 1, clipPath: "inset(0 0 0 0%)", duration: 0.14 },
          0.78,
        )
        .fromTo(".hero-release-shell", { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.82);

      if (siteHeader) timeline.to(siteHeader, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.78);
    }, root);

    return () => context.revert();
  }, [onReleaseChange]);

  return (
    <section ref={root} className="hero-scroll" aria-label="Beyond Our Gallery opening exhibit">
      <div className="hero-sticky">
        <div className="hero-canvas" aria-hidden="true">
          <GalleryScene progress={progress} />
        </div>

        <div className="portal-nav" aria-hidden={released}>
          <a className="portal-brand" href="#home" aria-label="Beyond Our Gallery home">Beyond Our Gallery</a>
          <nav aria-label="Opening navigation">
            <a href="#company-gallery">Companies</a>
            <a href="#research">Research</a>
            <a href="/methodology.html">Methodology</a>
            <a href="#standards">About</a>
          </nav>
        </div>

        <div className="hero-copy" aria-hidden={stage > 0}>
          <p className="eyebrow text-forest">Beyond Our Gallery / Exhibit 01</p>
          <h1><span>See the</span><span><em className="pink-word">whole</em></span><span>picture.</span></h1>
          <p className="hero-deck">Research the companies others overlook.</p>
          <a className="hero-action" href="#company-gallery">Explore the research <ArrowRight size={18} /></a>
        </div>

        <aside className="portal-callouts" aria-hidden={stage > 0}>
          <span className="callout callout-art">Art / Asset</span>
          <span className="callout callout-evidence">Research / Evidence</span>
        </aside>

        <aside className="hero-evidence" aria-hidden={stage !== 3 || released}>
          <p className="eyebrow">Analysis 01 / Kingsmen Creatives</p>
          <h2>The picture changes when the economics appear.</h2>
          <div className="evidence-stat"><span>FY2025 revenue</span><strong ref={revenueValue} /></div>
          <div className="evidence-stat"><span>Gross margin</span><strong ref={marginValue} /></div>
          <div className="evidence-score"><span>Beyond Our Gallery score</span><strong ref={scoreValue} /></div>
        </aside>

        <div className="hero-release" aria-hidden={!released}>
          <div className="hero-release-shell">
            <div className="release-brand">
              <p className="eyebrow pink">The research gallery</p>
              <h2>Beyond Our<br />Gallery</h2>
            </div>
            <div className="release-statement">
              <h3>Research the companies others overlook.</h3>
              <p>Visual-first analysis of Singapore&apos;s experience, attractions, film and live-events businesses.</p>
              <div className="button-row">
                <a className="button button-pink" href="#company-gallery">Explore companies <ArrowRight size={18} /></a>
                <a className="text-link light" href="/methodology.html">View methodology <ArrowRight size={16} /></a>
              </div>
            </div>
            <div className="release-index">
              <div><strong>06</strong><span>Companies</span></div>
              <div><strong>04</strong><span>Sectors</span></div>
              <div><strong>100</strong><span>Point framework</span></div>
            </div>
          </div>
        </div>

        <div className="portal-route" aria-live="polite" aria-atomic="true">
          <div className="portal-route-caption"><span>0{stage + 1} / 04</span><p>{stages[stage]}</p></div>
          <i aria-hidden="true"><b /></i>
        </div>
      </div>
    </section>
  );
}
