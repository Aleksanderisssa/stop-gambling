// home.js
document.addEventListener("DOMContentLoaded", () => {
  /* ================== PROGRESS ANIMATION ================== */
  const bars = document.querySelectorAll(".progressbar__value");
  bars.forEach(bar => {
    const target = bar.style.width; // ambil nilai inline misal "50%"
    bar.style.width = "0%";         // reset dulu
    setTimeout(() => {
      bar.style.width = target;     // animasi isi
    }, 300);
  });

  /* ================== NOTIFICATION INTERACTION ================== */
  const notifItems = document.querySelectorAll(".notif-item");
  notifItems.forEach(item => {
    item.addEventListener("click", () => {
      item.classList.toggle("notif-item--read");
    });
  });

  /* ================== CARD HOVER EFFECT ================== */
  const statCards = document.querySelectorAll(".stat-card");
  statCards.forEach(card => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-6px) scale(1.02)";
      card.style.transition = "transform .25s ease, box-shadow .25s ease";
      card.style.boxShadow = "0 18px 40px rgba(0,0,0,.5)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0) scale(1)";
      card.style.boxShadow = "var(--shadow)";
    });
  });

  /* ================== NAVBAR SCROLL SHADOW ================== */
  const nav = document.querySelector(".nav");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      nav.classList.add("nav--scrolled");
    } else {
      nav.classList.remove("nav--scrolled");
    }
  });
});
