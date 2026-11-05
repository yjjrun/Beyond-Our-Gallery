window.addEventListener("DOMContentLoaded",()=>{
  if(window.lucide)window.lucide.createIcons();
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals=document.querySelectorAll("[data-reveal],.figure");
  if(reduce){reveals.forEach(el=>el.classList.add("is-visible"));}
  else{
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }),{threshold:.12,rootMargin:"0px 0px -38px"});
    reveals.forEach(el=>observer.observe(el));
  }
  const sections=[...document.querySelectorAll(".analysis-section")];
  const current=document.getElementById("section-current");
  const rail={thesis:document.getElementById("rail-thesis"),evidence:document.getElementById("rail-evidence"),uncertainty:document.getElementById("rail-uncertainty"),change:document.getElementById("rail-change")};
  let raf=0;
  const updateSection=()=>{
    raf=0;
    if(!sections.length)return;
    const probe=scrollY+Math.min(innerHeight*.32,260);
    let active=sections[0];
    sections.forEach(section=>{if(section.offsetTop<=probe)active=section;});
    if(current)current.textContent=String(active.dataset.index).padStart(2,"0");
    Object.entries(rail).forEach(([key,node])=>{if(node)node.textContent=active.dataset[key]||"";});
  };
  const route=document.getElementById("route-progress");
  const updateProgress=()=>{if(route){const max=document.documentElement.scrollHeight-innerHeight;route.style.width=(max>0?scrollY/max*100:0)+"%";}};
  addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(updateSection);updateProgress();},{passive:true});
  addEventListener("resize",updateSection);
  updateSection();updateProgress();
  document.querySelectorAll(".sections-popover a").forEach(a=>a.addEventListener("click",()=>a.closest("details")?.removeAttribute("open")));
  document.querySelectorAll("[data-risk]").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll("[data-risk]").forEach(item=>item.setAttribute("aria-pressed","false"));
    btn.setAttribute("aria-pressed","true");
    const map={"risk-level":"level","risk-title":"title","risk-desc":"desc","risk-trigger":"trigger","risk-mitigation":"mitigation"};
    Object.entries(map).forEach(([id,key])=>{const node=document.getElementById(id);if(node)node.textContent=btn.dataset[key]||"";});
  }));
  document.querySelectorAll("[data-scenario]").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll("[data-scenario]").forEach(item=>item.setAttribute("aria-pressed","false"));
    btn.setAttribute("aria-pressed","true");
    const map={"scenario-name":"name","scenario-revenue":"revenue","scenario-margin":"margin","scenario-profit":"profit","scenario-note":"note","scenario-score-note":"outlook"};
    Object.entries(map).forEach(([id,key])=>{const node=document.getElementById(id);if(node)node.textContent=btn.dataset[key]||"";});
  }));
});
