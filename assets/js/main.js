(function () {
  "use strict";

  var header = document.getElementById("header");
  var navToggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");

  // Sticky header — adds a border/background once the page scrolls
  function onScroll() {
    if (window.scrollY > 8) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  navToggle.addEventListener("click", function () {
    var isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    mobileNav.classList.toggle("is-open", !isOpen);
    navToggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
    document.body.style.overflow = isOpen ? "" : "hidden";
  });

  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menu");
      mobileNav.classList.remove("is-open");
      document.body.style.overflow = "";
    });
  });

  // Scroll-reveal for sections marked with .reveal
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Contact form — client-side validation + placeholder submit handling.
  // TODO: this form has no backend yet. Wire `action` on the <form> to a
  // service like Formspree/Getform, or replace this handler with a fetch()
  // call to that endpoint, before relying on it in production.
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      status.className = "form-status is-visible is-error";
      status.textContent =
        "O envio automático ainda não foi configurado. Por enquanto, fale direto pelo WhatsApp usando o botão acima.";
    });
  }
})();
