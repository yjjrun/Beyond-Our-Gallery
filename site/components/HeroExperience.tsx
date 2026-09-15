"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const GalleryScene = dynamic(() => import("./GalleryScene"), { ssr: false });

type HeroExperienceProps = {
  onReleaseChange: (released: boolean) => void;
};

const stages = [
  "The bigger picture",
  "The observer steps away",
  "From artwork to evidence",
  "The numbers come forward",
  "Enter the research gallery",
];

function CountUp({ active, target, decimals = 0, prefix = "", suffix = "" }: { active: boolean; target: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const started = performance.now();
    const duration = 950;
    let frame = 0;
    const update = (time: number) => {
      const progress = Math.min(1, (time - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return <>{prefix}{value.toFixed(decimals)}{suffix}</>;
}

export function HeroExperience({ onReleaseChange }: HeroExperienceProps) {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [stage, setStage] = useState(0);
  const [released, setReleased] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const element = root.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      progress.current = 0.92;
      setStage(4);
      setReleased(true);
      onReleaseChange(true);
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.45,
      onUpdate: (self) => {
        progress.current = self.progress;
        const nextStage =
          self.progress < 0.2 ? 0 : self.progress < 0.45 ? 1 : self.progress < 0.7 ? 2 : self.progress < 0.9 ? 3 : 4;
        setStage((current) => (current === nextStage ? current : nextStage));
        const nextReleased = self.progress > 0.91;
        setReleased((current) => (current === nextReleased ? current : nextReleased));
        onReleaseChange(nextReleased);
        element.style.setProperty("--hero-progress", `${self.progress}`);
      },
    });

    return () => trigger.kill();
  }, [onReleaseChange]);

  return (
    <section ref={root} className="hero-scroll" aria-label="Beyond Our Gallery opening exhibit">
      <div className="hero-sticky">
        <div className="hero-canvas" aria-hidden="true">
          <GalleryScene progress={progress} />
        </div>

        <motion.div className="portal-nav" initial={false} animate={{ opacity: released ? 0 : 1, y: released ? -18 : 0 }} aria-hidden={released}>
          <a className="portal-brand" href="#home" aria-label="Beyond Our Gallery home">Beyond Our Gallery</a>
          <nav aria-label="Opening navigation">
            <a href="#company-gallery">Companies</a>
            <a href="#research">Research</a>
            <a href="/methodology.html">Methodology</a>
            <a href="#standards">About</a>
          </nav>
        </motion.div>

        <motion.div
          className="hero-copy"
          initial={false}
          animate={{ opacity: stage < 2 ? 1 : 0, y: stage < 2 ? 0 : -24 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow text-forest">Beyond Our Gallery / Exhibit 01</p>
          <h1><span>See the</span><span><em className="pink-word">whole</em></span><span>picture.</span></h1>
          <p className="hero-deck">Research the companies others overlook.</p>
          <a className="hero-action" href="#company-gallery">Explore the research <ArrowRight size={18} /></a>
        </motion.div>

        <motion.aside
          className="portal-callouts"
          initial={false}
          animate={{ opacity: stage < 2 ? 1 : 0, y: stage < 2 ? 0 : -14 }}
          aria-hidden={stage >= 2}
        >
          <span className="callout callout-art">Art / Asset</span>
          <span className="callout callout-evidence">Research / Evidence</span>
        </motion.aside>

        <motion.div className="portal-preview" initial={false} animate={{ opacity: stage < 2 ? 1 : 0 }} aria-hidden="true">
          <span>A deeper</span><span>look</span><span>ahead</span><ArrowRight size={22} />
        </motion.div>

        <motion.aside
          className="hero-evidence"
          initial={false}
          animate={{ opacity: stage === 3 ? 1 : 0, x: stage === 3 ? 0 : 28 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden={stage !== 3}
        >
          <p className="eyebrow">Analysis 01 / Kingsmen Creatives</p>
          <h2>The picture changes when the economics appear.</h2>
          <div className="evidence-stat"><span>FY2025 revenue</span><strong><CountUp active={stage >= 3} target={372.5} decimals={1} prefix="S$" suffix="m" /></strong></div>
          <div className="evidence-stat"><span>Gross margin</span><strong><CountUp active={stage >= 3} target={24.7} decimals={1} suffix="%" /></strong></div>
          <div className="evidence-score"><span>Beyond Our Gallery score</span><strong><CountUp active={stage >= 3} target={78} /></strong></div>
        </motion.aside>

        <motion.div
          className="hero-release"
          initial={false}
          animate={{ opacity: released ? 1 : 0, clipPath: released ? "inset(0 0 0 0%)" : "inset(0 0 0 100%)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden={!released}
        >
          <motion.div className="hero-release-shell" initial={false} animate={{ y: released ? 0 : 28, opacity: released ? 1 : 0 }} transition={{ duration: 0.55, delay: released ? 0.1 : 0 }}>
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
          </motion.div>
        </motion.div>

        <motion.div className="portal-route" aria-live="polite" initial={false} animate={{ opacity: released ? 0 : 1 }}>
          {stages.slice(0, 4).map((label, index) => (
            <div className={stage === index ? "active" : stage > index ? "complete" : ""} key={label}>
              <span>0{index + 1}</span><i /><p>{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div className="hero-scroll-cue" aria-hidden="true" initial={false} animate={{ opacity: released ? 0 : 1 }}>
          <ArrowDown size={16} strokeWidth={1.5} />
          <span>Scroll to reveal</span>
        </motion.div>
      </div>
    </section>
  );
}
