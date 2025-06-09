// DARK MODE
const toggleBtnDesktop = document.getElementById("theme-toggle");
const toggleBtnMobile = document.getElementById("theme-toggle-mobile");
const html = document.documentElement;

// Set default dari localStorage
const currentTheme = localStorage.getItem("theme");
if (currentTheme === "dark") {
  html.setAttribute("data-bs-theme", "dark");
  showDarkIcons(true);
} else {
  html.setAttribute("data-bs-theme", "light");
  showDarkIcons(false);
}

// Tambahkan event ke kedua tombol
[toggleBtnDesktop, toggleBtnMobile].forEach((btn) => {
  if (btn) {
    btn.addEventListener("click", () => {
      const isDark = html.getAttribute("data-bs-theme") === "dark";
      const newTheme = isDark ? "light" : "dark";

      html.setAttribute("data-bs-theme", newTheme);
      localStorage.setItem("theme", newTheme);

      showDarkIcons(!isDark);
    });
  }
});

function showDarkIcons(isDark) {
  document.querySelectorAll(".light-mode-icon").forEach((el) => el.classList.toggle("d-none", !isDark));
  document.querySelectorAll(".dark-mode-icon").forEach((el) => el.classList.toggle("d-none", isDark));
}

// NAVBAR SCROLL SMOOTH
document.addEventListener("DOMContentLoaded", function () {
  // Ambil semua link di navbar yang mengarah ke ID section (anchor)
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href").slice(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        // Scroll halus dengan opsi
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
});

// TECH STACK SWEAPER
document.addEventListener("DOMContentLoaded", function () {
  const swiper = new Swiper(".tech-swiper", {
    slidesPerView: "auto",
    spaceBetween: 50,
    loop: true,
    allowTouchMove: true,
    speed: 5000,
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
      reverseDirection: true,
    },
  });

  swiper.autoplay.start();
});

// BACK TO TOP
document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("backToTop");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      btn.classList.remove("d-none");
      btn.classList.add("d-flex", "align-items-center", "justify-content-center");
    } else {
      btn.classList.add("d-none");
      btn.classList.remove("d-flex", "align-items-center", "justify-content-center");
    }
  });

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// SHOW PASSWORD REGISTER
document.addEventListener("DOMContentLoaded", function () {
  const toggleIcons = document.querySelectorAll(".toggle-password");

  toggleIcons.forEach((icon) => {
    icon.addEventListener("click", function () {
      const targetInput = document.querySelector(this.getAttribute("toggle"));
      const isHidden = targetInput.getAttribute("type") === "password";

      targetInput.setAttribute("type", isHidden ? "text" : "password");

      // Ganti ikon
      this.classList.toggle("bi-eye");
      this.classList.toggle("bi-eye-slash");
    });
  });
});

// EDIT EXPERIENCE
document.addEventListener("DOMContentLoaded", function () {
  const masihBekerjaCheckbox = document.getElementById("masihBekerja");
  const endDateInput = document.getElementById("endDate");

  function toggleEndDate() {
    if (masihBekerjaCheckbox.checked) {
      endDateInput.disabled = true;
      endDateInput.value = ""; // Kosongkan nilai jika 'present'
    } else {
      endDateInput.disabled = false;
      // Pada kasus edit, jika user melepas centang, end_date bisa tetap kosong
      // atau Anda bisa menyimpan nilai awal jika ada
    }
  }

  toggleEndDate(); // Panggil saat halaman dimuat
  masihBekerjaCheckbox.addEventListener("change", toggleEndDate); // Tambahkan event listener
});

// PROFILE SAYA
document.getElementById("saveProfileChanges").addEventListener("click", () => {
  const form = document.getElementById("editProfileForm");
  const formData = new FormData(form);

  fetch("/profile", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Profil berhasil diperbarui");
        location.reload();
      } else {
        alert("Gagal memperbarui profil: " + data.message);
      }
    })
    .catch((err) => {
      alert("Error saat mengirim data: " + err.message);
    });
});
