/* Google Scholar metrics widget.
   Reads data/citations.json (refreshed daily by a GitHub Action).
   Progressive enhancement: the widget stays hidden unless the data loads. */
(() => {
  const widgets = Array.from(document.querySelectorAll("[data-scholar]"));
  if (!widgets.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => Number(n).toLocaleString("en");
  const isCount = (n) => Number.isFinite(n) && n >= 0;

  function countUp(el, target) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      el.textContent = fmt(target);
      return;
    }
    el.textContent = "0";
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 900;
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    observer.observe(el);
  }

  function renderChart(widget, byYear) {
    const chart = widget.querySelector("[data-scholar-chart]");
    if (!chart) return;
    const years = (Array.isArray(byYear) ? byYear : [])
      .filter((item) => Number.isFinite(item.year) && isCount(item.citations))
      .slice(-8);
    if (years.length < 2) {
      chart.hidden = true;
      return;
    }
    const max = Math.max(...years.map((item) => item.citations), 1);
    chart.setAttribute(
      "aria-label",
      "Citations per year: " + years.map((item) => item.year + ", " + item.citations).join("; ")
    );
    chart.textContent = "";
    years.forEach((item) => {
      const col = document.createElement("li");
      const value = document.createElement("span");
      value.className = "scholar-bar-value";
      value.textContent = fmt(item.citations);
      const bar = document.createElement("span");
      bar.className = "scholar-bar";
      bar.style.setProperty("--h", String(Math.max(4, Math.round((item.citations / max) * 100))));
      const label = document.createElement("span");
      label.className = "scholar-bar-year";
      label.textContent = "’" + String(item.year).slice(-2);
      col.append(value, bar, label);
      chart.append(col);
    });
    chart.hidden = false;
  }

  function render(widget, data) {
    const fields = {
      citations: data.citations,
      hIndex: data.hIndex,
      i10Index: data.i10Index,
    };
    if (!Object.values(fields).every(isCount)) return;

    Object.entries(fields).forEach(([key, value]) => {
      const el = widget.querySelector('[data-scholar-field="' + key + '"]');
      if (el) countUp(el, value);
    });

    const recent = widget.querySelector("[data-scholar-recent]");
    if (recent) {
      if (isCount(data.citationsRecent) && data.recentSince) {
        recent.textContent = fmt(data.citationsRecent) + " since " + data.recentSince;
        recent.hidden = false;
      } else {
        recent.hidden = true;
      }
    }

    const time = widget.querySelector("[data-scholar-updated]");
    if (time && data.checked) {
      const date = new Date(data.checked + "T00:00:00Z");
      if (!Number.isNaN(date.getTime())) {
        time.dateTime = data.checked;
        time.textContent = date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });
      }
    }

    const link = widget.querySelector("[data-scholar-link]");
    if (link && typeof data.profile === "string" && data.profile.startsWith("https://scholar.google.")) {
      link.href = data.profile;
    }

    renderChart(widget, data.byYear);
    widget.hidden = false;
  }

  fetch("data/citations.json", { cache: "no-cache" })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(response.status))))
    .then((data) => widgets.forEach((widget) => render(widget, data)))
    .catch(() => {
      /* No data yet: leave the widget hidden. */
    });
})();
