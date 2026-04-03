(() => {
  const tabButtons = Array.from(document.querySelectorAll(".tab"));
  const panes = {
    duo: document.getElementById("duo-pane"),
    solo: document.getElementById("solo-pane"),
    external: document.getElementById("external-pane"),
  };

  const ui = {
    tabNote: document.getElementById("tab-note"),
    duoCards: document.getElementById("duo-cards"),
    soloCards: document.getElementById("solo-cards"),
    duoMount: document.getElementById("duo-mount"),
    soloMount: document.getElementById("solo-mount"),
    externalCards: document.getElementById("external-cards"),
    externalFrame: document.getElementById("external-frame"),
    frameNote: document.getElementById("frame-note"),
    externalSearch: document.getElementById("external-search"),
    externalFilter: document.getElementById("external-filter"),
    externalSort: document.getElementById("external-sort"),
    externalCount: document.getElementById("external-count"),
    openRandom: document.getElementById("open-random"),
  };

  const state = {
    activeTab: "duo",
    duoCleanup: null,
    soloCleanup: null,
    frameTimer: null,
    renderedExternalKey: "",
    externalLoaded: false,
  };

  const tabNote = {
    duo: "6 local 2-player games.",
    solo: "6 local solo games.",
    external: "Qualified external game catalog.",
  };

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === "string") el.textContent = text;
    return el;
  }

  function updateTabUI(nextTab) {
    state.activeTab = nextTab;
    Object.entries(panes).forEach(([name, pane]) => {
      pane.hidden = name !== nextTab;
    });
    tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === nextTab;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });
    ui.tabNote.textContent = tabNote[nextTab];
  }

  function onTabKeydown(event) {
    const tabs = tabButtons;
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    const next = tabs[nextIndex];
    updateTabUI(next.dataset.tab);
    next.focus();
    if (next.dataset.tab === "external" && !state.externalLoaded) {
      renderExternalCatalog();
      state.externalLoaded = true;
    }
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      updateTabUI(button.dataset.tab);
      if (button.dataset.tab === "external" && !state.externalLoaded) {
        renderExternalCatalog();
        state.externalLoaded = true;
      }
    });
    button.addEventListener("keydown", onTabKeydown);
  });

  function mountLocal(kind, moduleDef) {
    const mount = kind === "duo" ? ui.duoMount : ui.soloMount;
    const cleanupKey = kind === "duo" ? "duoCleanup" : "soloCleanup";
    if (typeof state[cleanupKey] === "function") state[cleanupKey]();
    mount.innerHTML = "";
    const cleanup = moduleDef.mount(mount);
    state[cleanupKey] = typeof cleanup === "function" ? cleanup : null;
  }

  function renderLocalCards(target, kind, modules) {
    target.innerHTML = "";
    modules.forEach((moduleDef) => {
      const card = makeEl("article", "card");
      card.appendChild(makeEl("h3", "", moduleDef.label));
      card.appendChild(makeEl("p", "", moduleDef.desc));
      const row = makeEl("div", "row");
      const openButton = makeEl("button", "", "Open");
      openButton.addEventListener("click", () => mountLocal(kind, moduleDef));
      row.appendChild(openButton);
      card.appendChild(row);
      target.appendChild(card);
    });
  }

  function moduleTicTacToe(root) {
    root.innerHTML = "<h3>Morpion 2 joueurs</h3><p class='mini' id='status'>Tour: X</p><div class='board3' id='board'></div><div class='row'><button id='reset'>Reset</button></div>";
    const status = root.querySelector("#status");
    const boardEl = root.querySelector("#board");
    const reset = root.querySelector("#reset");
    let turn = "X";
    let done = false;
    let board = Array(9).fill("");
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const hasWin = () => wins.some(([a,b,c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
    const render = () => {
      boardEl.innerHTML = "";
      board.forEach((value, index) => {
        const cell = makeEl("button", "cell", value);
        cell.addEventListener("click", () => {
          if (done || board[index]) return;
          board[index] = turn;
          if (hasWin()) {
            done = true;
            status.textContent = `Gagnant: ${turn}`;
          } else if (board.every(Boolean)) {
            done = true;
            status.textContent = "Match nul";
          } else {
            turn = turn === "X" ? "O" : "X";
            status.textContent = `Tour: ${turn}`;
          }
          render();
        });
        boardEl.appendChild(cell);
      });
    };
    reset.addEventListener("click", () => {
      turn = "X";
      done = false;
      board = Array(9).fill("");
      status.textContent = "Tour: X";
      render();
    });
    render();
  }

  function moduleConnect4(root) {
    root.innerHTML = "<h3>Puissance 4</h3><p class='mini' id='status'>Tour: Rouge</p><div class='board7' id='board'></div><div class='row'><button id='reset'>Reset</button></div>";
    const status = root.querySelector("#status");
    const boardEl = root.querySelector("#board");
    const reset = root.querySelector("#reset");
    let turn = "red";
    let done = false;
    let board = Array.from({ length: 6 }, () => Array(7).fill(""));
    const inside = (r, c) => r >= 0 && r < 6 && c >= 0 && c < 7;
    const count = (r, c, dr, dc, color) => {
      let n = 0;
      let rr = r + dr;
      let cc = c + dc;
      while (inside(rr, cc) && board[rr][cc] === color) {
        n += 1;
        rr += dr;
        cc += dc;
      }
      return n;
    };
    const hasWin = (r, c, color) => [[1,0],[0,1],[1,1],[1,-1]].some(([dr, dc]) => 1 + count(r, c, dr, dc, color) + count(r, c, -dr, -dc, color) >= 4);
    const render = () => {
      boardEl.innerHTML = "";
      for (let r = 0; r < 6; r += 1) {
        for (let c = 0; c < 7; c += 1) {
          const cell = makeEl("button", "disc");
          if (board[r][c]) cell.classList.add(board[r][c]);
          cell.addEventListener("click", () => {
            if (done) return;
            let row = -1;
            for (let i = 5; i >= 0; i -= 1) {
              if (!board[i][c]) { row = i; break; }
            }
            if (row < 0) return;
            board[row][c] = turn;
            if (hasWin(row, c, turn)) {
              done = true;
              status.textContent = turn === "red" ? "Rouge gagne" : "Jaune gagne";
            } else if (board.flat().every(Boolean)) {
              done = true;
              status.textContent = "Match nul";
            } else {
              turn = turn === "red" ? "yellow" : "red";
              status.textContent = turn === "red" ? "Tour: Rouge" : "Tour: Jaune";
            }
            render();
          });
          boardEl.appendChild(cell);
        }
      }
    };
    reset.addEventListener("click", () => {
      turn = "red";
      done = false;
      board = Array.from({ length: 6 }, () => Array(7).fill(""));
      status.textContent = "Tour: Rouge";
      render();
    });
    render();
  }

  function moduleCounter(root, title, keyA, keyB, target) {
    root.innerHTML = `<h3>${title}</h3><p class='mini'>J1: ${keyA.toUpperCase()} | J2: ${keyB.toUpperCase()}</p><p class='mini' id='status'>0 - 0</p><div class='row'><button id='reset'>Reset</button></div>`;
    const status = root.querySelector("#status");
    const reset = root.querySelector("#reset");
    let a = 0;
    let b = 0;
    let done = false;
    const paint = () => {
      status.textContent = `${a} - ${b}`;
      if (a >= target) { done = true; status.textContent += " | J1 gagne"; }
      if (b >= target) { done = true; status.textContent += " | J2 gagne"; }
    };
    const onKey = (event) => {
      if (done) return;
      const key = event.key.toLowerCase();
      if (key === keyA) a += 1;
      if (key === keyB) b += 1;
      paint();
    };
    window.addEventListener("keydown", onKey);
    reset.addEventListener("click", () => {
      a = 0;
      b = 0;
      done = false;
      paint();
    });
    paint();
    return () => window.removeEventListener("keydown", onKey);
  }

  function moduleReflex(root) {
    root.innerHTML = "<h3>Duel reflexe</h3><p class='mini'>A pour J1, K pour J2 quand GO.</p><p class='mini' id='go'>Preparez-vous...</p><p class='mini' id='score'>0 - 0</p><div class='row'><button id='new'>Nouvelle manche</button></div>";
    const go = root.querySelector("#go");
    const score = root.querySelector("#score");
    const next = root.querySelector("#new");
    let armed = false;
    let timer = null;
    let a = 0;
    let b = 0;
    const launch = () => {
      armed = false;
      go.textContent = "Preparez-vous...";
      clearTimeout(timer);
      timer = setTimeout(() => {
        armed = true;
        go.textContent = "GO";
      }, 1000 + Math.random() * 2000);
    };
    const onKey = (event) => {
      const key = event.key.toLowerCase();
      if (key !== "a" && key !== "k") return;
      if (!armed) {
        go.textContent = key === "a" ? "J1 trop tot" : "J2 trop tot";
        return;
      }
      armed = false;
      if (key === "a") a += 1;
      else b += 1;
      score.textContent = `${a} - ${b}`;
    };
    next.addEventListener("click", launch);
    window.addEventListener("keydown", onKey);
    launch();
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }

  function moduleMemory(root) {
    root.innerHTML = "<h3>Memory</h3><p class='mini' id='state'></p><div class='board4' id='board'></div><div class='row'><button id='reset'>Melanger</button></div>";
    const stateText = root.querySelector("#state");
    const boardEl = root.querySelector("#board");
    const reset = root.querySelector("#reset");
    let values = [];
    let opened = [];
    let solved = new Set();
    let lock = false;
    const init = () => {
      values = ["A","A","B","B","C","C","D","D","E","E","F","F","G","G","H","H"].sort(() => Math.random() - 0.5);
      opened = [];
      solved = new Set();
      lock = false;
      render();
    };
    const render = () => {
      boardEl.innerHTML = "";
      values.forEach((value, index) => {
        const visible = opened.includes(index) || solved.has(index);
        const tile = makeEl("button", "tile", visible ? value : "?");
        tile.addEventListener("click", () => {
          if (lock || visible) return;
          opened.push(index);
          render();
          if (opened.length === 2) {
            const [a, b] = opened;
            if (values[a] === values[b]) {
              solved.add(a);
              solved.add(b);
              opened = [];
              if (solved.size === values.length) stateText.textContent = "Termine";
              render();
            } else {
              lock = true;
              setTimeout(() => {
                opened = [];
                lock = false;
                render();
              }, 650);
            }
          }
        });
        boardEl.appendChild(tile);
      });
    };
    reset.addEventListener("click", init);
    init();
  }

  function module2048(root) {
    root.innerHTML = "<h3>2048</h3><p class='mini'>Fusionne avec les fleches.</p><div class='board4' id='board'></div><p class='mini' id='score'>Score: 0</p>";
    const boardEl = root.querySelector("#board");
    const scoreEl = root.querySelector("#score");
    let board = Array(16).fill(0);
    let score = 0;
    const cells = [];
    for (let i = 0; i < 16; i += 1) {
      const cell = makeEl("div", "tile");
      cells.push(cell);
      boardEl.appendChild(cell);
    }
    const addTile = () => {
      const free = board.map((value, index) => (value ? null : index)).filter((index) => index !== null);
      if (!free.length) return;
      board[free[Math.floor(Math.random() * free.length)]] = Math.random() < 0.9 ? 2 : 4;
    };
    const draw = () => {
      cells.forEach((cell, index) => { cell.textContent = board[index] || ""; });
      scoreEl.textContent = `Score: ${score}`;
    };
    const compress = (line) => {
      line = line.filter(Boolean);
      for (let i = 0; i < line.length - 1; i += 1) {
        if (line[i] === line[i + 1]) {
          line[i] *= 2;
          score += line[i];
          line[i + 1] = 0;
        }
      }
      return line.filter(Boolean).concat([0, 0, 0, 0]).slice(0, 4);
    };
    const rows = () => [board.slice(0,4), board.slice(4,8), board.slice(8,12), board.slice(12,16)];
    const flatten = (matrix) => matrix.flat();
    const rotateRight = (source) => {
      const out = Array(16).fill(0);
      for (let r = 0; r < 4; r += 1) for (let c = 0; c < 4; c += 1) out[c * 4 + (3 - r)] = source[r * 4 + c];
      return out;
    };
    const move = (dir) => {
      const before = board.join(",");
      if (dir === "L") board = flatten(rows().map(compress));
      if (dir === "R") { board = rotateRight(rotateRight(board)); board = flatten(rows().map(compress)); board = rotateRight(rotateRight(board)); }
      if (dir === "U") { board = rotateRight(rotateRight(rotateRight(board))); board = flatten(rows().map(compress)); board = rotateRight(board); }
      if (dir === "D") { board = rotateRight(board); board = flatten(rows().map(compress)); board = rotateRight(rotateRight(rotateRight(board))); }
      if (before !== board.join(",")) addTile();
      draw();
    };
    const onKey = (event) => {
      if (event.key === "ArrowLeft") move("L");
      if (event.key === "ArrowRight") move("R");
      if (event.key === "ArrowUp") move("U");
      if (event.key === "ArrowDown") move("D");
    };
    addTile();
    addTile();
    draw();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }

  function moduleText(root, title, text) {
    root.innerHTML = `<h3>${title}</h3><p class='mini'>${text}</p>`;
  }

  const duoModules = [
    { id: "ttt", label: "Morpion 2 joueurs", desc: "Alternance X/O", mount: moduleTicTacToe },
    { id: "connect4", label: "Puissance 4", desc: "Aligner 4 pions", mount: moduleConnect4 },
    { id: "reflex", label: "Duel reflexe", desc: "A vs K au signal", mount: moduleReflex },
    { id: "battle", label: "Bataille de touches", desc: "A vs L en 8 sec", mount: (root) => moduleCounter(root, "Bataille de touches", "a", "l", 45) },
    { id: "race", label: "Course clavier", desc: "Q vs P premier a 25", mount: (root) => moduleCounter(root, "Course clavier", "q", "p", 25) },
    { id: "sprint", label: "Sprint clavier", desc: "W vs O premier a 30", mount: (root) => moduleCounter(root, "Sprint clavier", "w", "o", 30) },
  ];

  const soloModules = [
    { id: "2048", label: "2048", desc: "Fusion de tuiles", mount: module2048 },
    { id: "memory", label: "Memory", desc: "Trouver les paires", mount: moduleMemory },
    { id: "quiz", label: "Quiz rapide", desc: "Verification express", mount: (root) => moduleText(root, "Quiz rapide", "9x7=63, 2^5=32, capitale Italie=Rome.") },
    { id: "sequence", label: "Sequence", desc: "Memoire visuelle", mount: (root) => moduleText(root, "Sequence", "Reproduis oralement une suite A-B-C-D progressive.") },
    { id: "logic", label: "Logique", desc: "Defis mentaux", mount: (root) => moduleText(root, "Logique", "Suite 2,4,8,16 ? Reponse 32.") },
    { id: "rapid", label: "Calcul rapide", desc: "Mode chrono", mount: (root) => moduleText(root, "Calcul rapide", "Mode flash: 12x8, 9x7, 15x6, 17+26.") },
  ];

  const externalCatalog = [
    { name: "Basket Random", desc: "Basket arcade 2 joueurs", url: "https://www.twoplayergames.org/game/basket-random", tags: ["basket", "random", "duo"], qualityScore: 92, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Soccer Legends 2021", desc: "Football legends 2 joueurs", url: "https://www.crazygames.com/game/soccer-legends-2021", tags: ["soccer", "legends", "duo"], qualityScore: 94, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Basketball Legends 2020", desc: "Basket legends duel", url: "https://www.crazygames.com/game/basketball-legends-2020", tags: ["basket", "legends", "duo"], qualityScore: 95, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Soccer Random", desc: "Football random local/online", url: "https://www.twoplayergames.org/game/soccer-random", tags: ["soccer", "random", "duo"], qualityScore: 91, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Volley Random", desc: "Volley random 2 joueurs", url: "https://www.twoplayergames.org/game/volley-random", tags: ["random", "duo"], qualityScore: 89, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Boxing Random", desc: "Boxe random 2 joueurs", url: "https://www.twoplayergames.org/game/boxing-random", tags: ["random", "duo"], qualityScore: 87, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "BasketBros", desc: "Basket arcade multijoueur", url: "https://www.crazygames.com/game/basketbros", tags: ["basket", "duo"], qualityScore: 88, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Basketball Stars", desc: "Basket duel online", url: "https://www.crazygames.com/game/basketball-stars", tags: ["basket", "duo"], qualityScore: 90, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Football Masters", desc: "Football arcade", url: "https://www.crazygames.com/game/football-masters", tags: ["soccer", "duo"], qualityScore: 86, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Soccer Skills Euro Cup", desc: "Foot simulation rapide", url: "https://www.crazygames.com/game/soccer-skills-euro-cup", tags: ["soccer"], qualityScore: 82, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Rooftop Snipers", desc: "Duel reflexe 2 joueurs", url: "https://www.crazygames.com/game/rooftop-snipers", tags: ["duo"], qualityScore: 84, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Get On Top", desc: "Duel physique local", url: "https://www.twoplayergames.org/game/get-on-top", tags: ["duo"], qualityScore: 83, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Wrestle Jump", desc: "Duel timing local", url: "https://www.twoplayergames.org/game/wrestle-jump", tags: ["duo"], qualityScore: 84, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Drunken Duel", desc: "Duel ragdoll", url: "https://www.twoplayergames.org/game/drunken-duel", tags: ["duo"], qualityScore: 80, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Drunken Boxing", desc: "Boxe ragdoll", url: "https://www.twoplayergames.org/game/drunken-boxing", tags: ["duo"], qualityScore: 80, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Drunken Wrestle", desc: "Wrestling ragdoll", url: "https://www.twoplayergames.org/game/drunken-wrestle", tags: ["duo"], qualityScore: 79, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Fireboy and Watergirl", desc: "Coop duo classique", url: "https://www.crazygames.com/game/fireboy-and-watergirl-1-forest-temple", tags: ["duo"], qualityScore: 91, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Gun Mayhem 2", desc: "Action platform duel", url: "https://www.twoplayergames.org/game/gun-mayhem-2", tags: ["duo"], qualityScore: 85, sourceType: "twoplayergames", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Puppet Soccer", desc: "Football arcade", url: "https://www.crazygames.com/game/puppet-soccer", tags: ["soccer", "duo"], qualityScore: 82, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Penalty Shooters 2", desc: "Tirs au but", url: "https://www.crazygames.com/game/penalty-shooters-2", tags: ["soccer"], qualityScore: 88, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "A Small World Cup", desc: "Foot mini format", url: "https://www.crazygames.com/game/a-small-world-cup", tags: ["soccer", "random"], qualityScore: 84, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Head Soccer 2023", desc: "Foot arcade tetes", url: "https://www.crazygames.com/game/head-soccer-2023", tags: ["soccer"], qualityScore: 83, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Dunkers", desc: "Dunks rapides", url: "https://www.crazygames.com/game/dunkers", tags: ["basket"], qualityScore: 81, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Basket Swooshes", desc: "Tir precision basket", url: "https://www.crazygames.com/game/basket-swooshes", tags: ["basket"], qualityScore: 84, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Street Ball Jam", desc: "Arcade panier", url: "https://www.crazygames.com/game/street-ball-jam", tags: ["basket"], qualityScore: 80, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Tap-Tap Shots", desc: "Arcade timing basket", url: "https://www.crazygames.com/game/tap-tap-shots", tags: ["basket"], qualityScore: 79, sourceType: "crazygames", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Poki Basket Random", desc: "Mirror poki", url: "https://poki.com/fr/g/basket-random", tags: ["basket", "random", "duo"], qualityScore: 86, sourceType: "poki", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Poki Soccer Random", desc: "Mirror poki", url: "https://poki.com/fr/g/soccer-random", tags: ["soccer", "random", "duo"], qualityScore: 85, sourceType: "poki", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Tetr.io", desc: "Puzzle versus", url: "https://tetr.io", tags: ["duo"], qualityScore: 88, sourceType: "direct", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Skribbl", desc: "Dessin multijoueur", url: "https://skribbl.io", tags: ["duo"], qualityScore: 89, sourceType: "direct", embedLikely: false, lastChecked: "2026-04-03" },
    { name: "Papergames", desc: "Hub mini-jeux duo", url: "https://papergames.io/fr/", tags: ["duo"], qualityScore: 87, sourceType: "direct", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Codenames", desc: "Mots en equipe", url: "https://codenames.game/", tags: ["duo"], qualityScore: 90, sourceType: "direct", embedLikely: true, lastChecked: "2026-04-03" },
    { name: "Lichess", desc: "Echecs online", url: "https://lichess.org/", tags: ["duo"], qualityScore: 95, sourceType: "direct", embedLikely: true, lastChecked: "2026-04-03" },
  ];

  function formatDate(input) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return input;
    return date.toISOString().slice(0, 10);
  }

  function getExternalFilteredSorted() {
    const query = (ui.externalSearch.value || "").trim().toLowerCase();
    const filter = ui.externalFilter.value;
    const sort = ui.externalSort.value;

    let list = externalCatalog.filter((item) => {
      const filterMatch = filter === "all"
        || (filter === "reliable" ? item.qualityScore >= 88 : item.tags.includes(filter));
      if (!filterMatch) return false;
      if (!query) return true;
      const hay = `${item.name} ${item.desc} ${item.tags.join(" ")} ${item.sourceType}`.toLowerCase();
      return hay.includes(query);
    });

    list = [...list];
    if (sort === "quality") {
      list.sort((a, b) => b.qualityScore - a.qualityScore);
    } else if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    } else if (sort === "checked") {
      list.sort((a, b) => b.lastChecked.localeCompare(a.lastChecked));
    }
    return list;
  }

  function setupIframeStatus(item) {
    clearTimeout(state.frameTimer);
    ui.frameNote.textContent = `Loading: ${item.name}`;
    ui.externalFrame.src = item.url;
    state.frameTimer = setTimeout(() => {
      ui.frameNote.textContent = "Embed may be blocked. External open is recommended.";
    }, 4200);
    ui.externalFrame.onload = () => {
      clearTimeout(state.frameTimer);
      ui.frameNote.textContent = "Loaded. If frame stays blank, use Open.";
    };
  }

  function renderExternalCatalog() {
    const list = getExternalFilteredSorted();
    const key = JSON.stringify({
      q: (ui.externalSearch.value || "").trim().toLowerCase(),
      f: ui.externalFilter.value,
      s: ui.externalSort.value,
      n: list.map((item) => item.name),
    });

    if (key === state.renderedExternalKey) return;
    state.renderedExternalKey = key;

    ui.externalCount.textContent = `${list.length} game(s) shown`;
    ui.externalCards.innerHTML = "";

    list.forEach((item) => {
      const card = makeEl("article", "card");
      card.appendChild(makeEl("h3", "", item.name));
      card.appendChild(makeEl("p", "", `${item.desc} | Qualite ${item.qualityScore} | ${item.sourceType} | Verif ${formatDate(item.lastChecked)}`));

      const row = makeEl("div", "row");
      const loadButton = makeEl("button", "", "Load");
      const openButton = makeEl("button", "", "Open");
      const tagsButton = makeEl("button", "", `Tags: ${item.tags.join(", ")}`);
      tagsButton.setAttribute("aria-label", `Tags de ${item.name}: ${item.tags.join(", ")}`);
      tagsButton.disabled = true;

      loadButton.addEventListener("click", () => setupIframeStatus(item));
      openButton.addEventListener("click", () => window.open(item.url, "_blank", "noopener"));

      row.append(loadButton, openButton, tagsButton);
      card.appendChild(row);
      ui.externalCards.appendChild(card);
    });
  }

  function bindExternalControls() {
    ui.externalSearch.addEventListener("input", renderExternalCatalog);
    ui.externalFilter.addEventListener("change", renderExternalCatalog);
    ui.externalSort.addEventListener("change", renderExternalCatalog);
    ui.openRandom.addEventListener("click", () => {
      const list = getExternalFilteredSorted();
      if (!list.length) return;
      const pick = list[Math.floor(Math.random() * list.length)];
      window.open(pick.url, "_blank", "noopener");
    });
  }

  renderLocalCards(ui.duoCards, "duo", duoModules);
  renderLocalCards(ui.soloCards, "solo", soloModules);
  bindExternalControls();
  updateTabUI("duo");
})();
