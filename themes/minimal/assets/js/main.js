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

  // 3. Photo lightbox (click to enlarge)
  const photoImgs = document.querySelectorAll(".photostrip__item img");
  if (photoImgs.length) {
    let lb, lbImg, lbCap, lbClose, lastFocus;

    const buildLightbox = () => {
      lb = document.createElement("div");
      lb.className = "lightbox";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.hidden = true;
      lbClose = document.createElement("button");
      lbClose.className = "lightbox__close";
      lbClose.type = "button";
      lbClose.setAttribute("aria-label", "Close");
      lbClose.textContent = "×";
      lbImg = document.createElement("img");
      lbImg.className = "lightbox__img";
      lbImg.alt = "";
      lbCap = document.createElement("p");
      lbCap.className = "lightbox__caption";
      lb.append(lbClose, lbImg, lbCap);
      document.body.appendChild(lb);

      lb.addEventListener("click", (e) => {
        if (e.target === lb || e.target === lbClose) closeLightbox();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !lb.hidden) closeLightbox();
      });
    };

    const openLightbox = (img) => {
      if (!lb) buildLightbox();
      lastFocus = img;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      const cap = img.closest("figure") && img.closest("figure").querySelector("figcaption");
      lbCap.textContent = cap ? cap.textContent : img.alt || "";
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => lb.classList.add("is-open"));
      lbClose.focus();
    };

    const closeLightbox = () => {
      lb.classList.remove("is-open");
      const finish = () => {
        lb.hidden = true;
        document.body.style.overflow = "";
        if (lastFocus) lastFocus.focus();
      };
      if (reduce) finish();
      else setTimeout(finish, 300);
    };

    photoImgs.forEach((img) => {
      img.addEventListener("click", () => openLightbox(img));
    });
  }

  // 4. Paper abstract modals (native <dialog>)
  document.querySelectorAll("[data-paper-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const dlg = document.getElementById(btn.getAttribute("data-paper-open"));
      if (dlg && typeof dlg.showModal === "function") dlg.showModal();
    });
  });

  document.querySelectorAll(".paper[data-paper-card]").forEach((card) => {
    // Real links inside the card must navigate, not open the modal.
    card.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", (e) => e.stopPropagation());
    });
    card.addEventListener("click", () => {
      const dlg = document.getElementById(card.getAttribute("aria-controls"));
      if (dlg && typeof dlg.showModal === "function") dlg.showModal();
    });
  });

  document.querySelectorAll("dialog.paper-modal").forEach((dlg) => {
    dlg.querySelectorAll("[data-paper-close]").forEach((btn) => {
      btn.addEventListener("click", () => dlg.close());
    });
    // Backdrop click (click on the dialog element itself, outside inner content).
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
  });

  // 5. Cursor-reactive lean on the hero name (fine pointer only)
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
