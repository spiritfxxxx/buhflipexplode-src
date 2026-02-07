/* ------------------------------------------------------------------------ MAIN PAGE ----------------------------------------------------------------------- */

/*let cntNoLeaks = 37, oldModeNum = 4, modeNum = 4, v2_4 = 37;
let leaksToggle = document.getElementById("lks");
let spoilersToggle = document.getElementById("spl");
let oldVersionNum = null, currVersion = null, versionNum = null, nodeNum = null;
let chartNodeNum = null, oldChartDisplayType = null, chartDisplayType = null, currNumberFormat = null;
let menuIsOpen = false, versionSelectorIsOpen = false, chartIsOpen = false;

let versionData = null, versionDazeMult = null, versionAnomMult = null, versionEnemies = null, enemyData = null, hpChart = null;

async function loadShiyuPage() {
  enemyData = await (await fetch("../assets/enemies.json")).json();
  // console.log(enemyData);
  // console.log(Object.keys(enemyData).length);
  
  let enemyIDs = Object.keys(enemyData);

  let t = document.querySelector("#test");
  t.innerHTML = "";

  for (let i = 0; i < enemyIDs.length; i++) { 
    let tt = document.createElement("div");
    tt.className = "tt";

    let text = document.createElement("div");
    text.innerHTML = `(${enemyIDs[i]})`;
    text.className = "id";
    tt.appendChild(text);

    let imgH = document.createElement("div");
    imgH.className = "e-hover";

    let img = document.createElement("img");
    img.className = "e-img";
    img.src = `../assets/enemies/${enemyData[enemyIDs[i]].image}.webp`;
    imgH.appendChild(img);

    let name = document.createElement("div");
    name.className = "e-name";
    name.innerHTML = (spoilersToggle.checked || enemyData[enemyIDs[i]].tags.includes("spoiler")) ? ("SPOILER " + (enemyIDs[i][2] == '3' ? "BOSS" : "ENEMY")) : enemyData[enemyIDs[i]].name;
    imgH.appendChild(name);

    tt.appendChild(imgH);

    let eElementMult = enemyData[enemyIDs[i]].elementMult;
    let enemyWR = document.createElement("div");
    enemyWR.className = "wr";
    generateWR(eElementMult, enemyWR);
    tt.appendChild(enemyWR);

    let hp = document.createElement("div");
    let hp1 = enemyIDs[i][2] != '3' ? enemyData[enemyIDs[i]].baseHP[0] : enemyData[enemyIDs[i]].baseHP;
    let hp2 = enemyIDs[i][2] != '3' ? enemyData[enemyIDs[i]].baseHP[1] : enemyData[enemyIDs[i]].baseHP;
    hp.className = "e-hp";
    hp.innerHTML = hp1 + " / " + hp2;
    tt.appendChild(hp);

    let def = document.createElement("div");
    def.innerHTML = enemyData[enemyIDs[i]].baseDef;
    def.className = "e-def";
    tt.appendChild(def);

    let ttMiscStat = document.createElement("div");
    ttMiscStat.className = "tt-e-stat";
    let d1 = enemyIDs[i][2] != '3' ? enemyData[enemyIDs[i]].baseDaze[0] : enemyData[enemyIDs[i]].baseDaze;
    let d2 = enemyIDs[i][2] != '3' ? enemyData[enemyIDs[i]].baseDaze[1] : enemyData[enemyIDs[i]].baseDaze;
    ttMiscStat.innerHTML = `+<span class="tt-text">${generateEnemyStats(d1, d2, enemyData[enemyIDs[i]].stunMult, enemyData[enemyIDs[i]].stunTime, enemyData[enemyIDs[i]].baseAnom, eElementMult, enemyData[enemyIDs[i]].mods)}</span>`;
    tt.appendChild(ttMiscStat);

    t.appendChild(tt);
  }
}

let elementsData = ["ice", "fire", "electric", "ether", "physical"];

function generateWR(mult, wr) {
  let weakImg1 = document.createElement("img");
  let weakImg2 = document.createElement("img");
  let resImg1 = document.createElement("img");
  let resImg2 = document.createElement("img");
  weakImg1.className = "wk";
  weakImg2.className = "wk";
  resImg1.className = "res";
  resImg2.className = "res";
  weakImg1.src = "../assets/elements/none.webp";
  weakImg2.src = "../assets/elements/none.webp";
  resImg1.src = "../assets/elements/none.webp";
  resImg2.src = "../assets/elements/none.webp";
  let wkCnt = 0, resCnt = 0;
  for (let i = 0; i < 5; ++i) {
    if (mult[i] < 1 && wkCnt == 0) { weakImg1.src = `../assets/elements/${elementsData[i]}.webp`; ++wkCnt;}
    else if (mult[i] < 1 && wkCnt == 1) weakImg2.src = `../assets/elements/${elementsData[i]}.webp`;
    else if (mult[i] > 1 && resCnt == 0) { resImg1.src = `../assets/elements/${elementsData[i]}.webp`; ++resCnt; }
    else if (mult[i] > 1 && resCnt == 1) resImg2.src = `../assets/elements/${elementsData[i]}.webp`;
  }
  wr.appendChild(weakImg1);
  wr.appendChild(weakImg2);
  wr.appendChild(resImg1);
  wr.appendChild(resImg2);
}

function alt(color, name, hpNew, hp) {
  return `<span style="color:${color};">✦</span><span class="tt-text">
    <span style="font-weight:bold;text-decoration:underline;">${name}</span><br>
    <span style="color:#f6b26b;font-weight:bold;">Alt HP</span>: <span style="color:${color};font-weight:bold;">${numberFormat(Math.ceil(hpNew))}</span><br>
    <span style="font-weight:bold;">(assume ${Math.round(hpNew / hp * 1000) / 10}% of HP)</span><br><br>`;
}
function hitch(hp) {
  return `<span style="color:#ffffff;">✦</span><span class="tt-text">
    <span style="font-weight:bold;text-decoration:underline;">Hitchspiker</span><br>
    True <span style="color:#ff5555;font-weight:bold;">Raw HP</span>: <span style="color:#ff5555;font-weight:bold;">${numberFormat(hp)}</span><br><br>
    technically doesn't<br>need to be killed</span>`;
}
function palicus() { return `hit both 50% of the time</span>`; }
function instant(color, type, cnt) { return `<span style="font-weight:bold;"><span style="color:${color};">${type}</span></span> ${cnt} time(s)</span>`; }

function generateEnemyStats(daze1, daze2, stun, time, anom, dmg, mods) {
  let anomMult = [1, 1, 1, 1, 1.2];
  let color = ["#98eff0", "#ff5521", "#2eb6ff", "#fe437e", "#f0d12b"];
  let stats = `<span style="font-weight:bold;">Max Daze: <span style="color:#ffe599;">${Math.round(daze1 * 10000) / 10000} / ${Math.round(daze2 * 10000) / 10000}</span></span><br>
    (<span style="color:#ffe599;font-weight:bold;">${stun}%</span> DMG for <span style="color:#ffe599;font-weight:bold;">${time}s</span>)<br><br>`;
  if (mods.includes("no-anom")) return stats + `<span style="font-weight:bold;">IMMUNE TO ANOMALY</span>`;
  else {
    stats += `<span style="font-weight:bold;">Max Anomaly Buildup:</span><br>`;
    for (let i = 0; i < 5; ++i) stats += `<span style="color:${color[i]};font-weight:bold;">${Math.round(anom * anomMult[i] * dmg[i] * 100) / 100}</span>/`;
    stats = stats.slice(0, -1) + `<br>${mods.includes("no-freeze") ? `<span style="color:#98eff0;font-weight:bold;">UNFREEZABLE</span>` : ``}`;
  }
  return stats;
}

function toggleMenu() {
  let menuBar = document.getElementById("mb");
  let menuBarOverlay = document.getElementById("mb-o");
  let fixedMenuButton = document.getElementById("open-mb-btn");
  if (menuIsOpen) {
    document.body.classList.remove("no-scroll");
    menuBar.style.display = "none";
    menuBarOverlay.style.display = "none";
    fixedMenuButton.style.display = "none";
  }
  else {
    document.body.classList.add("no-scroll");
    menuBar.style.display = "block";
    menuBarOverlay.style.display = "block";
    fixedMenuButton.style.display = "block";
  }
  menuIsOpen = !menuIsOpen;
}

function updateNumberFormat(e) {
  if (e) currNumberFormat = e.dataset.format;
  let ex = document.getElementById("ex-num");
  let numFormatButtons = document.querySelectorAll(".nfb");
  ex.innerHTML = numberFormat(2222222);
  numFormatButtons.forEach(btn => btn.classList.toggle("selected", btn.dataset.format == currNumberFormat));
  showNode();
  displayHPChart();
}
function numberFormat(num) {
  if (currNumberFormat == "comma") return num.toLocaleString("en-US");
  if (currNumberFormat == "period") return num.toLocaleString("de-DE");
  return num;
}

document.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.key == "Escape") { e.preventDefault(); chartIsOpen ? toggleChart() : (versionSelectorIsOpen ? toggleVersionSelector() : toggleMenu()); }
  else if (e.key == " " && !menuIsOpen && !chartIsOpen) { e.preventDefault(); toggleVersionSelector(); }
  else if (e.key == "Backspace" && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); toggleChart(); }
  else if (e.key == "ArrowLeft" && !menuIsOpen && !chartIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeVersion(-1); }
  else if (e.key == "ArrowRight" && !menuIsOpen && !chartIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeVersion(1); }
  else if (e.key == "ArrowUp") { e.preventDefault(); !menuIsOpen && !chartIsOpen && !versionSelectorIsOpen ? changeNode(1) : changeChartNode(1) }
  else if (e.key == "ArrowDown") { e.preventDefault(); !menuIsOpen && !chartIsOpen && !versionSelectorIsOpen ? changeNode(-1) : changeChartNode(-1) }
  return;
});

leaksToggle.addEventListener("change", () => {
  if (!leaksToggle.checked) {
    spoilersToggle.checked = false;
    if (versionNum > cntNoLeaks) versionNum = cntNoLeaks;
  }
  showVersion();
});
spoilersToggle.addEventListener("change", () => {
  if (spoilersToggle.checked) leaksToggle.checked = true;
  showEnemies();
});*/

/* ------------------------------------------------------------------------ MAIN PAGE ----------------------------------------------------------------------- */

let leaksToggle = document.getElementById("lks");
let spoilersToggle = document.getElementById("spl");
let currNumberFormat = null, menuIsOpen = false;

let enemyData = null;
let elementsData = ["ice", "fire", "electric", "ether", "physical"];

/* load main page data from .json files, and display */
async function loadShiyuPage() {
  enemyData = await (await fetch("../assets/enemies.json")).json();
  loadSavedState();
  updateNumberFormat();
  showEnemies();
}

/* place and display elements/enemies/weaknesses/resistances/HP/count on screen */
function showEnemies() {
  let enemyIDs = Object.keys(enemyData);
  let waveEnemies = document.querySelector("#e-list");
  waveEnemies.innerHTML = ``;


  let oldEName = "";


  for (let e = 0; e < enemyIDs.length; ++e) {
    let currEnemyID = enemyIDs[e];
    let currEnemyData = enemyData[currEnemyID];

    /* define current enemy's parameters */
    let eTags = currEnemyData.tags;
    let eMods = currEnemyData.mods;
    let showEnemySpoilers = spoilersToggle.checked || !eTags.includes("spoiler");
    let eName = showEnemySpoilers ? currEnemyData.name : "SPOILER ENEMY";
    let eImg = showEnemySpoilers ? `../assets/enemies/${currEnemyData.image}.webp` : `../assets/enemies/doppelganger-i.webp`;

    /* define current enemy's various stats */
    let eHP1 = currEnemyData.baseHP[0];
    let eHP2 = currEnemyData.baseHP[1];
    let eDef = currEnemyData.baseDef;
    let eDaze1 = currEnemyData.baseDaze[0];
    let eDaze2 = currEnemyData.baseDaze[1];
    let eStunMult = currEnemyData.stunMult;
    let eStunTime = currEnemyData.stunTime;
    let eAnom = currEnemyData.baseAnom;
    let eElementMult = currEnemyData.elementMult;



    if (eName <= oldEName) console.log(oldEName, eName);


    /* add enemy display */
    let enemy = document.createElement("div");
    enemy.className = "e";
    
    /* add enemy id display */
    let enemyID = document.createElement("div");
    enemyID.className = "e-id";
    enemyID.innerHTML = currEnemyID;
    enemy.appendChild(enemyID);
    
    let enemyImg = document.createElement("img");
    let enemyName = document.createElement("div");
    let enemyHover = document.createElement("div");
    enemyImg.className = "e-img";
    enemyName.className = "e-name";
    enemyHover.className = "e-hover";
    enemyImg.src = eImg;
    enemyHover.appendChild(enemyImg);
    enemyName.innerHTML = eName;
    enemyHover.appendChild(enemyName);
    enemy.appendChild(enemyHover);

    let enemyWR = document.createElement("div");
    enemyWR.className = "wr";
    generateWR(eElementMult, enemyWR);
    enemy.appendChild(enemyWR);

    /* add enemy hp display */
    let enemyHP = document.createElement("div");
    enemyHP.className = "e-hp";
    enemyHP.innerHTML = `${eHP1} / ${eHP2}`;
    /* add special enemy tooltip (if necessary) */
    if (eTags.length >= 1 && !(eTags.length == 1 && eTags.includes("spoiler"))) {
      let ttHP = document.createElement("div");
      ttHP.className = "tt-e-hp";
      if (eTags.includes("hitch")) {
        ttHP.innerHTML = hitch(eHP1, eHP2);
        enemyHP.innerHTML = numberFormat(1);
      }
      else {
        let eHPNew1 = eHP1, eHPNew2 = eHP2;
        let color = "#ffffff";

        if (eTags.includes("palicus")) {
          eHPNew1 -= eHP1 * 0.25;
          eHPNew2 -= eHP2 * 0.25;
          color = "#93c47d";
          ttHP.innerHTML += palicus(eHPNew1) + `<br>`;
        }
        if (eTags.includes("robot")) {
          eHPNew1 -= eHP1 * 0.1;
          eHPNew2 -= eHP2 * 0.1;
          color = "#ecce45";
          ttHP.innerHTML += instant(color, "IMPAIRED!!", 2) + `<br>`;
        }
        if (eTags.includes("brute")) {
          eHPNew1 -= eHP1 * 0.08;
          eHPNew2 -= eHP2 * 0.08;
          color = "#ecce45";
          ttHP.innerHTML += instant(color, "IMPAIRED!!", 1) + `<br>`;
        }
        if (eTags.includes("ucc")) {
          eHPNew1 -= eHP1 * 0.036;
          eHPNew2 -= eHP2 * 0.036;
          color = "#ecce45";
          ttHP.innerHTML += instant(color, "IMPAIRED!!", 3) + ` on<br>legs, 3 time(s) on core<br>`;
        }
        if (eTags.includes("hunter")) {
          eHPNew1 -= eHP1 * 0.01;
          eHPNew2 -= eHP2 * 0.01;
          color = "#ecce45";
          ttHP.innerHTML += instant(color, "IMPAIRED!!", 1) + `<br>`;
        }
        if (eTags.includes("miasma")) {
          eHPNew1 -= eHP1 * (currEnemyID[2] != '3' ? 0.15 * (currEnemyID == "26202" ? 2 : 1) : (currEnemyID == "25300" ? 0.045 : 0.025));
          eHPNew2 -= eHP2 * (currEnemyID[2] != '3' ? 0.15 * (currEnemyID == "26202" ? 2 : 1) : (currEnemyID == "25300" ? 0.045 : 0.025));
          color = "#d4317b";
          ttHP.innerHTML += instant(color, "PURIFIED!!", currEnemyID == "25300" ? 3 : currEnemyID == "26202" ? 2 : 1) + `<br>`;
        }
        if (eTags.includes("shutdown")) {
          eHPNew1 -= eHP1 * 0.015 * (currEnemyID == "26300" ? 2 : 1);
          eHPNew2 -= eHP2 * 0.015 * (currEnemyID == "26300" ? 2 : 1);
          color = "#b47ede";
          ttHP.innerHTML += instant(color, "SHUTDOWN!!", currEnemyID == "26300" ? 2 : 1) + `<br>`;
        }
        ttHP.innerHTML = alt(color, currEnemyID == "25300" ? (eName.slice(0, 21) + "<br>" + eName.slice(21)) : eName, eHPNew1, eHPNew2, eHP1) + ttHP.innerHTML;
      }
      enemyHP.appendChild(ttHP);
    }
    enemy.appendChild(enemyHP);

    /* add enemy def display */
    let enemyDef = document.createElement("div");
    enemyDef.className = "e-def";
    enemyDef.innerHTML = Math.ceil(eDef);
    enemy.appendChild(enemyDef);

    /* add enemy misc stat tooltip */
    let ttMiscStat = document.createElement("div");
    ttMiscStat.className = "tt-e-stat";
    ttMiscStat.innerHTML = `+<span class="tt-text">${generateEnemyStats(eDaze1, eDaze2, eStunMult, eStunTime, eAnom, eElementMult, eMods)}</span>`;
    enemy.appendChild(ttMiscStat);

    waveEnemies.appendChild(enemy);
    oldEName = eName;
  }

  /* save current page + settings */
  saveSettings();
}

/* -------------------------------------------------------------------- INFO GENERATOR -------------------------------------------------------------------- */

/* add 2 weakness/resistance display */
function generateWR(mult, wr) {
  let weakImg1 = document.createElement("img");
  let weakImg2 = document.createElement("img");
  let resImg1 = document.createElement("img");
  let resImg2 = document.createElement("img");
  weakImg1.className = "wk";
  weakImg2.className = "wk";
  resImg1.className = "res";
  resImg2.className = "res";
  weakImg1.src = "../assets/elements/none.webp";
  weakImg2.src = "../assets/elements/none.webp";
  resImg1.src = "../assets/elements/none.webp";
  resImg2.src = "../assets/elements/none.webp";
  let wkCnt = 0, resCnt = 0;
  for (let i = 0; i < 5; ++i) {
    if (mult[i] < 1 && wkCnt == 0) { weakImg1.src = `../assets/elements/${elementsData[i]}.webp`; ++wkCnt;}
    else if (mult[i] < 1 && wkCnt == 1) weakImg2.src = `../assets/elements/${elementsData[i]}.webp`;
    else if (mult[i] > 1 && resCnt == 0) { resImg1.src = `../assets/elements/${elementsData[i]}.webp`; ++resCnt; }
    else if (mult[i] > 1 && resCnt == 1) resImg2.src = `../assets/elements/${elementsData[i]}.webp`;
  }
  wr.appendChild(weakImg1);
  wr.appendChild(weakImg2);
  wr.appendChild(resImg1);
  wr.appendChild(resImg2);
}

/* add special enemy tooltip text */
function alt(color, name, hpNew1, hpNew2, hp) {
  return `<span style="color:${color};">✦</span><span class="tt-text">
    <span style="font-weight:bold;text-decoration:underline;">${name}</span><br>
    <span style="color:#f6b26b;font-weight:bold;">Alt HP</span>: <span style="color:${color};font-weight:bold;">${Math.ceil(hpNew1)} / ${Math.ceil(hpNew2)}</span><br>
    <span style="font-weight:bold;">(assume ${Math.round(hpNew1 / hp * 1000) / 10}% of HP)</span><br><br>`;
}
function hitch(hp1, hp2) {
  return `<span style="color:#ffffff;">✦</span><span class="tt-text">
    <span style="font-weight:bold;text-decoration:underline;">Hitchspiker</span><br>
    True <span style="color:#ff5555;font-weight:bold;">Raw HP</span>: <span style="color:#ff5555;font-weight:bold;">${hp1} / ${hp2}</span><br><br>
    technically doesn't<br>need to be killed</span>`;
}
function palicus() { return `hit both 50% of the time</span>`; }
function instant(color, type, cnt) { return `<span style="font-weight:bold;"><span style="color:${color};">${type}</span></span> ${cnt} time(s)</span>`; }

/* add enemy stat tooltip text */
function generateEnemyStats(daze1, daze2, stun, time, anom, dmg, mods) {
  let anomMult = [1, 1, 1, 1, 1.2];
  let color = ["#98eff0", "#ff5521", "#2eb6ff", "#fe437e", "#f0d12b"];
  let stats = `<span style="font-weight:bold;">Max Daze: <span style="color:#ffe599;">${daze1} / ${daze2}</span></span><br>
    (<span style="color:#ffe599;font-weight:bold;">${stun}%</span> DMG for <span style="color:#ffe599;font-weight:bold;">${time}s</span>)<br><br>`;
  if (mods.includes("no-anom")) return stats + `<span style="font-weight:bold;">IMMUNE TO ANOMALY</span>`;
  else {
    stats += `<span style="font-weight:bold;">Max Anomaly Buildup:</span><br>`;
    for (let i = 0; i < 5; ++i) stats += `<span style="color:${color[i]};font-weight:bold;">${Math.round(anom * anomMult[i] * dmg[i] * 100) / 100}</span>/`;
    stats = stats.slice(0, -1) + `<br>${mods.includes("no-freeze") ? `<span style="color:#98eff0;font-weight:bold;">UNFREEZABLE</span>` : ``}`;
  }
  return stats;
}

/* ------------------------------------------------------------ MISCELLANEOUS + QOL + NAVIGATION ------------------------------------------------------------ */

/* load last saved page location + settings */
function loadSavedState() {
  if (localStorage.getItem("leaksEnabled") == "true") leaksToggle.checked = true;
  if (localStorage.getItem("spoilersEnabled") == "true") spoilersToggle.checked = true;
  currNumberFormat = localStorage.getItem("numberFormat") || "period";
  saveSettings();
}

/* save current page settings */
function saveSettings() {
  localStorage.setItem("numberFormat", currNumberFormat);
  localStorage.setItem("leaksEnabled", leaksToggle.checked);
  localStorage.setItem("spoilersEnabled", spoilersToggle.checked);
}

/* keyboard shortcuts to navigate main page */
document.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.key == "Escape") { e.preventDefault(); toggleMenu(); }
  return;
});

/* ------------------------------------------------------------------------ MENU BAR ----------------------------------------------------------------------- */

/* enables/disables menu bar */
function toggleMenu() {
  let menuBar = document.getElementById("mb");
  let menuBarOverlay = document.getElementById("mb-o");
  let fixedMenuButton = document.getElementById("open-mb-btn");
  if (menuIsOpen) {
    document.body.classList.remove("no-scroll");
    menuBar.style.display = "none";
    menuBarOverlay.style.display = "none";
    fixedMenuButton.style.display = "none";
  }
  else {
    document.body.classList.add("no-scroll");
    menuBar.style.display = "block";
    menuBarOverlay.style.display = "block";
    fixedMenuButton.style.display = "block";
  }
  menuIsOpen = !menuIsOpen;
}

/* highlights selected number format button and updates example number */
/* 2222222 2,222,222 2.222.222 */
function updateNumberFormat(e) {
  if (e) currNumberFormat = e.dataset.format;
  let ex = document.getElementById("ex-num");
  let numFormatButtons = document.querySelectorAll(".nfb");
  ex.innerHTML = numberFormat(2222222);
  numFormatButtons.forEach(btn => btn.classList.toggle("selected", btn.dataset.format == currNumberFormat));
}
function numberFormat(num) {
  if (currNumberFormat == "comma") return num.toLocaleString("en-US");
  if (currNumberFormat == "period") return num.toLocaleString("de-DE");
  return num;
}

/* enables/disables leaks/spoilers slider + access */
leaksToggle.addEventListener("change", () => {
  if (!leaksToggle.checked) {
    spoilersToggle.checked = false;
    if (versionNum > cntNoLeaks) versionNum = cntNoLeaks;
  }
});
spoilersToggle.addEventListener("change", () => {
  if (spoilersToggle.checked) leaksToggle.checked = true;
  showEnemies();
});

/* ----------------------------------------------------------------------------- MAIN ----------------------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", async () => { await loadShiyuPage(); });