(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Reveal on load + on scroll
  const reveals = document.querySelectorAll("[data-reveal]");
  if (reduce) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    reveals.forEach((el) => el.classList.add("reveal-init"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  // 2. Cycling role word
  const cycle = document.querySelector("[data-cycle]");
  const roles = window.__ROLES__ || [];
  if (cycle && roles.length > 1 && !reduce) {
    let i = 0;
    setInterval(() => {
      i = (i + 1) % roles.length;
      cycle.classList.add("is-swapping");
      setTimeout(() => {
        cycle.textContent = roles[i];
        cycle.classList.remove("is-swapping");
      }, 250);
    }, 2200);
  }

  // 2b. Scrollspy — highlight the nav link for the section in view
  const spySections = Array.from(document.querySelectorAll("main section[id]"));
  if (spySections.length) {
    const navLinks = new Map();
    spySections.forEach((sec) => {
      const link = document.querySelector(`nav a[href$="#${sec.id}"]`);
      if (link) navLinks.set(sec.id, link);
    });
    let activeId = null;
    const setActive = (id) => {
      if (id === activeId) return;
      activeId = id;
      navLinks.forEach((link) => link.classList.remove("active"));
      const link = navLinks.get(id);
      if (link) link.classList.add("active");
    };
    const spy = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
    spySections.forEach((sec) => spy.observe(sec));
  }

  // 3. Cursor-reactive lean on the hero name (fine pointer only)
  const name = document.querySelector(".hero__name");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (name && finePointer && !reduce) {
    let raf = null;
    window.addEventListener("mousemove", (ev) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const dx = (ev.clientX / window.innerWidth - 0.5) * 6;
        const dy = (ev.clientY / window.innerHeight - 0.5) * -4;
        name.style.transform = `rotateY(${dx}deg) rotateX(${dy}deg)`;
        raf = null;
      });
    });
  }
})();
