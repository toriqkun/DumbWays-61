// Dark mode functionality
// function initDarkMode() {
//   // Always default to light theme if no preference is saved
//   if (localStorage.theme === "dark") {
//     document.documentElement.classList.add("dark");
//   } else {
//     document.documentElement.classList.remove("dark");
//     localStorage.theme = "light"; // Set light theme as default
//   }

//   // Theme toggle buttons
//   const themeToggles = ["theme-toggle", "theme-toggle-mobile"];

//   themeToggles.forEach((id) => {
//     const toggle = document.getElementById(id);
//     if (toggle) {
//       toggle.addEventListener("click", () => {
//         document.documentElement.classList.toggle("dark");
//         localStorage.theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
//       });
//     }
//   });
// }

// Mobile drawer functionality
function initMobileDrawer() {
  const drawer = document.getElementById("mobile-drawer");
  const drawerContent = drawer.querySelector(".absolute.right-0");
  const backdrop = drawer.querySelector(".absolute.inset-0.bg-black");
  const openButton = document.getElementById("mobile-menu-button");
  const closeButton = document.getElementById("close-drawer");

  function openDrawer() {
    drawer.classList.remove("invisible");
    document.body.style.overflow = "hidden"; // Prevent scrolling when drawer is open
    requestAnimationFrame(() => {
      backdrop.classList.remove("opacity-0");
      drawerContent.classList.remove("translate-x-full");
    });
  }

  function closeDrawer() {
    backdrop.classList.add("opacity-0");
    drawerContent.classList.add("translate-x-full");
    document.body.style.overflow = ""; // Re-enable scrolling
    setTimeout(() => {
      drawer.classList.add("invisible");
    }, 300);
  }

  // Event Listeners
  openButton?.addEventListener("click", openDrawer);
  closeButton?.addEventListener("click", closeDrawer);
  backdrop?.addEventListener("click", closeDrawer);

  // Close drawer when pressing escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // Close drawer when clicking navigation links
  const drawerLinks = drawer.querySelectorAll("a");
  drawerLinks.forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });
}

// Smooth scrolling functionality
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");

      // Close mobile drawer if open
      const drawer = document.getElementById("mobile-drawer");
      if (drawer && !drawer.classList.contains("invisible")) {
        drawer.querySelector(".absolute.right-0").classList.add("translate-x-full");
        drawer.querySelector(".absolute.inset-0").classList.add("opacity-0");
        setTimeout(() => {
          drawer.classList.add("invisible");
        }, 300);
      }

      // Scroll to target
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerOffset = 80; // Adjust based on your header height
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // initDarkMode();
  initMobileDrawer();
  initSmoothScroll();
});
