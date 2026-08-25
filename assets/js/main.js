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

  // Contact form — client-side validation, then AJAX submit to Formspree.
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");

  function setFieldValidity(input) {
    var field = input.closest(".field");
    if (!field) return;
    var valid = input.checkValidity();
    field.classList.toggle("is-invalid", !valid);
    input.setAttribute("aria-invalid", String(!valid));
  }

  if (form) {
    var requiredInputs = form.querySelectorAll("[required]");

    requiredInputs.forEach(function (input) {
      input.addEventListener("blur", function () {
        setFieldValidity(input);
      });
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("is-invalid")) {
          setFieldValidity(input);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      requiredInputs.forEach(function (input) {
        setFieldValidity(input);
        if (!input.checkValidity() && !firstInvalid) {
          firstInvalid = input;
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        status.className = "form-status is-visible is-error";
        status.textContent = "Revise os campos destacados abaixo antes de enviar.";
        return;
      }

      var submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      status.className = "form-status is-visible";
      status.textContent = "Enviando...";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (response.ok) {
            status.className = "form-status is-visible is-success";
            status.textContent = "Mensagem enviada! A gente responde em breve.";
            form.reset();
          } else {
            status.className = "form-status is-visible is-error";
            status.textContent =
              "Não foi possível enviar agora. Tente de novo ou fale pelo WhatsApp usando o botão acima.";
          }
        })
        .catch(function () {
          status.className = "form-status is-visible is-error";
          status.textContent =
            "Não foi possível enviar agora. Tente de novo ou fale pelo WhatsApp usando o botão acima.";
        })
        .finally(function () {
          if (submitButton) submitButton.disabled = false;
        });
    });
  }
})();
