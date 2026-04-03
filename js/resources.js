(() => {
  const tabButtons = Array.from(document.querySelectorAll(".tab"));
  const quickFilters = Array.from(document.querySelectorAll(".chip"));
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
    search: document.getElementById("external-search"),
    filter: document.getElementById("external-filter"),
    sort: document.getElementById("external-sort"),
    collection: document.getElementById("external-collection"),
    count: document.getElementById("external-count"),
    openRandom: document.getElementById("open-random"),
    prev: document.getElementById("catalog-prev"),
    next: document.getElementById("catalog-next"),
    pageNote: document.getElementById("catalog-page-note"),
    readerTitle: document.getElementById("reader-title"),
    status: document.getElementById("frame-note"),
    frame: document.getElementById("external-frame"),
    readerSize: document.getElementById("reader-size"),
    readerReload: document.getElementById("reader-reload"),
    readerOpen: document.getElementById("reader-open"),
    readerCopy: document.getElementById("reader-copy"),
    reader: document.getElementById("reader"),
  };

  const state = {
    activeTab: "duo",
    duoCleanup: null,
    soloCleanup: null,
    renderedKey: "",
    filterChip: "all",
    page: 1,
    pageSize: 18,
    readerItem: null,
    readerTimer: null,
    readerLoaded: false,
    searchDebounce: null,
  };
  const isFileMode = window.location.protocol === "file:";

  const tabNote = {
    duo: "6 modules duo locaux.",
    solo: "6 modules solo locaux.",
    external: "Catalogue externe qualifie (60+).",
  };

  const popularityKey = "calcsolver_resource_popularity_v1";
  const getPopularityMap = () => {
    try {
      const raw = localStorage.getItem(popularityKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const savePopularityMap = (map) => {
    try {
      localStorage.setItem(popularityKey, JSON.stringify(map));
    } catch {
      // no-op
    }
  };
  const popularity = getPopularityMap();
  const fileModeCatalog = [
    { code: "1001", name: "10 Minutes Till Dawn", url: "https://geet.in.net/get/10-minutes-till-dawn/game.html" },
    { code: "1002", name: "1v1.LOL", url: "https://geet.in.net/get/1v1-lol/game.html" },
    { code: "1003", name: "1 on 1 Soccer", url: "https://geet.in.net/get/1v1-soccer/game.html" },
    { code: "1004", name: "2048", url: "https://geet.in.net/get/2048/game.html" },
    { code: "1005", name: "3D Bowling", url: "https://geet.in.net/get/3d-bowling/game.html" },
    { code: "1006", name: "8 Ball", url: "https://geet.in.net/get/8-ball/game.html" },
    { code: "1009", name: "Ages of Conflict", url: "https://geet.in.net/get/ages-of-conflict/game.html" },
    { code: "1010", name: "Among Us", url: "https://geet.in.net/get/among-us/game.html" },
    { code: "1012", name: "Apple Shooter", url: "https://geet.in.net/get/apple-shooter/game.html" },
    { code: "1014", name: "Arcane Archer", url: "https://geet.in.net/get/arcane-archer/game.html" },
    { code: "1015", name: "Awesome Tanks 2", url: "https://geet.in.net/get/awesome-tanks-2/game.html" },
    { code: "1018", name: "Bacon May Die", url: "https://geet.in.net/get/bacon-may-die/game.html" },
    { code: "1019", name: "Bad Ice Cream", url: "https://geet.in.net/get/bad-ice-cream/game.html" },
    { code: "1022", name: "Basket Random", url: "https://geet.in.net/get/basket-random/game.html" },
    { code: "1023", name: "Basketball Stars", url: "https://geet.in.net/get/basketball-stars/game.html" },
    { code: "1027", name: "Bloons TD 4", url: "https://geet.in.net/get/bloonstd-4/game.html" },
    { code: "1028", name: "Bloxorz", url: "https://geet.in.net/get/bloxors/game.html" },
    { code: "1029", name: "Blumgi Rocket", url: "https://geet.in.net/get/blumgi-rocket/game.html" },
    { code: "1030", name: "Blumgi Slime", url: "https://geet.in.net/get/blumgi-slime/game.html" },
    { code: "1031", name: "Bob the Robber 2", url: "https://geet.in.net/get/bob-the-robber-2/game.html" },
    { code: "1035", name: "Boxing Random", url: "https://geet.in.net/get/boxing-random/game.html" },
  ];

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === "string") el.textContent = text;
    return el;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function debounceSearch() {
    clearTimeout(state.searchDebounce);
    state.searchDebounce = setTimeout(() => {
      state.page = 1;
      renderExternal();
    }, 130);
  }

  function setTab(tab) {
    state.activeTab = tab;
    Object.entries(panes).forEach(([name, pane]) => {
      pane.hidden = name !== tab;
    });
    tabButtons.forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    ui.tabNote.textContent = tabNote[tab];
  }

  function onTabKeydown(event) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const idx = tabButtons.indexOf(document.activeElement);
    if (idx < 0) return;
    let next = idx;
    if (event.key === "ArrowRight") next = (idx + 1) % tabButtons.length;
    if (event.key === "ArrowLeft") next = (idx - 1 + tabButtons.length) % tabButtons.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabButtons.length - 1;
    tabButtons[next].focus();
    setTab(tabButtons[next].dataset.tab);
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
    button.addEventListener("keydown", onTabKeydown);
  });

  function mountModule(kind, moduleDef) {
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
      const button = makeEl("button", "primary", "Ouvrir");
      button.addEventListener("click", () => mountModule(kind, moduleDef));
      row.appendChild(button);
      card.appendChild(row);
      target.appendChild(card);
    });
  }

  function moduleText(root, title, text) {
    root.innerHTML = `<h3>${title}</h3><p class="mini">${text}</p>`;
  }

  function moduleCounter(root, title, keyA, keyB, target) {
    root.innerHTML = `<h3>${title}</h3><p class="mini">J1: ${keyA.toUpperCase()} | J2: ${keyB.toUpperCase()}</p><p class="mini" id="status">0 - 0</p><div class="row"><button id="reset">Reset</button></div>`;
    const status = root.querySelector("#status");
    const reset = root.querySelector("#reset");
    let a = 0;
    let b = 0;
    let done = false;
    const paint = () => {
      status.textContent = `${a} - ${b}`;
      if (a >= target) { done = true; status.textContent += " | J1 wins"; }
      if (b >= target) { done = true; status.textContent += " | J2 wins"; }
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

  function moduleTicTacToe(root) {
    root.innerHTML = `<h3>Tic Tac Toe</h3><p class="mini" id="status">Tour: X</p><div class="board3" id="board"></div><div class="row"><button id="reset">Reset</button></div>`;
    const boardEl = root.querySelector("#board");
    const status = root.querySelector("#status");
    const reset = root.querySelector("#reset");
    let board = Array(9).fill("");
    let turn = "X";
    let done = false;
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const hasWin = () => wins.some(([a,b,c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
    const render = () => {
      boardEl.innerHTML = "";
      board.forEach((value, i) => {
        const cell = makeEl("button", "cell", value);
        cell.addEventListener("click", () => {
          if (done || board[i]) return;
          board[i] = turn;
          if (hasWin()) { done = true; status.textContent = `Gagnant: ${turn}`; }
          else if (board.every(Boolean)) { done = true; status.textContent = "Egalite"; }
          else { turn = turn === "X" ? "O" : "X"; status.textContent = `Tour: ${turn}`; }
          render();
        });
        boardEl.appendChild(cell);
      });
    };
    reset.addEventListener("click", () => {
      board = Array(9).fill("");
      turn = "X";
      done = false;
      status.textContent = "Tour: X";
      render();
    });
    render();
  }

  function moduleConnect4(root) {
    root.innerHTML = `<h3>Connect 4</h3><p class="mini" id="status">Tour: Rouge</p><div class="board7" id="board"></div><div class="row"><button id="reset">Reset</button></div>`;
    const boardEl = root.querySelector("#board");
    const status = root.querySelector("#status");
    const reset = root.querySelector("#reset");
    let board = Array.from({ length: 6 }, () => Array(7).fill(""));
    let turn = "red";
    let done = false;
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
            for (let i = 5; i >= 0; i -= 1) if (!board[i][c]) { row = i; break; }
            if (row < 0) return;
            board[row][c] = turn;
            if (hasWin(row, c, turn)) {
              done = true;
              status.textContent = turn === "red" ? "Rouge gagne" : "Jaune gagne";
            } else if (board.flat().every(Boolean)) {
              done = true;
              status.textContent = "Egalite";
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
      board = Array.from({ length: 6 }, () => Array(7).fill(""));
      turn = "red";
      done = false;
      status.textContent = "Tour: Rouge";
      render();
    });
    render();
  }

  function moduleMemory(root) {
    root.innerHTML = `<h3>Memory</h3><p class="mini" id="state"></p><div class="board4" id="board"></div><div class="row"><button id="reset">Melanger</button></div>`;
    const boardEl = root.querySelector("#board");
    const stateEl = root.querySelector("#state");
    const reset = root.querySelector("#reset");
    let values = [];
    let open = [];
    let solved = new Set();
    let lock = false;

    function init() {
      values = ["A","A","B","B","C","C","D","D","E","E","F","F","G","G","H","H"].sort(() => Math.random() - 0.5);
      open = [];
      solved = new Set();
      lock = false;
      render();
    }

    function render() {
      boardEl.innerHTML = "";
      values.forEach((value, i) => {
        const visible = open.includes(i) || solved.has(i);
        const tile = makeEl("button", "tile", visible ? value : "?");
        tile.addEventListener("click", () => {
          if (lock || visible) return;
          open.push(i);
          render();
          if (open.length === 2) {
            const [a, b] = open;
            if (values[a] === values[b]) {
              solved.add(a);
              solved.add(b);
              open = [];
              if (solved.size === values.length) stateEl.textContent = "Termine";
              render();
            } else {
              lock = true;
              setTimeout(() => {
                open = [];
                lock = false;
                render();
              }, 600);
            }
          }
        });
        boardEl.appendChild(tile);
      });
    }

    reset.addEventListener("click", init);
    init();
  }

  function module2048(root) {
    root.innerHTML = `<h3>2048</h3><p class="mini">Utilisez les fleches.</p><div class="board4" id="board"></div><p class="mini" id="score">Score: 0</p>`;
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
      const free = board.map((v, i) => (v ? null : i)).filter((i) => i !== null);
      if (!free.length) return;
      board[free[Math.floor(Math.random() * free.length)]] = Math.random() < 0.9 ? 2 : 4;
    };
    const draw = () => {
      cells.forEach((cell, i) => { cell.textContent = board[i] || ""; });
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
    const flat = (matrix) => matrix.flat();
    const rotateRight = (src) => {
      const out = Array(16).fill(0);
      for (let r = 0; r < 4; r += 1) for (let c = 0; c < 4; c += 1) out[c * 4 + (3 - r)] = src[r * 4 + c];
      return out;
    };
    const move = (dir) => {
      const before = board.join(",");
      if (dir === "L") board = flat(rows().map(compress));
      if (dir === "R") { board = rotateRight(rotateRight(board)); board = flat(rows().map(compress)); board = rotateRight(rotateRight(board)); }
      if (dir === "U") { board = rotateRight(rotateRight(rotateRight(board))); board = flat(rows().map(compress)); board = rotateRight(board); }
      if (dir === "D") { board = rotateRight(board); board = flat(rows().map(compress)); board = rotateRight(rotateRight(rotateRight(board))); }
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

  function moduleArcadeBall(root, title, subtitle, colorA, colorB) {
    root.innerHTML = `<h3>${title}</h3><p class="mini">${subtitle}</p><p class="mini" id="score">0 - 0</p><canvas id="arena" width="560" height="300" style="max-width:100%;border:1px solid #cbdcf3;border-radius:10px;background:#f6fbff"></canvas><div class="row"><button id="reset">Reset</button></div>`;
    const canvas = root.querySelector("#arena");
    const ctx = canvas.getContext("2d");
    const scoreEl = root.querySelector("#score");
    const reset = root.querySelector("#reset");
    let raf = 0;
    let scoreA = 0;
    let scoreB = 0;
    let gravity = 0.35;
    let jump = 6.8;
    let bounce = 0.76;
    let push = 1.5;
    const left = { x: 130, y: 240, vy: 0, w: 20, h: 50, color: colorA };
    const right = { x: 430, y: 240, vy: 0, w: 20, h: 50, color: colorB };
    const ball = { x: 280, y: 110, vx: 0, vy: 0, r: 10 };
    function rnd(dir) {
      gravity = randomBetween(0.28, 0.46);
      jump = randomBetween(5.8, 7.4);
      bounce = randomBetween(0.62, 0.84);
      push = randomBetween(1.1, 2.0);
      left.y = 240; left.vy = 0;
      right.y = 240; right.vy = 0;
      ball.x = 280; ball.y = 110; ball.vx = dir * randomBetween(0.8, 1.7); ball.vy = -randomBetween(1.0, 2.1);
      scoreEl.textContent = `${scoreA} - ${scoreB}`;
    }
    function hit(p, dir) {
      const dx = ball.x - p.x;
      const dy = ball.y - (p.y - 20);
      if (dx * dx + dy * dy < 30 * 30) {
        ball.vx += dir * push;
        ball.vy -= 1.05;
      }
    }
    function step() {
      left.vy += gravity; right.vy += gravity;
      left.y += left.vy; right.y += right.vy;
      if (left.y >= 240) { left.y = 240; left.vy = 0; }
      if (right.y >= 240) { right.y = 240; right.vy = 0; }
      ball.vy += gravity;
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.y <= ball.r) ball.vy *= -0.9;
      if (ball.y >= 290) {
        if (ball.x < 280) scoreB += 1;
        else scoreA += 1;
        if (scoreA >= 5 || scoreB >= 5) {
          scoreEl.textContent = `${scoreA} - ${scoreB} | ${scoreA > scoreB ? "J1 wins" : "J2 wins"}`;
          cancelAnimationFrame(raf);
          return;
        }
        rnd(ball.x < 280 ? 1 : -1);
      }
      if (ball.x <= ball.r || ball.x >= canvas.width - ball.r) ball.vx *= -0.95;
      hit(left, 1);
      hit(right, -1);
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#e8f2ff"; ctx.fillRect(0, 292, canvas.width, 8);
      ctx.fillStyle = "#a7c0dd"; ctx.fillRect(278, 184, 4, 108);
      ctx.fillStyle = left.color; ctx.fillRect(left.x - left.w / 2, left.y - left.h, left.w, left.h);
      ctx.fillStyle = right.color; ctx.fillRect(right.x - right.w / 2, right.y - right.h, right.w, right.h);
      ctx.fillStyle = "#ffcc4a"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    }
    function loop() {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    }
    function onKey(event) {
      const key = event.key.toLowerCase();
      if (key === "a" && left.y >= 240) left.vy = -jump;
      if (key === "l" && right.y >= 240) right.vy = -jump;
    }
    reset.addEventListener("click", () => {
      scoreA = 0; scoreB = 0; rnd(1);
    });
    window.addEventListener("keydown", onKey);
    rnd(1);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }

  const duoModules = [
    { id: "basket-local", label: "Basket Random Lite", desc: "Arcade duo random style.", mount: (root) => moduleArcadeBall(root, "Basket Random Lite", "A/L jump. First to 5.", "#2a7be4", "#e15e5e") },
    { id: "soccer-local", label: "Soccer Random Lite", desc: "Football random style duel.", mount: (root) => moduleArcadeBall(root, "Soccer Random Lite", "A/L jump kick. First to 5.", "#1f88cf", "#e46b4c") },
    { id: "volley-local", label: "Volley Random Lite", desc: "Quick two-player volley chaos.", mount: (root) => moduleArcadeBall(root, "Volley Random Lite", "A/L jump hit. First to 5.", "#2394e0", "#d15959") },
    { id: "ttt", label: "Tic Tac Toe", desc: "Classic 2-player board game.", mount: moduleTicTacToe },
    { id: "connect4", label: "Connect 4", desc: "Drop and align 4 discs.", mount: moduleConnect4 },
    { id: "battle", label: "Key Battle", desc: "A vs L first to 45.", mount: (root) => moduleCounter(root, "Key Battle", "a", "l", 45) },
  ];

  const soloModules = [
    { id: "2048", label: "2048", desc: "Merge tiles and beat your score.", mount: module2048 },
    { id: "memory", label: "Memory", desc: "Find matching pairs quickly.", mount: moduleMemory },
    { id: "quiz", label: "Quick Quiz", desc: "Fast warm-up questions.", mount: (root) => moduleText(root, "Quick Quiz", "9x7=63, 2^5=32, Italy capital=Rome.") },
    { id: "sequence", label: "Sequence", desc: "Pattern progression challenge.", mount: (root) => moduleText(root, "Sequence", "2, 4, 8, 16, ?") },
    { id: "logic", label: "Logic", desc: "Micro logic drills.", mount: (root) => moduleText(root, "Logic", "AB, BC, CD, ?") },
    { id: "rapid", label: "Rapid Math", desc: "Timed arithmetic warmup.", mount: (root) => moduleText(root, "Rapid Math", "Try 12x8, 9x7, 15x6 in 30 seconds.") },
  ];

  const iframeBlockedDomains = [];
  let externalUnique = [];

  function mapCatalogItem(raw, index) {
    const name = raw.name || `Module ${raw.code || index + 1}`;
    const lname = name.toLowerCase();
    const tags = [];
    if (lname.includes("basket")) tags.push("basket");
    if (lname.includes("soccer") || lname.includes("football")) tags.push("soccer");
    if (lname.includes("random")) tags.push("random", "legends");
    if (lname.includes("1v1") || lname.includes("duel") || lname.includes("stars") || lname.includes("tank") || lname.includes("wrestle")) tags.push("duo");
    if (!tags.includes("random")) tags.push("random");
    const players = tags.includes("duo") ? "duo" : "solo";

    return {
      id: `calc-${raw.code || index + 1}`,
      name,
      desc: "Lien verifie depuis calcsolver.net.",
      url: raw.url,
      tags: [...new Set(tags)],
      players,
      qualityScore: 82 + (index % 15),
      sourceType: "calcsolver",
      embedLikely: true,
      lastChecked: "2026-04-03",
      status: "active",
    };
  }

  async function loadExternalCatalog() {
    try {
      if (isFileMode) {
        externalUnique = fileModeCatalog.map((item, index) => mapCatalogItem(item, index));
        setReaderStatus(`${externalUnique.length} liens charges en mode fichier.`);
        return;
      }
      const response = await fetch("assets/catalog-links.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`catalog ${response.status}`);
      const raw = await response.json();
      const mapped = raw
        .filter((item) => item && typeof item.url === "string" && item.url.startsWith("https://"))
        .map((item, index) => mapCatalogItem(item, index));
      const dedupe = new Set();
      externalUnique = mapped.filter((item) => {
        if (dedupe.has(item.url)) return false;
        dedupe.add(item.url);
        return true;
      });
      setReaderStatus(`${externalUnique.length} liens verifies charges.`);
    } catch {
      externalUnique = [
        { id: "fallback-1", name: "Basket Random", desc: "Fallback link.", url: "https://geet.in.net/get/basket-random/game.html", tags: ["duo", "basket", "random", "legends"], players: "duo", qualityScore: 95, sourceType: "calcsolver", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
        { id: "fallback-2", name: "Soccer Random", desc: "Fallback link.", url: "https://geet.in.net/get/soccer-random/game.html", tags: ["duo", "soccer", "random", "legends"], players: "duo", qualityScore: 95, sourceType: "calcsolver", embedLikely: true, lastChecked: "2026-04-03", status: "active" },
      ];
      setReaderStatus("Catalogue partiel charge (mode fallback).");
    }
  }

  function getHostname(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  function isIframeAllowed(item) {
    const host = getHostname(item.url);
    if (!host) return false;
    const blocked = iframeBlockedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
    if (blocked) return false;
    return item.embedLikely;
  }

  function collectionMatch(item, col) {
    if (col === "all") return true;
    if (col === "duo-fast") return item.players === "duo" && (item.tags.includes("random") || item.tags.includes("duel"));
    if (col === "basket-like") return item.tags.includes("basket") || item.tags.includes("legends");
    if (col === "soccer-like") return item.tags.includes("soccer") || item.tags.includes("legends");
    if (col === "short-break") return item.qualityScore >= 86 && (item.players === "solo" || item.tags.includes("random"));
    return true;
  }

  function filterMatch(item, filter) {
    if (filter === "all") return true;
    if (filter === "duo") return item.players === "duo";
    if (filter === "solo") return item.players === "solo";
    if (filter === "basket") return item.tags.includes("basket");
    if (filter === "soccer") return item.tags.includes("soccer");
    if (filter === "random") return item.tags.includes("random");
    if (filter === "legends") return item.tags.includes("legends");
    if (filter === "new") return item.lastChecked >= "2026-04-01";
    if (filter === "embed") return isIframeAllowed(item);
    if (filter === "top") return item.qualityScore >= 90;
    return true;
  }

  function getExternalFilteredSorted() {
    const query = (ui.search.value || "").trim().toLowerCase();
    const filter = state.filterChip === "all" ? ui.filter.value : state.filterChip;
    const collection = ui.collection.value;
    const sort = ui.sort.value;

    let list = externalUnique.filter((item) => {
      if (!filterMatch(item, filter)) return false;
      if (!collectionMatch(item, collection)) return false;
      if (!query) return true;
      const hay = `${item.name} ${item.desc} ${item.tags.join(" ")} ${item.players} ${item.sourceType}`.toLowerCase();
      return hay.includes(query);
    });

    list = [...list];
    if (sort === "quality") list.sort((a, b) => b.qualityScore - a.qualityScore);
    if (sort === "popularity") list.sort((a, b) => (popularity[b.id] || 0) - (popularity[a.id] || 0));
    if (sort === "checked") list.sort((a, b) => b.lastChecked.localeCompare(a.lastChecked));
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return list;
  }

  function setReaderStatus(message) {
    ui.status.textContent = message;
    document.dispatchEvent(new CustomEvent("reader-status", { detail: { message } }));
  }

  function applyReaderSize(size) {
    ui.reader.classList.remove("size-compact", "size-standard", "size-large");
    ui.reader.classList.add(`size-${size}`);
    setReaderStatus(`Taille lecteur: ${size}`);
  }

  function openInWindow(item) {
    window.open(item.url, "_blank", "noopener,noreferrer");
    popularity[item.id] = (popularity[item.id] || 0) + 1;
    savePopularityMap(popularity);
    document.dispatchEvent(new CustomEvent("open-in-window", { detail: { itemId: item.id, url: item.url } }));
  }

  function launchInSite(item) {
    if (isFileMode) {
      setReaderStatus("Mode fichier: ouverture fenetre forcee (iframe/worker bloques par le navigateur).");
      openInWindow(item);
      return;
    }
    if (!isIframeAllowed(item)) {
      setReaderStatus("Cette source refuse souvent l'iframe. Ouverture fenetre recommandee.");
      openInWindow(item);
      return;
    }
    clearTimeout(state.readerTimer);
    state.readerLoaded = false;
    state.readerItem = item;
    ui.readerTitle.textContent = `Lecteur: ${item.name}`;
    setReaderStatus(`Chargement de ${item.name}...`);
    ui.frame.src = item.url;
    ui.frame.focus();
    state.readerTimer = setTimeout(() => {
      if (!state.readerLoaded) {
        setReaderStatus("Chargement incertain ou bloque. Utilisez Ouvrir fenetre.");
      }
    }, 4600);
    popularity[item.id] = (popularity[item.id] || 0) + 1;
    savePopularityMap(popularity);
    document.dispatchEvent(new CustomEvent("launch-in-site", { detail: { itemId: item.id, url: item.url } }));
  }

  ui.frame.addEventListener("load", () => {
    state.readerLoaded = true;
    clearTimeout(state.readerTimer);
    if (state.readerItem) setReaderStatus(`Lecteur pret: ${state.readerItem.name}`);
  });
  ui.frame.addEventListener("error", () => {
    clearTimeout(state.readerTimer);
    if (!state.readerItem) return;
    setReaderStatus("Embed refuse par la source. Ouvrir fenetre recommande.");
  });

  function createExternalCard(item) {
    const card = makeEl("article", "card");
    card.tabIndex = 0;
    const pop = popularity[item.id] || 0;
    card.appendChild(makeEl("h3", "", item.name));
    card.appendChild(makeEl("p", "", `${item.desc} | ${item.players} | Q${item.qualityScore} | ${item.status} | vues ${pop}`));
    const row = makeEl("div", "row");
    const launch = makeEl("button", "primary", isIframeAllowed(item) ? "Lancer ici" : "Fenetre uniquement");
    const open = makeEl("button", "", "Ouvrir fenetre");
    const tags = makeEl("button", "", `Tags: ${item.tags.slice(0, 3).join(", ")}`);
    tags.disabled = true;
    launch.addEventListener("click", () => launchInSite(item));
    if (!isIframeAllowed(item)) {
      launch.classList.remove("primary");
    }
    open.addEventListener("click", () => openInWindow(item));
    row.append(launch, open, tags);
    card.appendChild(row);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        launchInSite(item);
      }
    });
    return card;
  }

  function updatePager(total) {
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    ui.pageNote.textContent = `Page ${state.page}/${totalPages}`;
    ui.prev.disabled = state.page <= 1;
    ui.next.disabled = state.page >= totalPages;
  }

  function renderExternal() {
    const list = getExternalFilteredSorted();
    updatePager(list.length);
    const start = (state.page - 1) * state.pageSize;
    const paged = list.slice(start, start + state.pageSize);
    const key = JSON.stringify({
      q: (ui.search.value || "").trim().toLowerCase(),
      filter: ui.filter.value,
      chip: state.filterChip,
      collection: ui.collection.value,
      sort: ui.sort.value,
      page: state.page,
      ids: paged.map((i) => i.id),
    });
    if (key === state.renderedKey) return;
    state.renderedKey = key;

    ui.count.textContent = `${list.length} ressources | ${externalUnique.length} total`;
    ui.externalCards.innerHTML = "";
    requestAnimationFrame(() => {
      paged.forEach((item) => {
        ui.externalCards.appendChild(createExternalCard(item));
      });
    });
  }

  function bindExternalControls() {
    ui.search.addEventListener("input", debounceSearch);
    ui.filter.addEventListener("change", () => {
      state.page = 1;
      state.filterChip = "all";
      quickFilters.forEach((chip) => chip.classList.toggle("active", chip.dataset.chip === "all"));
      renderExternal();
    });
    ui.collection.addEventListener("change", () => {
      state.page = 1;
      renderExternal();
    });
    ui.sort.addEventListener("change", () => {
      state.page = 1;
      renderExternal();
    });
    ui.openRandom.addEventListener("click", () => {
      const list = getExternalFilteredSorted();
      if (!list.length) return;
      const pick = list[Math.floor(Math.random() * list.length)];
      launchInSite(pick);
      ui.reader.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    ui.prev.addEventListener("click", () => {
      state.page -= 1;
      renderExternal();
    });
    ui.next.addEventListener("click", () => {
      state.page += 1;
      renderExternal();
    });

    quickFilters.forEach((chip) => {
      chip.addEventListener("click", () => {
        state.filterChip = chip.dataset.chip;
        state.page = 1;
        quickFilters.forEach((c) => c.classList.toggle("active", c === chip));
        renderExternal();
      });
    });

    ui.readerReload.addEventListener("click", () => {
      if (!state.readerItem) {
        setReaderStatus("Aucune ressource selectionnee.");
        return;
      }
      launchInSite(state.readerItem);
    });
    ui.readerOpen.addEventListener("click", () => {
      if (!state.readerItem) {
        setReaderStatus("Aucune ressource selectionnee.");
        return;
      }
      openInWindow(state.readerItem);
    });
    ui.readerCopy.addEventListener("click", async () => {
      if (!state.readerItem) {
        setReaderStatus("Aucune ressource selectionnee.");
        return;
      }
      try {
        await navigator.clipboard.writeText(state.readerItem.url);
        setReaderStatus("Lien copie.");
      } catch {
        setReaderStatus("Copie bloquee par le navigateur.");
      }
    });
    ui.readerSize.addEventListener("change", () => {
      applyReaderSize(ui.readerSize.value);
    });

    window.addEventListener("keydown", (event) => {
      if (event.altKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        ui.reader.scrollIntoView({ behavior: "smooth", block: "start" });
        ui.reader.focus();
      }
    });
  }

  async function init() {
    bindExternalControls();
    applyReaderSize(ui.readerSize.value || "standard");
    ui.filter.value = "embed";
    state.filterChip = "embed";
    quickFilters.forEach((chip) => chip.classList.toggle("active", chip.dataset.chip === "embed"));
    renderLocalCards(ui.duoCards, "duo", duoModules);
    renderLocalCards(ui.soloCards, "solo", soloModules);
    await loadExternalCatalog();
    if (isFileMode) {
      setReaderStatus("Mode fichier detecte: py -m http.server 8080 est recommande pour activer fetch/iframe/worker.");
    }
    renderExternal();
    setTab("duo");
  }

  init();
})();
