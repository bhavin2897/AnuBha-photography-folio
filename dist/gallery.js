const gallery = document.querySelector("#portfolio-gallery");
const photos = window.ANUBHA_PHOTOS || [];

function sourceSet(items) {
  return items.map(({ src, width }) => `${src} ${width}w`).join(", ");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}

if (gallery) {
  if (!photos.length) {
    gallery.innerHTML = '<p class="gallery-empty">New work is coming soon.</p>';
  } else {
    gallery.innerHTML = photos.map((photo, index) => {
      const largest = photo.variants.jpeg.at(-1).src;
      const fallback = photo.variants.jpeg[0].src;
      const eager = index === 0;
      const title = escapeHtml(photo.title);
      const alt = escapeHtml(photo.alt);
      return `
        <figure class="masonry-item overflow-hidden rounded-lg shadow-md">
          <a href="${largest}" data-fancybox="gallery" data-caption="${title}" class="block overflow-hidden rounded-lg">
            <picture>
              <source type="image/avif" srcset="${sourceSet(photo.variants.avif)}" sizes="(min-width: 1024px) 23vw, (min-width: 768px) 31vw, (min-width: 640px) 47vw, 92vw">
              <source type="image/webp" srcset="${sourceSet(photo.variants.webp)}" sizes="(min-width: 1024px) 23vw, (min-width: 768px) 31vw, (min-width: 640px) 47vw, 92vw">
              <img src="${fallback}" srcset="${sourceSet(photo.variants.jpeg)}" sizes="(min-width: 1024px) 23vw, (min-width: 768px) 31vw, (min-width: 640px) 47vw, 92vw" width="${photo.width}" height="${photo.height}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" class="w-full h-auto rounded-lg object-cover transition-transform duration-500 hover:scale-105">
            </picture>
          </a>
        </figure>`;
    }).join("");
    Fancybox.bind("[data-fancybox='gallery']", {});
  }
}
