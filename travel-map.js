/* Interactive journey map (home page).
   Progressive enhancement: without JavaScript every place card stays visible. */
(() => {
  const root = document.querySelector("[data-travel]");
  if (!root) return;

  const stage = root.querySelector("[data-travel-stage]");
  const viewport = root.querySelector(".travel-viewport");
  const markers = Array.from(root.querySelectorAll(".travel-marker"));
  const chips = Array.from(root.querySelectorAll(".travel-chip"));
  const cards = Array.from(root.querySelectorAll(".travel-card"));
  const resetButton = root.querySelector("[data-travel-reset]");
  if (!stage || !viewport || !cards.length) return;

  const positions = {};
  markers.forEach((marker) => {
    positions[marker.dataset.place] = {
      left: parseFloat(marker.style.left),
      top: parseFloat(marker.style.top),
    };
  });

  let current = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function setView(place) {
    const card = cards.find((item) => item.dataset.place === place);
    const pos = positions[place];

    if (!place || !card || !pos) {
      stage.style.setProperty("--zoom", "1");
      stage.style.setProperty("--tx", "0px");
      stage.style.setProperty("--ty", "0px");
      return;
    }

    const zoom = parseFloat(card.dataset.zoom || "3");
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const x = (pos.left / 100) * width;
    const y = (pos.top / 100) * height;

    const tx = clamp(width / 2 - zoom * x, width - zoom * width, 0);
    const ty = clamp(height / 2 - zoom * y, height - zoom * height, 0);

    stage.style.setProperty("--zoom", String(zoom));
    stage.style.setProperty("--tx", tx.toFixed(1) + "px");
    stage.style.setProperty("--ty", ty.toFixed(1) + "px");
  }

  function select(place) {
    current = place || null;

    chips.forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.place === current));
    });
    markers.forEach((marker) => {
      marker.classList.toggle("is-active", marker.dataset.place === current);
    });
    cards.forEach((card) => {
      const showOverview = !current && card.dataset.place === "overview";
      card.hidden = !(showOverview || card.dataset.place === current);
    });
    if (resetButton) resetButton.hidden = !current;

    setView(current);
  }

  root.classList.add("is-enhanced");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      select(chip.dataset.place === current ? null : chip.dataset.place);
    });
  });

  markers.forEach((marker) => {
    marker.addEventListener("click", () => {
      select(marker.dataset.place === current ? null : marker.dataset.place);
    });
  });

  if (resetButton) resetButton.addEventListener("click", () => select(null));

  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && current) select(null);
  });

  window.addEventListener("resize", () => setView(current));

  select(null);
})();
