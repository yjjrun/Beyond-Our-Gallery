"use client";

import { useCallback, useState } from "react";
import { HeroExperience } from "./HeroExperience";
import { ResearchHome, SiteHeader } from "./ResearchHome";

export function LandingPage() {
  const [released, setReleased] = useState(false);
  const handleRelease = useCallback((next: boolean) => setReleased(next), []);

  return (
    <>
      <SiteHeader visible={released} />
      <div id="home"><HeroExperience onReleaseChange={handleRelease} /></div>
      <ResearchHome />
    </>
  );
}
