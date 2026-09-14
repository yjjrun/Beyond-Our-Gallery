(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const smallViewport = window.matchMedia("(max-width: 760px)");
  const layers = Array.from(document.querySelectorAll("[data-parallax-speed], [data-parallax-bg]"));

  if (!layers.length) return;

  let ticking = false;

  function resetParallax() {
    layers.forEach((layer) => {
      layer.style.removeProperty("--parallax-y");
      layer.style.removeProperty("--parallax-bg");
    });
  }

  function updateParallax() {
    ticking = false;

    if (reduceMotion.matches || smallViewport.matches) {
      resetParallax();
      return;
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportCenter = viewportHeight / 2;

    layers.forEach((layer) => {
      const rect = layer.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > viewportHeight + 100) return;

      const layerCenter = rect.top + rect.height / 2;
      const progress = (layerCenter - viewportCenter) / viewportHeight;

      if (layer.dataset.parallaxSpeed) {
        const speed = Number(layer.dataset.parallaxSpeed);
        layer.style.setProperty("--parallax-y", `${(-progress * speed).toFixed(2)}px`);
      }

      if (layer.dataset.parallaxBg !== undefined) {
        const speed = Number(layer.dataset.parallaxBgSpeed || 40);
        layer.style.setProperty("--parallax-bg", `${(progress * speed).toFixed(2)}px`);
      }
    });
  }

  function requestParallaxUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
  window.addEventListener("resize", requestParallaxUpdate);
  [reduceMotion, smallViewport].forEach((query) => {
    if (query.addEventListener) {
      query.addEventListener("change", requestParallaxUpdate);
    } else if (query.addListener) {
      query.addListener(requestParallaxUpdate);
    }
  });
  requestParallaxUpdate();
})();
