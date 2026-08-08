const DEFAULT_SETTINGS = {
  ownedColor: "#2e7d32",
  ownedText: "You own this",
  wishlistColor: "#1565c0",
  wishlistText: "In Wishlist",
  badgeStyle: "badge",
  heartIcon: "\u2665",
  heartSize: 20,
};

const els = {
  ownedText: document.getElementById("ownedText"),
  ownedColor: document.getElementById("ownedColor"),
  wishlistText: document.getElementById("wishlistText"),
  wishlistColor: document.getElementById("wishlistColor"),
  badgeStyle: document.getElementById("badgeStyle"),
  heartIcon: document.getElementById("heartIcon"),
  heartSize: document.getElementById("heartSize"),
  status: document.getElementById("status"),
};

function fill(settings) {
  els.ownedText.value = settings.ownedText;
  els.ownedColor.value = settings.ownedColor;
  els.wishlistText.value = settings.wishlistText;
  els.wishlistColor.value = settings.wishlistColor;
  els.badgeStyle.value = settings.badgeStyle;
  els.heartIcon.value = settings.heartIcon;
  els.heartSize.value = settings.heartSize;
}

function showStatus(msg) {
  els.status.textContent = msg;
  setTimeout(() => {
    els.status.textContent = "";
  }, 2500);
}

browser.storage.local.get(DEFAULT_SETTINGS).then(fill);

document.getElementById("save").addEventListener("click", () => {
  const parsedSize = parseInt(els.heartSize.value, 10);
  const heartSize = Number.isFinite(parsedSize)
    ? Math.min(80, Math.max(8, parsedSize))
    : DEFAULT_SETTINGS.heartSize;

  const settings = {
    ownedText: els.ownedText.value.trim() || DEFAULT_SETTINGS.ownedText,
    ownedColor: els.ownedColor.value,
    wishlistText: els.wishlistText.value.trim() || DEFAULT_SETTINGS.wishlistText,
    wishlistColor: els.wishlistColor.value,
    badgeStyle: els.badgeStyle.value,
    heartIcon: els.heartIcon.value.trim() || DEFAULT_SETTINGS.heartIcon,
    heartSize,
  };
  browser.storage.local.set(settings).then(() => {
    showStatus("Saved. Refresh any open Bandcamp tabs to see the changes.");
  });
});

document.getElementById("reset").addEventListener("click", () => {
  browser.storage.local.set(DEFAULT_SETTINGS).then(() => {
    fill(DEFAULT_SETTINGS);
    showStatus("Reset to defaults. Refresh any open Bandcamp tabs to see the changes.");
  });
});
