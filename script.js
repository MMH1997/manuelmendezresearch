document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-links");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const filterBar = document.querySelector("[data-pub-filters]");
  if (filterBar) {
    const buttons = Array.from(filterBar.querySelectorAll("button[data-filter]"));
    const items = Array.from(document.querySelectorAll(".publication[data-topics]"));
    const groups = Array.from(document.querySelectorAll(".publication-group"));
    const status = document.getElementById("pub-filter-status");

    groups.forEach((group) => {
      const count = group.querySelector(".publication-count");
      if (count) count.dataset.original = count.textContent.trim();
    });

    const apply = (topic) => {
      buttons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.filter === topic));
      });

      let shown = 0;
      items.forEach((item) => {
        const match = topic === "all" || item.dataset.topics.split(" ").includes(topic);
        item.hidden = !match;
        if (match) shown += 1;
      });

      groups.forEach((group) => {
        const visible = group.querySelectorAll(".publication:not([hidden])").length;
        group.hidden = visible === 0;
        const count = group.querySelector(".publication-count");
        if (count) {
          const original = count.dataset.original || "";
          count.textContent = topic === "all" ? original : visible + " of " + original;
        }
      });

      if (status) {
        status.textContent = topic === "all" ? "" : "Showing " + shown + " of " + items.length + " publications.";
      }
    };

    filterBar.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (button) apply(button.dataset.filter);
    });
  }
});
