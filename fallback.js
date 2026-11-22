(async () => {
  let text = "";
  try {
    text = decodeURIComponent(location.hash.slice(1));
  } catch (e) {
    text = "";
  }
  if (!text) {
    try {
      text = ((await navigator.clipboard.readText()) || "").trim();
    } catch (e) {
      text = "";
    }
  }
  lfToolsPopup(text);
})();
