/**
 * ParkSign – script.js
 * Hanterar: navigation, mobil-meny, referenskort & modal, FAQ-accordion, scroll-animationer
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   1. SCROLL FADE-IN  (Intersection Observer)
════════════════════════════════════════════════════════════ */
(function initFadeIn() {
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('v');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fi').forEach(el => io.observe(el));
})();


/* ════════════════════════════════════════════════════════════
   2. NAVIGATION – scroll behaviour + sticky style
════════════════════════════════════════════════════════════ */
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();


/* ════════════════════════════════════════════════════════════
   3. MOBIL-MENY – hamburger toggle
════════════════════════════════════════════════════════════ */
(function initMobileNav() {
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!hamburger || !mobileNav) return;

  /** Öppna / stäng mobilmenyn */
  function toggleMenu(forceOpen) {
    const isOpen = forceOpen !== undefined
      ? forceOpen
      : hamburger.getAttribute('aria-expanded') !== 'true';

    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileNav.classList.toggle('open', isOpen);
    mobileNav.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => toggleMenu());

  // Stäng vid klick på länk i mobilmenyn
  mobileNav.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Stäng vid Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggleMenu(false);
  });
})();


/* ════════════════════════════════════════════════════════════
   4. (REFERENS-MODAL BORTTAGEN – korten är inte längre klickbara)
════════════════════════════════════════════════════════════ */


/* ════════════════════════════════════════════════════════════
   5. FAQ ACCORDION
════════════════════════════════════════════════════════════ */
(function initFAQ() {
  const questions = document.querySelectorAll('.faq-q');

  questions.forEach(btn => {
    btn.addEventListener('click', () => {
      const isOpen  = btn.getAttribute('aria-expanded') === 'true';
      const answer  = btn.nextElementSibling;

      // Stäng alla andra öppna svar
      questions.forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const ans = other.nextElementSibling;
          if (ans) ans.classList.remove('open');
        }
      });

      // Toggla det klickade
      btn.setAttribute('aria-expanded', String(!isOpen));
      if (answer) answer.classList.toggle('open', !isOpen);
    });
  });
})();


/* ════════════════════════════════════════════════════════════
   6. MJUK ANKAR-SCROLLNING
   (kompenserar för sticky nav-höjd)
════════════════════════════════════════════════════════════ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const hash   = link.getAttribute('href');
      if (hash === '#') return; // Skip tom länk (logotyp)
      const target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();

      const navHeight = document.getElementById('nav')?.offsetHeight || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ════════════════════════════════════════════════════════════
   7. GA4 – SCROLL DEPTH TRACKING
   Spårar när besökaren scrollat 25 / 50 / 75 / 100 %
════════════════════════════════════════════════════════════ */
(function initScrollDepth() {
  if (typeof gtag !== 'function') return;

  const milestones = [25, 50, 75, 100];
  const reached    = new Set();

  function onScroll() {
    const scrolled = window.scrollY + window.innerHeight;
    const total    = document.documentElement.scrollHeight;
    const pct      = Math.round((scrolled / total) * 100);

    milestones.forEach(m => {
      if (pct >= m && !reached.has(m)) {
        reached.add(m);
        gtag('event', 'scroll_depth', { depth: m + '%' });
      }
    });

    if (reached.size === milestones.length) {
      window.removeEventListener('scroll', onScroll);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // kontrollera direkt vid sidladdning (t.ex. kort sida)
})();


/* ════════════════════════════════════════════════════════════
   8. GA4 – CTA / BOOKING / REFERENS TRACKING
   Hanterar alla tre event-typer via ett enda delegerat
   click-lyssnare på document.
════════════════════════════════════════════════════════════ */
(function initTracking() {
  if (typeof gtag !== 'function') return;

  /**
   * Returnerar sektionens id för ett element,
   * eller 'nav' / 'footer' om det ligger utanför <main>.
   */
  function getSection(el) {
    const section = el.closest('section[id]');
    if (section) return section.id;
    if (el.closest('footer')) return 'footer';
    if (el.closest('nav'))    return 'nav';
    return 'page';
  }

  /** Rensar knapptext: tar bort extra blanksteg och pil-tecken. */
  function getButtonText(el) {
    return (el.textContent || '').trim().replace(/\s+/g, ' ');
  }

  document.addEventListener('click', function (e) {
    const target = e.target;

    /* ── 1. CTA-knappar (.btn, .nav-btn, .mobile-cta) ── */
    const btn = target.closest('.btn, .nav-btn, .mobile-cta');
    if (btn) {
      gtag('event', 'cta_click', {
        button_text: getButtonText(btn),
        section:     getSection(btn)
      });
    }

    /* ── 2. Bokningsklick – alla Calendly-länkar ── */
    const link = target.closest('a[href]');
    if (link && link.href.includes('calendly.com')) {
      gtag('event', 'booking_click', {
        section: getSection(link)
      });
    }

    /* ── 3. Visa referens ── */
    const refBtn = target.closest('[data-ref-open]');
    if (refBtn) {
      gtag('event', 'reference_open', {
        reference_name: refBtn.dataset.refOpen
      });
    }
  });
})();


/* ════════════════════════════════════════════════════════════
   9. KALKYL-MODAL
   Öppnar/stänger modal, hanterar formulär-submit via mailto
   och visar bekräftelse-vy.
════════════════════════════════════════════════════════════ */
(function initKalkyl() {
  const modal        = document.getElementById('kalkyl-modal');
  const openBtn      = document.getElementById('kalkyl-open-btn');
  const closeBtn     = document.getElementById('kalkyl-close');
  const overlay      = document.getElementById('kalkyl-overlay');
  const form         = document.getElementById('kalkyl-form');
  const formWrap     = document.getElementById('kalkyl-form-wrap');
  const success      = document.getElementById('kalkyl-success');
  const successClose = document.getElementById('kalkyl-success-close');

  if (!modal || !openBtn) return;

  /* ── Öppna / stäng ── */
  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('kf-namn')?.focus(), 80);

    if (typeof gtag === 'function') {
      gtag('event', 'kalkyl_open');
    }
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  successClose?.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  /* ── Enkel validering ── */
  function validateField(input) {
    const ok = input.checkValidity();
    input.classList.toggle('error', !ok);
    return ok;
  }

  form?.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur',  () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validateField(input);
    });
  });

  /* ── Submit → mailto ── */
  form?.addEventListener('submit', function (e) {
    e.preventDefault();

    const namn    = document.getElementById('kf-namn');
    const email   = document.getElementById('kf-email');
    const foretag = document.getElementById('kf-foretag');

    const valid = [namn, email, foretag].map(validateField).every(Boolean);
    if (!valid) return;

    const subject = `Kalkylförfrågan från ${foretag.value}`;
    const body    = [
      `Namn:    ${namn.value}`,
      `E-post:  ${email.value}`,
      `Företag: ${foretag.value}`,
    ].join('\n');

    window.location.href =
      `mailto:markus.hjertqvist@viriba.se` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    /* Visa bekräftelse */
    formWrap.hidden = true;
    success.hidden  = false;

    if (typeof gtag === 'function') {
      gtag('event', 'kalkyl_submit', {
        company: foretag.value,
        section: 'kalkyl'
      });
    }
  });
})();
