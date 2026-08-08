// Runs in the extension's privileged background context, so it isn't
// subject to the Bandcamp page's CORS policy (only to host_permissions).

const COLLECTION_API = "https://bandcamp.com/api/fan/2/collection_summary";

browser.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== "getCollectionSummary") return;

  return fetch(COLLECTION_API, { credentials: "include" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
    .then((data) => {
      if (data && data.error) {
        return Promise.reject(new Error(data.error_message || "API error"));
      }
      const summary = data.collection_summary || {};
      const tralbums = summary.tralbum_lookup || {};
      const wishlistLookup = summary.wishlist_lookup || {};

      const owned = [];
      const wishlist = [];

      for (const [key, item] of Object.entries(tralbums)) {
        if (item && item.purchased) {
          owned.push(key);
        } else {
          wishlist.push(key);
        }
      }
      // Merge in wishlist_lookup keys too, in case some wishlist items
      // don't appear in tralbum_lookup at all.
      for (const key of Object.keys(wishlistLookup)) {
        if (!owned.includes(key) && !wishlist.includes(key)) wishlist.push(key);
      }

      return { owned, wishlist };
    })
    .catch((err) => ({ error: String(err && err.message ? err.message : err) }));
});
