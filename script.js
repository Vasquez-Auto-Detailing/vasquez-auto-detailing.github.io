const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");
const heroVideo = document.querySelector(".hero-video");
const heroClips = [
  { src: "assets/videos/07.mp4", poster: "assets/posters/07.webp" },
  { src: "assets/videos/03.mp4", poster: "assets/posters/03.webp" },
  { src: "assets/videos/04.mp4", poster: "assets/posters/04.webp" },
  { src: "assets/videos/16.mp4", poster: "assets/posters/16.webp" },
];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const galleryGrid = document.querySelector("#gallery-grid");
const galleryCount = document.querySelector("#gallery-count");
const mediaViewer = document.querySelector("#media-viewer");
const mediaViewerStage = document.querySelector("#media-viewer-stage");
const mediaViewerTitle = document.querySelector("#media-viewer-title");
const mediaViewerPosition = document.querySelector("#media-viewer-position");
const form = document.querySelector("#quote-form");
const formStatus = document.querySelector("#form-status");
const categoryLabels = {
  vehicles: "Vehicle",
  interior: "Interior",
  detailing: "Detailing in action",
};
let activeFilter = "all";
let visibleItems = [];
let viewerIndex = 0;
let heroClipIndex = 0;

document.querySelector("#year").textContent = new Date().getFullYear();

function playHeroVideo() {
  if (reducedMotion.matches || document.hidden) {
    heroVideo.pause();
    return;
  }

  heroVideo.play().catch((error) => {
    console.error("The homepage background video could not start playing.", error);
  });
}

heroVideo.addEventListener("ended", () => {
  heroClipIndex = (heroClipIndex + 1) % heroClips.length;
  const clip = heroClips[heroClipIndex];
  heroVideo.classList.add("is-changing");
  heroVideo.poster = clip.poster;
  heroVideo.src = clip.src;
  heroVideo.load();
  heroVideo.addEventListener("playing", () => heroVideo.classList.remove("is-changing"), { once: true });
  playHeroVideo();
});

heroVideo.addEventListener("error", () => {
  console.error("A homepage background video could not be loaded.", heroVideo.error);
  heroVideo.classList.remove("is-changing");
});

document.addEventListener("visibilitychange", playHeroVideo);
reducedMotion.addEventListener("change", playHeroVideo);
playHeroVideo();

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  navigation.classList.toggle("is-open", !isExpanded);
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("is-open");
  }
});

function createGalleryCard(item, index) {
  const card = document.createElement("figure");
  card.className = "media-card";
  card.dataset.kind = item.kind;
  card.dataset.category = item.category;
  card.dataset.itemIndex = String(index);
  card.style.setProperty("--card-order", index);

  const openButton = document.createElement("button");
  openButton.className = "media-open";
  openButton.type = "button";
  openButton.setAttribute("aria-label", `View ${item.kind}: ${item.caption}`);
  const preview = document.createElement("img");

  if (item.kind === "video") {
    preview.src = item.poster;
    preview.alt = "";
    preview.setAttribute("aria-hidden", "true");
    preview.loading = "lazy";
    preview.decoding = "async";
    const playMark = document.createElement("span");
    playMark.className = "media-play-mark";
    playMark.setAttribute("aria-hidden", "true");
    playMark.textContent = "▶";
    openButton.append(preview, playMark);
  } else {
    preview.src = item.src;
    preview.alt = item.alt;
    preview.loading = "lazy";
    preview.decoding = "async";
    openButton.append(preview);
  }

  card.append(openButton);
  return card;
}

if (typeof portfolioItems !== "undefined" && Array.isArray(portfolioItems)) {
  const fragment = document.createDocumentFragment();
  portfolioItems.forEach((item, index) => fragment.append(createGalleryCard(item, index)));
  galleryGrid.append(fragment);
}

function updateGalleryFilter(filter) {
  activeFilter = filter;
  visibleItems = portfolioItems.filter((item) => filter === "all" || item.category === filter);

  document.querySelectorAll(".gallery-filter").forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  galleryGrid.querySelectorAll(".media-card").forEach((card) => {
    card.hidden = filter !== "all" && card.dataset.category !== filter;
  });

  const photoCount = visibleItems.filter((item) => item.kind === "photo").length;
  const videoCount = visibleItems.length - photoCount;
  const photoLabel = `${photoCount} ${photoCount === 1 ? "photo" : "photos"}`;
  const videoLabel = `${videoCount} ${videoCount === 1 ? "video" : "videos"}`;
  galleryCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "item" : "items"} · ${photoLabel} · ${videoLabel}`;
  document.querySelector("#all-count").textContent = String(portfolioItems.length);
  document.querySelectorAll("[data-count-category]").forEach((count) => {
    count.textContent = String(portfolioItems.filter((item) => item.category === count.dataset.countCategory).length);
  });
}

function renderViewerItem() {
  const item = visibleItems[viewerIndex];
  if (!item) return;

  mediaViewerStage.replaceChildren();
  mediaViewerTitle.textContent = item.caption;
  mediaViewerPosition.textContent = `${viewerIndex + 1} / ${visibleItems.length}`;

  if (item.kind === "video") {
    const video = document.createElement("video");
    video.className = "media-viewer-media";
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.poster = item.poster;
    video.setAttribute("aria-label", item.alt);
    const source = document.createElement("source");
    source.src = item.src;
    source.type = "video/mp4";
    video.append(source);
    mediaViewerStage.append(video);
  } else {
    const image = document.createElement("img");
    image.className = "media-viewer-media";
    image.src = item.src;
    image.alt = item.alt;
    mediaViewerStage.append(image);
  }
}

function openMediaViewer(index) {
  visibleItems = portfolioItems.filter((item) => activeFilter === "all" || item.category === activeFilter);
  viewerIndex = visibleItems.findIndex((item) => item === portfolioItems[index]);
  if (viewerIndex < 0) return;
  renderViewerItem();
  mediaViewer.showModal();
}

function moveViewer(direction) {
  viewerIndex = (viewerIndex + direction + visibleItems.length) % visibleItems.length;
  renderViewerItem();
}

document.querySelectorAll(".gallery-filter").forEach((button) => {
  button.addEventListener("click", () => updateGalleryFilter(button.dataset.filter));
});

galleryGrid.addEventListener("click", (event) => {
  const openButton = event.target.closest(".media-open");
  if (openButton) openMediaViewer(Number(openButton.closest(".media-card").dataset.itemIndex));
});

document.querySelector("#media-viewer-close").addEventListener("click", () => mediaViewer.close());
document.querySelector("#media-viewer-prev").addEventListener("click", () => moveViewer(-1));
document.querySelector("#media-viewer-next").addEventListener("click", () => moveViewer(1));
mediaViewer.addEventListener("click", (event) => {
  if (event.target === mediaViewer) mediaViewer.close();
});
mediaViewer.addEventListener("close", () => mediaViewerStage.replaceChildren());
document.addEventListener("keydown", (event) => {
  if (!mediaViewer.open) return;
  if (event.key === "Escape") {
    event.preventDefault();
    mediaViewer.close();
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveViewer(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    moveViewer(1);
  }
});

updateGalleryFilter("all");

document.querySelectorAll("[data-service]").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector("#service").value = link.dataset.service;
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(form);
  const request = [
    "VASQUEZ AUTO DETAILING — FREE ESTIMATE REQUEST",
    `Name: ${values.get("name")}`,
    `Vehicle: ${values.get("vehicle")}`,
    `Service: ${values.get("service")}`,
    `Notes: ${values.get("message") || "None"}`,
    "I am in Fontana, California.",
  ].join("\n");

  try {
    await navigator.clipboard.writeText(request);
    formStatus.textContent = "Your estimate request has been copied. Paste it into a text or email to send.";
    formStatus.classList.add("is-ready");
    formStatus.classList.remove("is-error");
  } catch {
    formStatus.textContent = "We couldn't copy automatically in this browser. Select your details and copy them to send your request.";
    formStatus.classList.add("is-error");
    formStatus.classList.remove("is-ready");
  }
});
