// Initialize carousel for homepage
document.addEventListener('DOMContentLoaded', function() {
  // Carousel functionality
  const carouselTrack = document.querySelector('.carousel-track');
  if (carouselTrack) {
    // Clone all images for seamless loop
    const images = carouselTrack.querySelectorAll('img');
    images.forEach(img => {
      const clone = img.cloneNode(true);
      carouselTrack.appendChild(clone);
    });
  }

  // Navbar dropdown for mobile
  const navbarItems = document.querySelectorAll('.navbar-menu > li');
  navbarItems.forEach(item => {
    const link = item.querySelector('> span, > a');
    const dropdown = item.querySelector('.navbar-dropdown');

    if (dropdown && link) {
      link.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        }
      });
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
