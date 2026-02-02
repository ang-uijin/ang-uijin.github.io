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

  // 漢堡選單切換
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarMenu = document.querySelector('.navbar-menu');

  if (navbarToggle && navbarMenu) {
    navbarToggle.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      this.setAttribute('aria-expanded', !isExpanded);
      this.classList.toggle('active');
      navbarMenu.classList.toggle('active');

      // 關閉選單時，同時關閉所有下拉選單
      if (isExpanded) {
        document.querySelectorAll('.navbar-menu > li.dropdown-open').forEach(item => {
          item.classList.remove('dropdown-open');
        });
      }
    });

    // 點擊選單外部時關閉選單
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.navbar')) {
        navbarToggle.classList.remove('active');
        navbarToggle.setAttribute('aria-expanded', 'false');
        navbarMenu.classList.remove('active');
        document.querySelectorAll('.navbar-menu > li.dropdown-open').forEach(item => {
          item.classList.remove('dropdown-open');
        });
      }
    });
  }

  // 行動版下拉選單切換（使用事件委派）
  document.addEventListener('click', function(e) {
    // 檢查是否點擊了 has-dropdown 內的 span
    const dropdownTrigger = e.target.closest('.navbar-menu > li.has-dropdown > span');

    if (dropdownTrigger && window.innerWidth <= 900) {
      e.preventDefault();
      e.stopPropagation();

      const parentItem = dropdownTrigger.parentElement;

      // 關閉其他已開啟的下拉選單
      document.querySelectorAll('.navbar-menu > li.dropdown-open').forEach(item => {
        if (item !== parentItem) {
          item.classList.remove('dropdown-open');
        }
      });

      // 切換當前下拉選單
      parentItem.classList.toggle('dropdown-open');
    }
  });

  // 視窗大小改變時重置選單狀態
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (window.innerWidth > 900) {
        // 桌面版：重置所有行動版狀態
        if (navbarToggle) {
          navbarToggle.classList.remove('active');
          navbarToggle.setAttribute('aria-expanded', 'false');
        }
        if (navbarMenu) {
          navbarMenu.classList.remove('active');
        }
        document.querySelectorAll('.navbar-menu > li.dropdown-open').forEach(item => {
          item.classList.remove('dropdown-open');
        });
      }
    }, 100);
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

  // Course tabs functionality (for /teach/ page)
  const courseTabs = document.querySelectorAll('.course-tab');
  const courseContents = document.querySelectorAll('.course-content');

  if (courseTabs.length > 0) {
    courseTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const courseId = this.getAttribute('data-course');

        // Remove active class from all tabs and contents
        courseTabs.forEach(t => t.classList.remove('active'));
        courseContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        this.classList.add('active');
        const targetContent = document.getElementById(courseId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }
});
