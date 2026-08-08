// Bandcamp Owned/Wishlist Labels
// Labels grid items ("music-grid-item" tiles found on label/artist/tag pages)
// with "You own this" or "In Wishlist" based on your Bandcamp collection.

(function () {
  let ownedSet = null;
  let wishlistSet = null;
  let fetchPromise = null;

  // Asks the background script (privileged, not bound by page CORS) for the
  // logged-in fan's full collection + wishlist as sets of keys like
  // "a1234567" (album id 1234567) or "t7654321" (track id 7654321).
  function getCollectionSummary() {
    if (fetchPromise) return fetchPromise;

    fetchPromise = browser.runtime
      .sendMessage({ type: "getCollectionSummary" })
      .then((data) => {
        if (!data || data.error) throw new Error((data && data.error) || "no response");
        ownedSet = new Set(data.owned);
        wishlistSet = new Set(data.wishlist);
      })
      .catch((err) => {
        console.warn(
          "[Bandcamp Owned/Wishlist] Couldn't load your collection (are you logged in to bandcamp.com?)",
          err
        );
        ownedSet = new Set();
        wishlistSet = new Set();
      });

    return fetchPromise;
  }

  // Grid tiles carry data-item-id="album-1234567" or "track-1234567".
  function keyFor(el) {
    const raw = el.getAttribute("data-item-id") || "";
    const m = raw.match(/^(album|track)-(\d+)$/);
    if (!m) return null;
    return (m[1] === "album" ? "a" : "t") + m[2];
  }

  function labelItem(el) {
    if (el.dataset.bcOwnedChecked) return;
    const key = keyFor(el);
    if (!key) return;
    el.dataset.bcOwnedChecked = "1";

    let text = null;
    let cls = null;
    if (ownedSet.has(key)) {
      text = "You own this";
      cls = "bc-owned";
    } else if (wishlistSet.has(key)) {
      text = "In Wishlist";
      cls = "bc-wishlist";
    }
    if (!text) return;

    const badge = document.createElement("div");
    badge.className = "bc-owned-badge " + cls;
    badge.textContent = text;

    // Anchor the badge to the artwork thumbnail so it sits over the tile.
    const art = el.querySelector(".art") || el;
    if (getComputedStyle(art).position === "static") {
      art.style.position = "relative";
    }
    art.appendChild(badge);
  }

  function scan() {
    getCollectionSummary().then(() => {
      document
        .querySelectorAll("[data-item-id]:not([data-bc-owned-checked])")
        .forEach(labelItem);
    });
  }

  scan();

  // Bandcamp grids load more items via AJAX (pagination / infinite scroll).
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        scan();
        break;
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
