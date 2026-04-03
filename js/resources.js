(() => {
  const quickFilters = Array.from(document.querySelectorAll(".chip"));
  const ui = {
    search: document.getElementById("external-search"),
    filter: document.getElementById("external-filter"),
    sort: document.getElementById("external-sort"),
    collection: document.getElementById("external-collection"),
    count: document.getElementById("external-count"),
    cards: document.getElementById("external-cards"),
    openRandom: document.getElementById("open-random"),
    prev: document.getElementById("catalog-prev"),
    next: document.getElementById("catalog-next"),
    pageNote: document.getElementById("catalog-page-note"),
    reader: document.getElementById("reader"),
    readerTitle: document.getElementById("reader-title"),
    readerStatus: document.getElementById("frame-note"),
    readerFrame: document.getElementById("external-frame"),
    readerSize: document.getElementById("reader-size"),
    readerReload: document.getElementById("reader-reload"),
    readerOpen: document.getElementById("reader-open"),
    readerCopy: document.getElementById("reader-copy"),
  };

  const externalUnique = [
    { id: "basket-direct", name: "Basket Random (Direct Embed)", desc: "Lien direct Basket Random.", url: "https://files.twoplayergames.org/files/games/other/Basket_Random/index.html", tags: ["duo", "basket", "random"], players: "duo", qualityScore: 98, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "soccer-random", name: "Soccer Random", desc: "Soccer random 2 joueurs.", url: "https://www.twoplayergames.org/gameframe/soccer-random", tags: ["duo", "soccer", "random"], players: "duo", qualityScore: 96, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "volley-random", name: "Volley Random", desc: "Volley random 2 joueurs.", url: "https://www.twoplayergames.org/gameframe/volley-random", tags: ["duo", "random"], players: "duo", qualityScore: 94, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "football-legends", name: "Football Legends 2021", desc: "Mode legends football.", url: "https://www.twoplayergames.org/gameframe/football-legends-2021", tags: ["duo", "soccer", "random"], players: "duo", qualityScore: 95, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "boxing-random", name: "Boxing Random", desc: "Duel boxing random.", url: "https://www.twoplayergames.org/gameframe/boxing-random", tags: ["duo", "random"], players: "duo", qualityScore: 93, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "basketball-stars", name: "Basketball Stars", desc: "Basket arcade duo.", url: "https://www.twoplayergames.org/gameframe/basketball-stars", tags: ["duo", "basket"], players: "duo", qualityScore: 92, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "rooftop-snipers", name: "Rooftop Snipers", desc: "Snipers duel chaos.", url: "https://www.twoplayergames.org/gameframe/rooftop-snipers", tags: ["duo", "random"], players: "duo", qualityScore: 91, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "tank-stars", name: "Tank Stars", desc: "Duel tanks strategy.", url: "https://www.twoplayergames.org/gameframe/tank-stars", tags: ["duo", "random"], players: "duo", qualityScore: 90, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "mini-battles", name: "MiniBattles", desc: "Collection mini-jeux duo.", url: "https://files.twoplayergames.org/files/games/o2/MiniBattles/index.html", tags: ["duo", "random"], players: "duo", qualityScore: 89, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "2-3-4-player-games", name: "2-3-4 Player Games", desc: "Pack multi-joueurs local.", url: "https://www.twoplayergames.org/gameframe/2-3-4-player-games", tags: ["duo", "random"], players: "duo", qualityScore: 88, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "tag-run", name: "Tag Run", desc: "Course/tag arcade rapide.", url: "https://www.twoplayergames.org/gameframe/tag-run", tags: ["duo", "random"], players: "duo", qualityScore: 87, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "two-ball-3d", name: "Two Ball 3D", desc: "Reflexes duo en 3D.", url: "https://www.twoplayergames.org/gameframe/two-ball-3d", tags: ["duo", "random"], players: "duo", qualityScore: 87, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
    { id: "stick-badminton-2", name: "Stick Badminton 2", desc: "Badminton arcade 2 joueurs.", url: "https://www.twoplayergames.org/gameframe/stick-badminton-2", tags: ["duo", "random"], players: "duo", qualityScore: 88, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
  ];

  const state = {
    chip: "all",
    page: 1,
    pageSize: 8,
    readerItem: null,
    readerLoaded: false,
    readerTimer: null,
  };

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === "string") el.textContent = text;
    return el;
  }

  function setStatus(message) {
    ui.readerStatus.textContent = message;
    document.dispatchEvent(new CustomEvent("reader-status", { detail: { message } }));
  }

  function applyReaderSize(size) {
    ui.reader.classList.remove("size-compact", "size-standard", "size-large");
    ui.reader.classList.add(`size-${size}`);
  }

  function openInWindow(item) {
    window.open(item.url, "_blank", "noopener,noreferrer");
    document.dispatchEvent(new CustomEvent("open-in-window", { detail: { itemId: item.id, url: item.url } }));
  }

  function launchInSite(item) {
    clearTimeout(state.readerTimer);
    state.readerLoaded = false;
    state.readerItem = item;
    ui.readerTitle.textContent = `Lecteur: ${item.name}`;
    setStatus(`Chargement de ${item.name}...`);
    ui.readerFrame.src = item.url;
    state.readerTimer = setTimeout(() => {
      if (!state.readerLoaded) setStatus("Chargement lent ou bloque. Essayez Ouvrir fenetre.");
    }, 4500);
    document.dispatchEvent(new CustomEvent("launch-in-site", { detail: { itemId: item.id, url: item.url } }));
  }

  ui.readerFrame.addEventListener("load", () => {
    state.readerLoaded = true;
    clearTimeout(state.readerTimer);
    if (state.readerItem) setStatus(`Lecteur pret: ${state.readerItem.name}`);
  });
  ui.readerFrame.addEventListener("error", () => {
    setStatus("Erreur iframe. Utilisez Ouvrir fenetre.");
  });

  function collectionMatch(item, col) {
    if (col === "all") return true;
    if (col === "duo-fast") return item.tags.includes("random");
    if (col === "basket-like") return item.tags.includes("basket");
    if (col === "soccer-like") return item.tags.includes("soccer");
    return true;
  }

  function filterMatch(item, filter) {
    if (filter === "all") return true;
    if (filter === "duo") return item.players === "duo";
    if (filter === "basket") return item.tags.includes("basket");
    if (filter === "soccer") return item.tags.includes("soccer");
    if (filter === "random") return item.tags.includes("random");
    return true;
  }

  function getFilteredSorted() {
    const query = (ui.search.value || "").trim().toLowerCase();
    const filter = state.chip === "all" ? ui.filter.value : state.chip;
    const collection = ui.collection.value;
    const sort = ui.sort.value;

    let list = externalUnique.filter((item) => {
      if (!filterMatch(item, filter)) return false;
      if (!collectionMatch(item, collection)) return false;
      if (!query) return true;
      const hay = `${item.name} ${item.desc} ${item.tags.join(" ")}`.toLowerCase();
      return hay.includes(query);
    });

    list = [...list];
    if (sort === "quality") list.sort((a, b) => b.qualityScore - a.qualityScore);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return list;
  }

  function updatePager(total) {
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page < 1) state.page = 1;
    if (state.page > pages) state.page = pages;
    ui.prev.disabled = state.page <= 1;
    ui.next.disabled = state.page >= pages;
    ui.pageNote.textContent = `Page ${state.page}/${pages}`;
  }

  function renderCards() {
    const list = getFilteredSorted();
    updatePager(list.length);
    const start = (state.page - 1) * state.pageSize;
    const page = list.slice(start, start + state.pageSize);

    ui.count.textContent = `${list.length} ressources | ${externalUnique.length} total`;
    ui.cards.innerHTML = "";
    page.forEach((item) => {
      const card = makeEl("article", "card");
      card.appendChild(makeEl("h3", "", item.name));
      card.appendChild(makeEl("p", "", `${item.desc} | ${item.players} | Q${item.qualityScore}`));
      const row = makeEl("div", "row");
      const launch = makeEl("button", "primary", "Lancer ici");
      const open = makeEl("button", "", "Ouvrir fenetre");
      const tags = makeEl("button", "", `Tags: ${item.tags.join(", ")}`);
      tags.disabled = true;
      launch.addEventListener("click", () => launchInSite(item));
      open.addEventListener("click", () => openInWindow(item));
      row.append(launch, open, tags);
      card.appendChild(row);
      ui.cards.appendChild(card);
    });
  }

  ui.search.addEventListener("input", () => { state.page = 1; renderCards(); });
  ui.filter.addEventListener("change", () => {
    state.page = 1;
    state.chip = "all";
    quickFilters.forEach((chip) => chip.classList.toggle("active", chip.dataset.chip === "all"));
    renderCards();
  });
  ui.sort.addEventListener("change", () => { state.page = 1; renderCards(); });
  ui.collection.addEventListener("change", () => { state.page = 1; renderCards(); });
  ui.prev.addEventListener("click", () => { state.page -= 1; renderCards(); });
  ui.next.addEventListener("click", () => { state.page += 1; renderCards(); });
  ui.openRandom.addEventListener("click", () => {
    const list = getFilteredSorted();
    if (!list.length) return;
    const pick = list[Math.floor(Math.random() * list.length)];
    launchInSite(pick);
  });
  quickFilters.forEach((chip) => {
    chip.addEventListener("click", () => {
      state.chip = chip.dataset.chip;
      state.page = 1;
      quickFilters.forEach((c) => c.classList.toggle("active", c === chip));
      renderCards();
    });
  });
  ui.readerSize.addEventListener("change", () => applyReaderSize(ui.readerSize.value));
  ui.readerReload.addEventListener("click", () => {
    if (!state.readerItem) return setStatus("Aucune ressource selectionnee.");
    launchInSite(state.readerItem);
  });
  ui.readerOpen.addEventListener("click", () => {
    if (!state.readerItem) return setStatus("Aucune ressource selectionnee.");
    openInWindow(state.readerItem);
  });
  ui.readerCopy.addEventListener("click", async () => {
    if (!state.readerItem) return setStatus("Aucune ressource selectionnee.");
    try {
      await navigator.clipboard.writeText(state.readerItem.url);
      setStatus("Lien copie.");
    } catch {
      setStatus("Copie bloquee par le navigateur.");
    }
  });

  applyReaderSize("standard");
  setStatus("Catalogue charge: 13 liens Twoplayergames.");
  renderCards();
})();
