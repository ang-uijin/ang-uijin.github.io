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

  // Lightbox 燈箱功能 (for /photo/ page)
  const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');

  if (lightboxTriggers.length > 0) {
    // 建立 lightbox overlay
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="關閉">&times;</button>
        <img src="" alt="">
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const lightboxImg = overlay.querySelector('img');
    const lightboxCaption = overlay.querySelector('.lightbox-caption');
    const closeBtn = overlay.querySelector('.lightbox-close');

    // 點擊照片開啟 lightbox
    lightboxTriggers.forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        const imgSrc = this.getAttribute('href');
        const caption = this.closest('.photo-item').querySelector('.photo-caption strong');

        lightboxImg.src = imgSrc;
        lightboxImg.alt = caption ? caption.textContent : '';
        lightboxCaption.textContent = caption ? caption.textContent : '';
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    // 關閉 lightbox
    function closeLightbox() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeLightbox();
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeLightbox();
      }
    });

    // ESC 鍵關閉
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

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
