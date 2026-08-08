// Bandcamp Owned/Wishlist Labels
// Labels grid items ("music-grid-item" tiles found on label/artist/tag pages)
// with "You own this" or "In Wishlist" based on your Bandcamp collection.

(function () {
  const DEFAULT_SETTINGS = {
    ownedColor: "#2e7d32",
    ownedText: "You own this",
    wishlistColor: "#1565c0",
    wishlistText: "In Wishlist",
    badgeStyle: "badge", // "badge" (overlay on artwork) or "heart" (icon next to title)
    heartIcon: "\u2665", // ♥ solid heart by default
    heartSize: 20, // px
  };

  let settings = DEFAULT_SETTINGS;
  let settingsPromise = null;
  let ownedSet = null;
  let wishlistSet = null;
  let fetchPromise = null;

  function loadSettings() {
    if (settingsPromise) return settingsPromise;
    settingsPromise = browser.storage.local.get(DEFAULT_SETTINGS).then((stored) => {
      settings = Object.assign({}, DEFAULT_SETTINGS, stored);
    });
    return settingsPromise;
  }

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
  // Search result tiles instead carry data-search='{"type":"a","id":1234567}'
  // (type "a" = album, "t" = track; other types like "b"/"l"/"f" are bands,
  // labels, and fans, which we ignore).
  function keyFor(el) {
    const itemId = el.getAttribute("data-item-id");
    if (itemId) {
      const m = itemId.match(/^(album|track)-(\d+)$/);
      if (m) return (m[1] === "album" ? "a" : "t") + m[2];
    }

    const searchAttr = el.getAttribute("data-search");
    if (searchAttr) {
      try {
        const parsed = JSON.parse(searchAttr);
        if (parsed && parsed.id && (parsed.type === "a" || parsed.type === "t")) {
          return parsed.type + parsed.id;
        }
      } catch (e) {
        // not JSON, or not a match — ignore
      }
    }

    // Discover page cards: data-test="results-grid-item-1234567". The type
    // (album vs track) isn't in this attribute, so infer it from the card's
    // link URL instead.
    const testAttr = el.getAttribute("data-test");
    if (testAttr) {
      const m = testAttr.match(/^results-grid-item-(\d+)$/);
      if (m) {
        const link = el.querySelector('a[href*="/album/"], a[href*="/track/"]');
        const href = (link && link.getAttribute("href")) || "";
        const type = href.includes("/track/") ? "t" : "a";
        return type + m[1];
      }
    }

    return null;
  }

  function labelItem(el) {
    if (el.dataset.bcOwnedChecked) return;
    const key = keyFor(el);
    if (!key) return;
    el.dataset.bcOwnedChecked = "1";

    let text = null;
    let color = null;
    if (ownedSet.has(key)) {
      text = settings.ownedText;
      color = settings.ownedColor;
    } else if (wishlistSet.has(key)) {
      text = settings.wishlistText;
      color = settings.wishlistColor;
    }
    if (!text) return;

    if (settings.badgeStyle === "heart") {
      addHeartIcon(el, text, color);
    } else {
      addOverlayBadge(el, text, color);
    }
  }

  function addOverlayBadge(el, text, color) {
    const badge = document.createElement("div");
    badge.className = "bc-owned-badge";
    badge.textContent = text;
    badge.style.backgroundColor = color;

    // Grid/search pages use ".art"; Discover page cards use ".image-container".
    const art = el.querySelector(".art") || el.querySelector(".image-container") || el;
    if (getComputedStyle(art).position === "static") {
      art.style.position = "relative";
    }
    art.appendChild(badge);
  }

  function addHeartIcon(el, text, color) {
    // Grid/Discover pages use ".title"; search results use ".heading".
    const textEl = el.querySelector(".title") || el.querySelector(".heading");
    const heart = document.createElement("span");
    heart.className = "bc-owned-heart";
    heart.textContent = settings.heartIcon;
    heart.style.color = color;
    heart.style.fontSize = settings.heartSize + "px";
    heart.title = text;

    if (!textEl) {
      // Fallback: no title row found, just drop it after the artwork.
      const art = el.querySelector(".art") || el.querySelector(".image-container") || el;
      art.insertAdjacentElement("afterend", heart);
      return;
    }

    // Wrap the title element (left untouched, so any internal line breaks
    // between album/artist are preserved) alongside the heart in an outer
    // row, so the heart pins to the top-right without disturbing the text.
    const wrapper = document.createElement("div");
    wrapper.className = "bc-owned-heart-row";
    textEl.parentNode.insertBefore(wrapper, textEl);
    wrapper.appendChild(textEl);
    wrapper.appendChild(heart);
  }

  function scan() {
    Promise.all([getCollectionSummary(), loadSettings()]).then(() => {
      document
        .querySelectorAll(
          "[data-item-id]:not([data-bc-owned-checked]), " +
            ".searchresult[data-search]:not([data-bc-owned-checked]), " +
            '[data-test^="results-grid-item-"]:not([data-bc-owned-checked])'
        )
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
