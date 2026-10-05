// Shared by the three designs. Small on purpose: arrive-on-scroll, the reading bar, the nav settling, a count-up,
// the light that follows the pointer (B), looping clips that respect reduced motion, the pointer preview on the editorial index (A), and the chapter rail on the cinematic one (C).
(function () {
  var d = document, root = d.documentElement, still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Arrive on scroll. Only what is still below the screen right now is set to wait (.w), so nothing a visitor can
  // already see is ever hidden, and with no script, no IntersectionObserver or reduced motion everything is just there.
  // Things that come into view together land one after another (--d); once landed the classes are cleared again.
  // In a case study a section itself never waits (its label and rule stay put); the pieces inside it arrive.
  var rv = [].slice.call(d.querySelectorAll(".rv, .sh, .foot-k, .foot-mail, .ab-facts > div, .xp-free, .cs-body > *:not(.sec), .cs-body .sec > *:not(.lab), .cnext"));
  [].forEach.call(d.querySelectorAll(".cs-body .chart li"), function (li, i) { li.style.setProperty("--i", i); });
  if ("IntersectionObserver" in window && !still) {
    var vh = innerHeight, wait = rv.filter(function (el) { return el.getBoundingClientRect().top > vh * 0.96; });
    var io = new IntersectionObserver(function (es) {
      var n = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        if (n) el.style.setProperty("--d", Math.min(n, 5) * 70 + "ms");
        n++;
        el.classList.add("in"); count(el);
        setTimeout(function () { el.classList.remove("w", "in"); el.style.removeProperty("--d"); }, 2200);
      });
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0 });
    wait.forEach(function (el) { el.classList.add("rv", "w"); io.observe(el); });
  }
  window.jcReady = true;

  // The live Dribbble figures count up once as they arrive (only if they were below the screen: a number already
  // read is never rewritten). The real text stays in the page; width is held so nothing around it moves.
  function count(box) {
    [].forEach.call(box.querySelectorAll(".dn b"), function (b) {
      var full = b.textContent, m = /^(\D*)(\d[\d,]*)(\.\d+)?(.*)$/.exec(full); if (!m) return;
      var to = parseFloat(m[2].replace(/,/g, "") + (m[3] || "")), dec = m[3] ? m[3].length - 1 : 0, t0 = 0;
      if (!(to > 20)) return;
      b.style.display = "inline-block"; b.style.minWidth = b.getBoundingClientRect().width + "px"; b.style.fontVariantNumeric = "tabular-nums";
      b.setAttribute("aria-label", full);
      function step(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / 1100), v = to * (1 - Math.pow(1 - k, 4));
        if (k < 1) { b.textContent = m[1] + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) + m[4]; requestAnimationFrame(step); }
        else { b.textContent = full; b.style.minWidth = ""; }
      }
      requestAnimationFrame(step);
    });
  }

  // B, desktop pointer only: tell the card under the cursor where the cursor is, for the soft light inside it
  if (fine && !still && d.body.classList.contains("t-b")) {
    var px = 0, py = 0, tg = null, pr = 0, SEL = ".card, .phead, .chead, .ab-top > div, .ab-facts > div, .ab-hi li, .foot .wrap";
    addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY; tg = e.target;
      if (!pr) pr = requestAnimationFrame(function () {
        pr = 0;
        var c = tg && tg.closest && tg.closest(SEL); if (!c) return;
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", (px - r.left).toFixed(0) + "px"); c.style.setProperty("--my", (py - r.top).toFixed(0) + "px");
      });
    }, { passive: true });
  }

  var bar = d.querySelector(".prog"), top = d.querySelector(".top"), tick = false;
  function onScroll() {
    tick = false;
    var y = window.scrollY, h = root.scrollHeight - innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
    if (top) top.classList.toggle("scrolled", y > 24);
  }
  addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // looping clips: play only while on screen, never for someone who asked for less motion
  var vids = [].slice.call(d.querySelectorAll("video[data-loop]"));
  if (vids.length && !still && "IntersectionObserver" in window) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); } else e.target.pause(); });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { vo.observe(v); });
  }

  // A: a preview that follows the pointer along the index
  var peek = d.querySelector(".peek");
  if (peek && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var img = peek.querySelector("img"), x = 0, y = 0, raf = 0;
    d.querySelectorAll(".ix a[data-img]").forEach(function (a) {
      a.addEventListener("pointerenter", function () {
        img.src = a.getAttribute("data-img"); peek.classList.toggle("contain", a.hasAttribute("data-contain")); peek.classList.add("on");
      });
      a.addEventListener("pointerleave", function () { peek.classList.remove("on"); });
    });
    addEventListener("pointermove", function (e) {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; peek.style.transform = "translate(" + Math.min(x + 28, innerWidth - 380) + "px," + Math.min(Math.max(y - 130, 12), innerHeight - 280) + "px)"; });
    }, { passive: true });
  }

  // C: a rail of chapters beside a case study, built from its own section labels
  var rail = d.querySelector(".rail");
  if (rail) {
    var secs = [].slice.call(d.querySelectorAll(".cs-body .sec:not(.cont)")), links = [];
    secs.forEach(function (s, i) {
      var lab = s.querySelector(".lab"); if (!lab || !lab.textContent.trim()) return;
      s.id = s.id || "ch-" + (i + 1);
      var a = d.createElement("a"); a.href = "#" + s.id; a.textContent = lab.textContent.replace(/^\d+\s*\/\s*/, "").replace(/:$/, "");
      var li = d.createElement("li"); li.appendChild(a); rail.querySelector("ol").appendChild(li); links.push([s, a]);
    });
    if (links.length > 1 && "IntersectionObserver" in window) {
      rail.hidden = false;
      var ro = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (l) { if (l[0] === e.target) l[1].setAttribute("aria-current", "true"); else l[1].removeAttribute("aria-current"); });
        });
      }, { rootMargin: "-35% 0px -55% 0px" });
      links.forEach(function (l) { ro.observe(l[0]); });
    }
  }
})();
