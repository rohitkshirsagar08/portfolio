/**
 * ROHIT KSHIRSAGAR — SOFTWARE & AI ENGINEERING PORTFOLIO
 * CLIENT-SIDE INTERACTIVITY & DYNAMIC NAVIGATION
 */

(function () {
  'use strict';

  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', function () {
      navMenu.classList.toggle('active');
      mobileToggle.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
    });

    // Close menu when clicking any nav link
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function () {
        navMenu.classList.remove('active');
        mobileToggle.textContent = '☰';
      });
    });
  }

  // 2. Active Section Highlighting on Scroll
  const sections = document.querySelectorAll('section[id]');
  const menuLinks = document.querySelectorAll('.nav-menu a');

  function highlightNavOnScroll() {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        menuLinks.forEach(link => {
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNavOnScroll);

  // 3. Smooth Header Elevation Shadow on Scroll
  const header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 30) {
        header.style.boxShadow = '0 4px 20px rgba(186, 120, 80, 0.08)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }

  console.log('Rohit Kshirsagar Portfolio Loaded Successfully with Soothing Orange & Warm White Theme.');
})();
