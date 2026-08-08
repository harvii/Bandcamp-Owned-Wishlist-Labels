const DEFAULT_SETTINGS = {
  ownedColor: "#2e7d32",
  ownedText: "You own this",
  wishlistColor: "#1565c0",
  wishlistText: "In Wishlist",
};

const els = {
  ownedText: document.getElementById("ownedText"),
  ownedColor: document.getElementById("ownedColor"),
  wishlistText: document.getElementById("wishlistText"),
  wishlistColor: document.getElementById("wishlistColor"),
  status: document.getElementById("status"),
};

function fill(settings) {
  els.ownedText.value = settings.ownedText;
  els.ownedColor.value = settings.ownedColor;
  els.wishlistText.value = settings.wishlistText;
  els.wishlistColor.value = settings.wishlistColor;
}

function showStatus(msg) {
  els.status.textContent = msg;
  setTimeout(() => {
    els.status.textContent = "";
  }, 2500);
}

browser.storage.local.get(DEFAULT_SETTINGS).then(fill);

document.getElementById("save").addEventListener("click", () => {
  const settings = {
    ownedText: els.ownedText.value.trim() || DEFAULT_SETTINGS.ownedText,
    ownedColor: els.ownedColor.value,
    wishlistText: els.wishlistText.value.trim() || DEFAULT_SETTINGS.wishlistText,
    wishlistColor: els.wishlistColor.value,
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
