/* ═══════════════════════════════════════════════
   Eduardo Velocci Portfolio — script.js
═══════════════════════════════════════════════ */

/* ── NAV SCROLL STATE ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── HAMBURGER MENU ── */
const hamburger = document.getElementById('nav-hamburger');
const navMenu   = document.querySelector('.nav-links');
if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu.classList.toggle('open');
  });
  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
    }
  });
}

/* ── REVEAL ON SCROLL ── */
// Atribui delays de stagger uma única vez ao registrar,
// evitando recálculo bugado a cada interseção.
const revealEls = document.querySelectorAll('.reveal');

revealEls.forEach((el) => {
  const siblings = Array.from(el.parentElement.querySelectorAll('.reveal'));
  const idx = siblings.indexOf(el);
  el.style.transitionDelay = `${idx * 80}ms`;
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

revealEls.forEach((el) => revealObserver.observe(el));

/* ── ANIMATED COUNTERS ── */
function animateCounter(el) {
  const target   = parseFloat(el.dataset.target);
  const decimals = parseInt(el.dataset.decimals, 10) || 0;
  const duration = 2000;
  const start    = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('.stat-val').forEach((el) => counterObserver.observe(el));

/* ── PARTICLE CANVAS ── */
(function initParticles() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const PARTICLE_COLOR = 'rgba(72, 130, 134, 0.55)';
  const LINE_COLOR     = 'rgba(72, 130, 134, 0.12)';
  const COUNT          = window.innerWidth < 768 ? 28 : 55;
  const MAX_DIST       = window.innerWidth < 768 ? 100 : 140;
  const MAX_DIST_SQ    = MAX_DIST * MAX_DIST; // evita sqrt quando possível

  let W, H, particles;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    particles = Array.from({ length: COUNT }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.5 + 0.5,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Configurações de linha definidas UMA VEZ fora do loop O(n²)
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth   = 0.8;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dSq  = dx * dx + dy * dy;
        if (dSq < MAX_DIST_SQ) {
          ctx.globalAlpha = 1 - Math.sqrt(dSq) / MAX_DIST;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Partículas com fillStyle definido uma vez
    ctx.globalAlpha = 1;
    ctx.fillStyle   = PARTICLE_COLOR;
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function update() {
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });
  }

  let raf;
  function loop() {
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  // Para animação quando hero sai da tela
  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) loop();
      } else {
        cancelAnimationFrame(raf);
        raf = null;
      }
    },
    { threshold: 0 }
  );
  heroObserver.observe(document.querySelector('.hero'));

  // Debounce no resize para não recriar partículas a cada pixel
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      createParticles();
    }, 150);
  }, { passive: true });

  resize();
  createParticles();
  loop();
})();

/* ── VIDEO PARALLAX ON SCROLL ── */
(function initParallax() {
  const media = document.getElementById('hero-media');
  const hero  = document.querySelector('.hero');
  if (!media || !hero) return;

  // Altura cacheada — atualiza só no resize, não a cada frame
  let heroHeight = hero.offsetHeight;

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { heroHeight = hero.offsetHeight; }, 150);
  }, { passive: true });

  let ticking = false;

  function updateParallax() {
    const progress    = Math.min(window.scrollY / (heroHeight * 0.75), 1);
    const translateY  = progress * 120;
    const opacity     = Math.max(1 - progress * 1.4, 0);
    const scale       = 1 - progress * 0.06;

    media.style.transform = `translateY(-${translateY}px) scale(${scale})`;
    media.style.opacity   = opacity;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
})();

/* ── ACTIVE NAV LINK ── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.style.color = link.getAttribute('href') === `#${id}`
            ? 'var(--highlight)'
            : '';
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach((s) => sectionObserver.observe(s));

/* ── CONTACT FORM — AJAX ── */
(function initContactForm() {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.disabled    = true;
    btn.textContent = 'Enviando…';

    const data = {
      name:    form.querySelector('[name="name"]').value,
      email:   form.querySelector('[name="email"]').value,
      subject: form.querySelector('[name="subject"]').value || 'Contato via Portfólio',
      message: form.querySelector('[name="message"]').value,
    };

    try {
      const res = await fetch('https://formsubmit.co/ajax/duduvelocci@hotmail.com', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify(data),
      });

      if (res.ok) {
        form.querySelectorAll('.form-group, .form-row, .btn-submit').forEach(el => el.style.display = 'none');
        success.style.display = 'block';
      } else {
        throw new Error();
      }
    } catch {
      btn.disabled    = false;
      btn.textContent = 'Enviar mensagem';
      alert('Erro ao enviar. Tente novamente ou entre em contato pelo e-mail duduvelocci@hotmail.com');
    }
  });
})();
