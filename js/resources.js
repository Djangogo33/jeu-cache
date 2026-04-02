(() => {
  const tabs = [...document.querySelectorAll(".tab")];
  const panes = {
    duo: document.getElementById("duo-pane"),
    solo: document.getElementById("solo-pane"),
    external: document.getElementById("external-pane"),
  };
  const note = document.getElementById("tab-note");
  const duoCards = document.getElementById("duo-cards");
  const soloCards = document.getElementById("solo-cards");
  const duoMount = document.getElementById("duo-mount");
  const soloMount = document.getElementById("solo-mount");
  const extCards = document.getElementById("external-cards");
  const frame = document.getElementById("external-frame");
  const frameNote = document.getElementById("frame-note");

  const state = { duoCleanup: null, soloCleanup: null };
  const setTab = (t) => {
    Object.entries(panes).forEach(([k, v]) => (v.hidden = k !== t));
    tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === t));
    note.textContent = t === "duo" ? "6 ateliers duo locaux" : t === "solo" ? "6 ateliers solo locaux" : "8 ressources externes";
  };
  tabs.forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));

  const h = (tag, txt, cls) => {
    const e = document.createElement(tag);
    if (txt) e.textContent = txt;
    if (cls) e.className = cls;
    return e;
  };
  const mountModule = (kind, mod) => {
    const mount = kind === "duo" ? duoMount : soloMount;
    const key = kind === "duo" ? "duoCleanup" : "soloCleanup";
    if (typeof state[key] === "function") state[key]();
    mount.innerHTML = "";
    state[key] = mod.mount(mount) || null;
  };
  const renderCards = (el, kind, mods) => {
    el.innerHTML = "";
    mods.forEach((m) => {
      const card = h("article", "", "card");
      card.appendChild(h("h3", m.label));
      card.appendChild(h("p", m.desc));
      const row = h("div", "", "row");
      const btn = h("button", "Ouvrir atelier");
      btn.addEventListener("click", () => mountModule(kind, m));
      row.appendChild(btn);
      card.appendChild(row);
      el.appendChild(card);
    });
  };

  function mTicTacToe(root) {
    root.innerHTML = "<h3>Morpion 2 joueurs</h3><p class='mini' id='s'>Tour: X</p><div class='board3' id='b'></div><div class='row'><button id='r'>Reset</button></div>";
    const s = root.querySelector("#s"), b = root.querySelector("#b"), r = root.querySelector("#r");
    let p = "X", done = false, board = Array(9).fill("");
    const w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const win = () => w.find(([a,c,d]) => board[a] && board[a]===board[c] && board[a]===board[d]) ? true : false;
    const draw = () => {
      b.innerHTML = "";
      board.forEach((v,i) => { const c = h("button", v, "cell"); c.onclick = () => {
        if (done || board[i]) return; board[i] = p;
        if (win()) { s.textContent = `Gagnant: ${p}`; done = true; }
        else if (board.every(Boolean)) { s.textContent = "Match nul"; done = true; }
        else { p = p === "X" ? "O" : "X"; s.textContent = `Tour: ${p}`; }
        draw();
      }; b.appendChild(c); });
    };
    r.onclick = () => { p = "X"; done = false; board = Array(9).fill(""); s.textContent = "Tour: X"; draw(); };
    draw();
  }

  function mConnect4(root) {
    root.innerHTML = "<h3>Puissance 4</h3><p class='mini' id='s'>Tour: Rouge</p><div class='board7' id='b'></div><div class='row'><button id='r'>Reset</button></div>";
    const s = root.querySelector("#s"), b = root.querySelector("#b"), r = root.querySelector("#r");
    let t = "red", done = false, g = Array.from({length:6},()=>Array(7).fill(""));
    const inr = (x,y)=>x>=0&&x<6&&y>=0&&y<7;
    const cnt=(x,y,dx,dy,c)=>{let n=0; x+=dx; y+=dy; while(inr(x,y)&&g[x][y]===c){n++;x+=dx;y+=dy;} return n;};
    const win=(x,y,c)=>[[1,0],[0,1],[1,1],[1,-1]].some(([dx,dy])=>1+cnt(x,y,dx,dy,c)+cnt(x,y,-dx,-dy,c)>=4);
    const draw = () => {
      b.innerHTML = "";
      for(let i=0;i<6;i++) for(let j=0;j<7;j++){ const d=h("button","","disc"); if(g[i][j]) d.classList.add(g[i][j]); d.onclick=()=>{
        if(done) return; let row=-1; for(let k=5;k>=0;k--) if(!g[k][j]){row=k; break;} if(row<0) return; g[row][j]=t;
        if(win(row,j,t)){done=true; s.textContent=t==="red"?"Rouge gagne":"Jaune gagne";}
        else if(g.flat().every(Boolean)){done=true; s.textContent="Match nul";}
        else {t=t==="red"?"yellow":"red"; s.textContent=t==="red"?"Tour: Rouge":"Tour: Jaune";}
        draw();
      }; b.appendChild(d); }
    };
    r.onclick = ()=>{t="red";done=false;g=Array.from({length:6},()=>Array(7).fill(""));s.textContent="Tour: Rouge";draw();};
    draw();
  }

  function mCounterDuel(root, title, keyA, keyB, target=25) {
    root.innerHTML = `<h3>${title}</h3><p class='mini'>J1: ${keyA.toUpperCase()} | J2: ${keyB.toUpperCase()}</p><p id='s' class='mini'>0 - 0</p><div class='row'><button id='r'>Reset</button></div>`;
    const s = root.querySelector("#s"), r = root.querySelector("#r");
    let a=0,b=0,done=false;
    const update=()=>{s.textContent=`${a} - ${b}`; if(a>=target){done=true;s.textContent+=" | J1 gagne";} if(b>=target){done=true;s.textContent+=" | J2 gagne";}};
    const onKey=(e)=>{if(done)return; const k=e.key.toLowerCase(); if(k===keyA)a++; if(k===keyB)b++; update();};
    window.addEventListener("keydown",onKey);
    r.onclick=()=>{a=0;b=0;done=false;update();};
    update();
    return ()=>window.removeEventListener("keydown",onKey);
  }

  function mReflex(root) {
    root.innerHTML = "<h3>Duel reflexe</h3><p class='mini'>A pour J1, K pour J2 quand GO.</p><p id='go' class='mini'>Preparez-vous...</p><p id='s' class='mini'>0 - 0</p><div class='row'><button id='n'>Nouvelle manche</button></div>";
    const go=root.querySelector("#go"), s=root.querySelector("#s"), n=root.querySelector("#n");
    let armed=false,t=0,a=0,b=0;
    const round=()=>{armed=false;go.textContent="Preparez-vous...";clearTimeout(t);t=setTimeout(()=>{armed=true;go.textContent="GO";},1000+Math.random()*2000);};
    const on=(e)=>{const k=e.key.toLowerCase(); if(k!=="a"&&k!=="k")return; if(!armed){go.textContent=(k==="a"?"J1":"J2")+" trop tot"; return;} armed=false; if(k==="a")a++; else b++; s.textContent=`${a} - ${b}`;};
    window.addEventListener("keydown",on); n.onclick=round; round();
    return ()=>{window.removeEventListener("keydown",on); clearTimeout(t);};
  }

  function mSimpleBoard(root, title, bodyHtml) {
    root.innerHTML = `<h3>${title}</h3>${bodyHtml}`;
  }

  function mMemory(root) {
    root.innerHTML = "<h3>Memory</h3><p class='mini' id='s'></p><div class='board4' id='b'></div><div class='row'><button id='r'>Melanger</button></div>";
    const s=root.querySelector("#s"), b=root.querySelector("#b"), r=root.querySelector("#r");
    let arr=[], open=[], ok=new Set(), lock=false;
    const init=()=>{arr=["A","A","B","B","C","C","D","D","E","E","F","F","G","G","H","H"].sort(()=>Math.random()-0.5);open=[];ok.clear();lock=false;draw();};
    const draw=()=>{b.innerHTML="";arr.forEach((v,i)=>{const c=h("button",(open.includes(i)||ok.has(i))?v:"?","tile"); c.onclick=()=>{if(lock||open.includes(i)||ok.has(i))return;open.push(i);draw();if(open.length===2){const [x,y]=open;if(arr[x]===arr[y]){ok.add(x);ok.add(y);open=[];if(ok.size===16)s.textContent="Termine";draw();}else{lock=true;setTimeout(()=>{open=[];lock=false;draw();},600);}}};b.appendChild(c);});};
    r.onclick=init; init();
  }

  function m2048(root) {
    root.innerHTML = "<h3>2048</h3><p class='mini'>Version mini: additionne les valeurs avec les fleches.</p><div class='board4' id='b'></div><p class='mini' id='s'>Score: 0</p>";
    const b=root.querySelector("#b"), s=root.querySelector("#s");
    let g=Array(16).fill(0), score=0; const cells=[];
    for(let i=0;i<16;i++){const c=h("div","","tile"); cells.push(c); b.appendChild(c);}
    const add=()=>{const e=g.map((v,i)=>v?null:i).filter(v=>v!==null); if(!e.length)return; g[e[Math.floor(Math.random()*e.length)]]=Math.random()<.9?2:4;};
    const render=()=>{cells.forEach((c,i)=>c.textContent=g[i]||""); s.textContent=`Score: ${score}`;};
    const compress=(line)=>{line=line.filter(Boolean); for(let i=0;i<line.length-1;i++) if(line[i]===line[i+1]){line[i]*=2;score+=line[i];line[i+1]=0;} return line.filter(Boolean).concat([0,0,0,0]).slice(0,4);};
    const rows=()=>[g.slice(0,4),g.slice(4,8),g.slice(8,12),g.slice(12,16)];
    const flat=(r)=>r.flat();
    const rot=(src)=>{const d=Array(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++)d[c*4+(3-r)]=src[r*4+c];return d;};
    const move=(dir)=>{const before=g.join(","); if(dir==="L")g=flat(rows().map(compress)); if(dir==="R"){g=rot(rot(g));g=flat(rows().map(compress));g=rot(rot(g));}
      if(dir==="U"){g=rot(rot(rot(g)));g=flat(rows().map(compress));g=rot(g);} if(dir==="D"){g=rot(g);g=flat(rows().map(compress));g=rot(rot(rot(g)));}
      if(before!==g.join(","))add(); render();};
    const on=(e)=>{if(e.key==="ArrowLeft")move("L"); if(e.key==="ArrowRight")move("R"); if(e.key==="ArrowUp")move("U"); if(e.key==="ArrowDown")move("D");};
    add();add();render(); window.addEventListener("keydown",on); return ()=>window.removeEventListener("keydown",on);
  }

  const duo = [
    { id:"ttt", label:"Morpion 2 joueurs", desc:"Alternance X/O", mount:mTicTacToe },
    { id:"c4", label:"Puissance 4", desc:"Aligner 4 pions", mount:mConnect4 },
    { id:"pong", label:"Pong 2 joueurs", desc:"Atelier reaction", mount:(r)=>mSimpleBoard(r,"Pong 2 joueurs","<p class='mini'>Version legere: utilise Duel reflexe pour jouer a deux.</p>") },
    { id:"reflex", label:"Duel reflexe", desc:"A vs K au signal", mount:mReflex },
    { id:"battle", label:"Bataille de touches", desc:"A vs L en 8 sec", mount:(r)=>mCounterDuel(r,"Bataille de touches","a","l",40) },
    { id:"race", label:"Course clavier", desc:"Q vs P premier a 25", mount:(r)=>mCounterDuel(r,"Course clavier","q","p",25) }
  ];
  const solo = [
    { id:"snake", label:"Snake", desc:"Version compacte", mount:(r)=>mSimpleBoard(r,"Snake","<p class='mini'>Version compacte: utilise 2048 / Memory / Quiz.</p>") },
    { id:"2048", label:"2048", desc:"Fusion de tuiles", mount:m2048 },
    { id:"memory", label:"Memory", desc:"Trouver les paires", mount:mMemory },
    { id:"quiz", label:"Quiz rapide", desc:"5 questions", mount:(r)=>mSimpleBoard(r,"Quiz rapide","<p class='mini'>Question: 9x7 ? Reponse: 63.</p><p class='mini'>Question: Capitale Italie ? Reponse: Rome.</p><p class='mini'>Question: 2^5 ? Reponse: 32.</p>") },
    { id:"simon", label:"Simon sequence", desc:"Memoire visuelle", mount:(r)=>mSimpleBoard(r,"Simon sequence","<p class='mini'>Version compacte: sequence type A-B-C-D a reproduire oralement.</p>") },
    { id:"brick", label:"Casse-briques", desc:"Version compacte", mount:(r)=>mSimpleBoard(r,"Casse-briques","<p class='mini'>Version compacte: atelier en preparation.</p>") }
  ];
  const external = [
    {name:"Papergames",desc:"Mini ateliers multi",url:"https://papergames.io/fr/",category:"external"},
    {name:"Lichess",desc:"Echecs multijoueur",url:"https://lichess.org/",category:"external"},
    {name:"Codenames",desc:"Mots en equipe",url:"https://codenames.game/",category:"external"},
    {name:"Tetr.io",desc:"Puzzle versus",url:"https://tetr.io/",category:"external"},
    {name:"Skribbl",desc:"Dessins a plusieurs",url:"https://skribbl.io/",category:"external"},
    {name:"Chess.com Play",desc:"Parties rapides",url:"https://www.chess.com/play",category:"external"},
    {name:"GeoGuessr",desc:"Exploration geographique",url:"https://www.geoguessr.com/",category:"external"},
    {name:"Little Catalogue",desc:"Catalogue d'ateliers",url:"https://www.littlegames.com/",category:"external"}
  ];

  renderCards(duoCards, "duo", duo);
  renderCards(soloCards, "solo", solo);
  extCards.innerHTML = "";
  external.forEach((e) => {
    const card = h("article", "", "card");
    card.appendChild(h("h3", e.name));
    card.appendChild(h("p", e.desc));
    const row = h("div", "", "row");
    const load = h("button", "Charger");
    const open = h("button", "Ouvrir");
    load.onclick = () => {
      frame.src = e.url;
      frameNote.textContent = `Chargement: ${e.name}. Si vide, utilise Ouvrir.`;
      setTimeout(() => { frameNote.textContent = "Chargement limite possible: ouverture externe recommandee."; }, 4000);
    };
    open.onclick = () => window.open(e.url, "_blank", "noopener");
    row.append(load, open);
    card.appendChild(row);
    extCards.appendChild(card);
  });

  setTab("duo");
})();
