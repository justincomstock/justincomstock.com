// Shared by the three designs. Small on purpose: arrive-on-scroll, the reading bar, looping clips that respect
// reduced motion, the pointer preview on the editorial index (A), and the chapter rail on the cinematic one (C).
(function () {
  var d = document, root = d.documentElement, still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rv = [].slice.call(d.querySelectorAll(".rv, .cs-body > *, .cs-body .sec > *:not(.lab)"));
  rv.forEach(function (el) { el.classList.add("rv"); });
  if (!("IntersectionObserver" in window) || still) rv.forEach(function (el) { el.classList.add("in"); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  }
  window.jcReady = true;

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
