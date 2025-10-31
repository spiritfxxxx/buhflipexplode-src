/* ------------------------------------------------------------------------ MAIN PAGE ----------------------------------------------------------------------- */

let cntNoLeaks = 1, oldModeNum = 2, modeNum = 2;
let leaksToggle = document.getElementById("lks");
let spoilersToggle = document.getElementById("spl");
let versionNum = null, nodeNum = null, chartNodeNum = null, chartScoreNum = null, currNumberFormat = null;
let menuIsOpen = false, versionSelectorIsOpen = false, chartIsOpen = false;

let versionData = null, enemyData = null, hpChart = null;
let buffNames = null, buffDescs = null, versionDazeMult = null, versionAnomMult = null, versionEnemies = null;
let versionIDs = [], hpData = [];
let nodeLvlData = [ [55, 58, 60, 65],                                                 // easy
                    [60, 63, 65, 70, 70, 70] ];                                       // hard

let nodeHPMult = [ [40.8, 41.58, 46.04, 47.74],                                       // easy
                   [46.04, 47.04, 47.74, 54.06, 54.06, 54.06] ];                      // hard

let nodeDefMult = [ [689, 751, 794, 794],                                             // easy
                    [794, 794, 794, 794, 794, 794] ];                                 // hard

let nodeDazeMult = [ [1.92, 2, 2.06, 2.2],                                            // easy
                     [2.06, 2.2, 2.35, 2.35, 2.35] ];                                 // hard
let elementsData = ["ice", "fire", "electric", "ether", "physical"];

/* load main page data from .json files, and display */
async function loadThresholdPage() {
  versionData = await (await fetch("ts-versions.json")).json();
  enemyData = await (await fetch("../assets/enemies.json")).json();
  buffDescs = await (await fetch("../assets/buffs.json")).json();
  for (let m = 1; m <= 2; ++m) versionIDs.push(Object.keys(versionData[m - 1].versions));
  buildHPData();
  loadSavedState();
  await showVersion();
  //displayHPChart();
  updateNumberFormat();
}

/* create hp database using 3D matrix */
async function buildHPData() {
  hpData = [Array.from({length: 4}, () => Array.from({length: 5}, () => Array.from({length: 1}).fill(null))),
            Array.from({length: 6}, () => Array.from({length: 5}, () => Array.from({length: versionIDs[1].length}).fill(null))) ];
  for (let m = 1; m <= 2; ++m) {
    for (let v = 1; v <= versionIDs[m - 1].length; ++v) {
      versionEnemies = versionData[m - 1].versions[versionIDs[m - 1][v - 1]].versionEnemies;
      for (let n = 1; n <= versionEnemies.nodes.length; ++n) {
        let raw60kEnemyHP = 0, alt60kEnemyHP = 0;
        let currNode = versionEnemies.nodes[n - 1];
        for (let s = 1; s <= 5; ++s) {
          let currSide = currNode.sides[s - 1];
          if (currSide == null) continue;
          for (let w = 1; w <= currSide.waves.length; ++w) {
            let currWave = currSide.waves[w - 1];
            for (let e = 1; e <= currWave.enemies.length; ++e) {
              let currEnemy = currWave.enemies[e - 1];
              let currEnemyID = currEnemy.id;
              let currEnemyData = enemyData[currEnemyID];
              let eHP = currEnemy.hp;
              let eTags = currEnemyData.tags;
              for (let cnt = 1; cnt <= currEnemy.count; ++cnt) {
                raw60kEnemyHP += eHP;
                if (eTags.length >= 1 && !(eTags.length == 1 && eTags.includes("spoiler"))) {
                  if (eTags.includes("ucc")) alt60kEnemyHP += eHP * 0.964;
                  else if (eTags.includes("brute")) alt60kEnemyHP += eHP * 0.92;
                  else if (eTags.includes("robot")) alt60kEnemyHP += eHP * 0.9;
                  else if (eTags.includes("miasma")) alt60kEnemyHP += eHP * (currEnemyID[2] == '2' ? 0.85 : 0.97);
                  else if (eTags.includes("palicus")) alt60kEnemyHP += eHP * 0.75;
                }
                else alt60kEnemyHP += eHP;
              }
            }
          }
        }
        hpData[m - 1][n - 1][0][v - 1] = Math.ceil(raw60kEnemyHP * 0.281083138);
        hpData[m - 1][n - 1][1][v - 1] = Math.ceil(raw60kEnemyHP);
        hpData[m - 1][n - 1][2][v - 1] = Math.ceil(alt60kEnemyHP * 0.281083138);
        hpData[m - 1][n - 1][3][v - 1] = Math.ceil(alt60kEnemyHP);
      }
    }
  }
}

/* ◁ [version # + time] ▷ display */
async function showVersion() {
  let currVersion = versionData[modeNum - 1].versions[versionIDs[modeNum - 1][versionNum - 1]];
  versionDazeMult = currVersion.versionDazeMult;
  versionAnomMult = currVersion.versionAnomMult;
  versionEnemies = currVersion.versionEnemies;
  document.getElementById("v-name").innerHTML = currVersion.versionName;
  document.getElementById("v-time").innerHTML = currVersion.versionTime;
  showNode();
}
async function changeVersion(n) {
  let lastVersion = parseInt(localStorage.getItem("lastTSVersion")), maxVersion = leaksToggle.checked ? versionIDs[modeNum - 1].length : cntNoLeaks;
  if (modeNum == 2) versionNum = (versionNum - 1 + n + maxVersion) % maxVersion + 1;
  else { modeNum = 2; versionNum = (!leaksToggle.checked && lastVersion > cntNoLeaks) ? cntNoLeaks : lastVersion; }
  showVersion();
}

/* ◁ node # ▷ display */
function showNode() {
  if (oldModeNum != modeNum) {
    nodeNum = modeNum == 2 ? parseInt(localStorage.getItem("lastTSNode")) : nodeLvlData[modeNum - 1].length;
    oldModeNum = modeNum;
    //displayHPChart();
  }
  buffNames = versionEnemies.nodes[nodeNum - 1].buffNames;
  for (let buff = 1; buff <= 4; ++buff) {
    document.getElementById(`b-img${buff}`).src = `../assets/buffs/${buffNames[buff - 1].toLowerCase().replace(" ", "-")}.webp`;
    document.getElementById(`b-name${buff}`).innerHTML = buffNames[buff - 1];
    document.getElementById(`b-desc${buff}`).innerHTML = buffDescs[buffNames[buff - 1]];
  }
  document.getElementById("n-text").innerHTML = `${nodeNum < 4 || modeNum != 2 ? nodeNum : `4.${nodeNum < 4 ? 1 : nodeNum - 3}`}`; showEnemies();
}
function changeNode(n) { nodeNum = (nodeNum - 1 + n + nodeLvlData[modeNum - 1].length) % nodeLvlData[modeNum - 1].length + 1; showNode(); }

/* place and display elements/enemies/weaknesses/resistances/HP/count on screen */
function showEnemies() {
  let currNode = versionEnemies.nodes[nodeNum - 1];

  /* add side 1 & 2 displays */
  let boss = document.querySelector("#boss");
  let side1 = document.querySelector("#s1"), side2 = document.querySelector("#s2"), side3 = document.querySelector("#s3"), side4 = document.querySelector("#s4");;
  boss.innerHTML = ``; side1.innerHTML = ``; side2.innerHTML = ``; side3.innerHTML = ``; side4.innerHTML = ``;

  /* loop version's sides */
 for (let s = 1; s <= 5; ++s) {
    let side = s == 1 ? boss : s == 2 ? side1 : s == 3 ? side2 : s == 4 ? side3 : side4;
    let currSide = currNode.sides[s - 1];
    let sideHPMult = null;

    /* add side x-x LvXX title */
    let sideHeader = document.createElement("div");
    sideHeader.className = "s-header";
    sideHeader.innerHTML = `${s == 1 ? `Final BATTLE` : s <= 4 ? `Required` : `Optional`} ${nodeNum < 4 ? nodeNum : `4`}${modeNum != 2 || nodeNum < 4 ? `` : `.${nodeNum - 3}`}${s != 1 ? `-${s - 1}` : ``} Lv${nodeLvlData[modeNum - 1][nodeNum - 1]}`;

    /* add side supposed equal HP multiplier */
    let combHPMult = document.createElement("div");
    combHPMult.className = "s-hp-daze-anom-mult";

    /* add side combined weaknesses/resistances */
    /*let combWR = document.createElement("div");
    let currSideElementMult = currSide.sideElementMult;
    combWR.className = "wr";
    generateWR(currSideElementMult, combWR, s);*/
    side.appendChild(sideHeader);

    if (currSide == null) continue;

    /* loop side's waves */
    for (let w = currSide.waves.length; w >= 1; --w) {
      let wave = document.createElement("div");
      wave.className = "w";

      /* add wave WAVE # title */
      let waveHeader = document.createElement("div");
      waveHeader.className = "w-num";
      waveHeader.innerHTML = `WAVE ${w}`;
      wave.appendChild(waveHeader);

      /* add wave enemy display */
      let currWave = currSide.waves[w - 1];
      let waveEnemies = document.createElement("div");
      waveEnemies.className = "w-e";

      /* loop wave's enemies */
      for (let e = 1; e <= currWave.enemies.length; ++e) {
        let currEnemy = currWave.enemies[e - 1];
        let currEnemyID = currEnemy.id;
        let currEnemyType = currEnemy.type;
        let currEnemyData = enemyData[currEnemyID];

        /* define current enemy's parameters */
        let eTags = currEnemyData.tags;
        let eMods = currEnemyData.mods;
        let showEnemySpoilers = spoilersToggle.checked || !eTags.includes("spoiler");
        let eName = showEnemySpoilers ? currEnemyData.name : (s >= 2 ? "SPOILER ENEMY" : "SPOILER BOSS");
        let eImg = showEnemySpoilers ? `../assets/enemies/${currEnemyData.image}.webp` : `../assets/enemies/doppelganger-i.webp`;

        /* define current enemy's various stats */
        let eHP = currEnemy.hp;
        let eHPMult = Math.round(eHP / currEnemyData.baseHP[currEnemyType] / nodeHPMult[modeNum - 1][nodeNum - 1] * 10000) / 100;
        let eDef = currEnemyData.baseDef / 50 * nodeDefMult[modeNum - 1][nodeNum - 1];
        let eDaze = currEnemyData.baseDaze[currEnemyType] * nodeDazeMult[modeNum - 1][nodeNum - 1];
        let eStunMult = currEnemyData.stunMult;
        let eStunTime = currEnemyData.stunTime;
        let eAnom = currEnemyData.baseAnom;
        let eElementMult = currEnemyData.elementMult;

        /* loop each enemy appearance */ 
        for (let cnt = 1; cnt <= currEnemy.count; ++cnt) {
          /* add enemy display */
          let enemy = document.createElement("div");
          enemy.className = "e";
          
          let enemyImg = document.createElement("img");
          let enemyName = document.createElement("div");
          let enemyHover = document.createElement("div");
          enemyImg.className = "e-img";
          
          /* set non-final-boss enemies to be smaller */
          if (s >= 2) { enemyImg.style.height = "108px"; enemyName.style.fontSize = "12px"; enemyHover.style.maxHeight = "108px"; }

          enemyName.className = "e-name";
          enemyHover.className = "e-hover";
          enemyImg.src = eImg;
          enemyHover.appendChild(enemyImg);
          enemyName.innerHTML = eName;
          enemyHover.appendChild(enemyName);
          enemy.appendChild(enemyHover);

          let enemyWR = document.createElement("div");
          enemyWR.className = "wr";
          generateWR(eElementMult, enemyWR, s);
          enemy.appendChild(enemyWR);

          /* add enemy hp display */
          let enemyHP = document.createElement("div");
          enemyHP.className = "e-hp";
          enemyHP.innerHTML = numberFormat(eHP);
          /* add special enemy tooltip (if necessary) */
          if (eTags.length >= 1 && !(eTags.length == 1 && eTags.includes("spoiler"))) {
            let ttHP = document.createElement("div");
            ttHP.className = "tt-e-hp";

            /* set tooltip position to be in the top right of the smaller image */
            if (s >= 2) ttHP.style.right = "87px";

            if (eTags.includes("ucc"))
              ttHP.innerHTML = `<span style="color:#ecce45;">✦</span><span class="tt-text">${instant("#ecce45", "IMPAIRED!!", eName, eHP, 1.2, 3)}</span>`;
            else if (eTags.includes("brute"))
              ttHP.innerHTML = `<span style="color:#ecce45;">✦</span><span class="tt-text">${instant("#ecce45", "IMPAIRED!!", eName, eHP, 8, 1)}</span>`;
            else if (eTags.includes("robot"))
              ttHP.innerHTML = `<span style="color:#ecce45;">✦</span><span class="tt-text">${instant("#ecce45", "IMPAIRED!!", eName, eHP, 5, 2)}</span>`;
            else if (eTags.includes("miasma"))
              ttHP.innerHTML = `<span style="color:#d4317b;">✦</span><span class="tt-text">${instant("#d4317b", "PURIFIED!!", eName, eHP, (currEnemyID[2] == '4' ? 3 : 15), 1)}</span>`;
            else if (eTags.includes("palicus"))
              ttHP.innerHTML = `<span style="color:#93c47d;">✦</span><span class="tt-text">${palicus(eHP)}</span>`;
            enemyHP.appendChild(ttHP);
          }
          enemy.appendChild(enemyHP);

          /* add enemy specific HP multiplier (if no match side HP multiplier) */
          /* ADDING LATER */
          /* ADDING LATER */
          /* ADDING LATER */
          /* ADDING LATER */

          /* add enemy def display */
          let enemyDef = document.createElement("div");
          enemyDef.className = "e-def";
          enemyDef.innerHTML = Math.ceil(eDef);
          enemy.appendChild(enemyDef);

          /* add enemy misc stat tooltip */
          let ttMiscStat = document.createElement("div");
          ttMiscStat.className = "tt-e-stat";
          ttMiscStat.innerHTML = `+</span><span class="tt-text">${generateEnemyStats(eDaze, eStunMult, eStunTime, versionAnomMult / 100 * eAnom, eElementMult, eMods)}</span>`;
          enemy.appendChild(ttMiscStat);

          waveEnemies.appendChild(enemy);

          /* add enemy stage description */
          if (side == boss && currEnemyID[2] == '3') {
            document.querySelector(".esd")?.remove();
            let stageDesc = document.createElement("div");
            stageDesc.className = "esd";
            stageDesc.innerHTML = `${currEnemyData.desc[currEnemyType]}<br><br>${currEnemyData.perf[currEnemyType]}
                                  ${(currEnemyType == 1 || (currEnemyType == 0 && currEnemyID == "14403" && versionNum == 4)) ? `<br><br>${currEnemyData.misc}` : ``}`;
            if (eTags.includes("spoiler") && !spoilersToggle.checked) stageDesc.innerHTML = `${currEnemyData.spoilerDesc}<br><br>${currEnemyData.spoilerPerf}`;
            boss.parentElement.appendChild(stageDesc);
          }
        }
      }
      wave.appendChild(waveEnemies);
      side.appendChild(wave);
    }
  }

  /* add raw + alt HP display */
  document.getElementById("v-hp-raw-20000").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][0][versionNum - 1]);
  document.getElementById("v-hp-raw-60000").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][1][versionNum - 1]);
  document.getElementById("v-hp-alt-20000").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][2][versionNum - 1]);
  document.getElementById("v-hp-alt-60000").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][3][versionNum - 1]);

  /* save current page + settings */
  if (modeNum == 2) saveLastPage();
  saveSettings();
}

/* -------------------------------------------------------------------- INFO GENERATOR -------------------------------------------------------------------- */

/* add 2 weakness/resistance display */
function generateWR(mult, wr, s) {
  let weakImg1 = document.createElement("img");
  let weakImg2 = document.createElement("img");
  let resImg1 = document.createElement("img");
  let resImg2 = document.createElement("img");
  weakImg1.className = "wk";
  weakImg2.className = "wk";
  resImg1.className = "res";
  resImg2.className = "res";
  if (s >= 2) { weakImg1.style.width = "20px"; weakImg2.style.width = "20px"; resImg1.style.width = "20px"; resImg2.style.width = "20px"; }
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
function palicus(hp) {
  return `<span style="font-weight:bold;text-decoration:underline;">Palicus</span><br>
          <span style="color:#f6b26b;font-weight:bold;">Alt HP</span>: <span style="color:#93c47d;font-weight:bold;">${numberFormat(Math.ceil(hp * 75 / 100))}</span> x2<br>
          <span style="font-weight:bold;">(assume 75% of HP)</span><br><br>
          hit both 50% of the time<br>`;
}
function instant(color, type, name, hp, dmg, cnt) {
  return `<span style="font-weight:bold;text-decoration:underline;">${name}</span><br>
          <span style="color:#f6b26b;font-weight:bold;">Alt HP</span>: <span style="color:${color};font-weight:bold;">${numberFormat(Math.ceil(hp * (100 - dmg * cnt) / 100))}</span><br>
          <span style="font-weight:bold;">(assume ${100 - dmg * cnt}% of HP)</span><br><br>
          <span style="font-weight:bold;"><span style="color:${color};">${type}</span></span> ${cnt} time(s)`
          + (name == "Unknown Corruption Complex" ? ` on<br>legs, 3 time(s) on core` : ``);
}

/* add enemy stat tooltip text */
function generateEnemyStats(daze, stun, time, anom, dmg, mods) {
  let anomMult = [1, 1, 1, 1, 1.2];
  let color = ["#98eff0", "#ff5521", "#2eb6ff", "#fe437e", "#f0d12b"];
  let stats = `<span style="font-weight:bold;">Max Daze: <span style="color:#ffe599;">${Math.round(daze * 10000) / 10000}</span></span><br>
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
/* !!!!!!!!!!!!!!!!!! DEFAULT TO LATEST TS !!!!!!!!!!!!!!!!!! */
function loadSavedState() {
  if (localStorage.getItem("leaksEnabled") == "true") leaksToggle.checked = true;
  if (localStorage.getItem("spoilersEnabled") == "true") spoilersToggle.checked = true;
  versionNum = parseInt(localStorage.getItem("lastTSVersion") || `${cntNoLeaks}`);
  nodeNum = parseInt(localStorage.getItem("lastTSNode") || "6");
  chartNodeNum = parseInt(localStorage.getItem("lastTSChartNode") || "6");
  chartScoreNum = localStorage.getItem("lastTSChartScore") || "60k";
  currNumberFormat = localStorage.getItem("numberFormat") || "period";
  if (!leaksToggle.checked) versionNum = Math.min(versionNum, cntNoLeaks);
  saveLastPage();
  saveSettings();
}

/* save current page location + settings */
function saveLastPage() {
  localStorage.setItem("lastTSVersion", versionNum);
  localStorage.setItem("lastTSNode", nodeNum);
  localStorage.setItem("lastTSChartNode", chartNodeNum);
}
function saveSettings() {
  localStorage.setItem("lastTSChartScore", chartScoreNum);
  localStorage.setItem("numberFormat", currNumberFormat);
  localStorage.setItem("leaksEnabled", leaksToggle.checked);
  localStorage.setItem("spoilersEnabled", spoilersToggle.checked);
}

/* keyboard shortcuts to navigate main page */
document.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.key == "Escape") { e.preventDefault(); chartIsOpen ? toggleChart() : (versionSelectorIsOpen ? toggleVersionSelector() : toggleMenu()); }
  else if (e.key == " " && !menuIsOpen && !chartIsOpen) { e.preventDefault(); toggleVersionSelector(); }
  else if (e.key == "Backspace" && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); } // toggleChart(); }
  else if (e.key == "ArrowLeft" && !menuIsOpen && !chartIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeVersion(-1); }
  else if (e.key == "ArrowRight" && !menuIsOpen && !chartIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeVersion(1); }
  else if (e.key == "ArrowUp") { e.preventDefault(); !menuIsOpen && !chartIsOpen && !versionSelectorIsOpen ? changeNode(1) : changeChartNode(1) }
  else if (e.key == "ArrowDown") { e.preventDefault(); !menuIsOpen && !chartIsOpen && !versionSelectorIsOpen ? changeNode(-1) : changeChartNode(-1) }
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
  showEnemies();
  //displayHPChart();
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
  showVersion();
});
spoilersToggle.addEventListener("change", () => {
  if (spoilersToggle.checked) leaksToggle.checked = true;
  showEnemies();
});

/* -------------------------------------------------------------------- VERSION SELECTOR -------------------------------------------------------------------- */

/* enables/disables version selector menu */
function toggleVersionSelector() {
  let versionSelector = document.getElementById("vs");
  let versionSelectorOverlay = document.getElementById("vs-o");
  if (versionSelectorIsOpen) {
    document.body.classList.remove("no-scroll");
    versionSelector.style.display = "none";
    versionSelectorOverlay.style.display = "none";
  }
  else {
    document.body.classList.add("no-scroll");
    versionSelector.style.display = "flex";
    versionSelectorOverlay.style.display = "block";
    displayVersionSelectorGrid();
  }
  versionSelectorIsOpen = !versionSelectorIsOpen;
}

/* displays version selector */
function displayVersionSelectorGrid() {
  let versionSelector = document.getElementById("vs");
  let gridContent = versionSelector.querySelector("#vg");
  let row1 = versionSelector.querySelector("#vg-row1");
  let title = versionSelector.querySelector("#vg-title");
  let row2 = versionSelector.querySelector("#vg-row2");
  row1.innerHTML = ``;
  title.innerHTML = `Hard Mode`;
  row2.innerHTML = ``;

  /* loop enabled versions to add it to the selector */
  for (let m = 1; m <= 2; ++m) {
    for (let v = 1; v <= (m == 2 ? (leaksToggle.checked ? versionIDs[m - 1].length : cntNoLeaks) : 1); ++v) {
      let currVersion = versionData[m - 1].versions[versionIDs[m - 1][v - 1]];

      /* create a new version selection button */
      let versionButton = document.createElement("div");
      let nameDiv = document.createElement("div");
      let timeDiv = document.createElement("div");
      versionButton.className = "vg-c";
      nameDiv.className = "vg-c-name";
      timeDiv.className = "vg-c-time";
      nameDiv.innerHTML = currVersion.versionName;
      timeDiv.innerHTML = currVersion.versionTime;
      versionButton.appendChild(nameDiv);
      versionButton.appendChild(timeDiv);

      /* make it clickable, and if clicked go to that version */
      versionButton.onclick = () => {
        modeNum = m;
        versionNum = modeNum == 2 ? v : 1;
        toggleVersionSelector();
        //displayHPChart();
        showVersion();
      };

      /* add button to selector */
      m != 2 ? row1.appendChild(versionButton) : row2.appendChild(versionButton);
    }
  }

  gridContent.appendChild(row1);
  gridContent.appendChild(title);
  gridContent.appendChild(row2);
}

/* ----------------------------------------------------------------------------- CHART ----------------------------------------------------------------------- */

/* enables/disables version menu */
function toggleChart() {
  let chart = document.getElementById("c");
  if (chartIsOpen) { document.body.classList.remove("no-scroll"); chart.style.display = "none"; }
  else { document.body.classList.add("no-scroll"); chart.style.display = "flex"; }
  chartIsOpen = !chartIsOpen;
}
function toggleChartPoints(points) {
  if (chartScoreNum == points) return;
  chartScoreNum = points;
  saveSettings();
  displayHPChart();
}
/* download the chart with the middle button in the chart top bar */
function downloadChart() {
  let downloadButton = document.createElement("a");
  downloadButton.href = hpChart.toBase64Image("image/png", 1.0);
  downloadButton.download = `Threshold Simulation HP (${chartScoreNum})`;
  downloadButton.click();
}
/* format 3 hp dataset */
function createHPDataset(label, data, color) {
  return { label, data, pointRadius: 2, borderWidth: 2, borderColor: color, pointHoverRadius: 4, pointHoverBorderWidth: 2, pointHoverBorderColor: color, backgroundColor: "#ffffff" };
}

function displayHPChart() {
  /* various plugins thanks to Chart.js documentation + videos + Stack Overflow + friends */
  /* position hover line highlighting respective hp points */
  const verticalHoverLine = {
    id: "verticalHoverLine",
    beforeDatasetsDraw(chart, args, plugins) {
      let { ctx, chartArea: {top, bottom, height} } = chart;
      ctx.save();
      for (let hp = 0; hp <= 2; ++hp)
        chart.getDatasetMeta(hp).data.forEach((dataPoint, index) => {
          if (dataPoint.active == true) {
            ctx.beginPath();
            ctx.strokeStyle = "#888888";
            ctx.setLineDash([4, 6]);
            ctx.moveTo(dataPoint.x, top);
            ctx.lineTo(dataPoint.x, bottom);
            ctx.stroke();
          }
        })
      ctx.restore();
    }
  }
  /* add padding below legend */
  const legendPadding = {
    id: "legendPadding",
    beforeInit(chart) {
      let newLegend = chart.legend.fit;
      chart.legend.fit = function fit() { newLegend.bind(chart.legend)(); chart.legend.height += 15; }
    }
  };
  /* force hide tooltip + vertical hover line if moved out of ACTUAL chart area */
  const hideTooltipOutside = {
    id: "hideTooltipOutside",
    afterEvent(chart, args) {
      let {top, bottom, left, right} = chart.chartArea;
      let {x, y} = args.event;
      if (x < left || x > right || y < top || y > bottom) {
        chart.tooltip.setActiveElements([]);
        chart.tooltip.update();
        chart.setActiveElements([]);
        chart.update();
      }
    }
  };
  
  /* position hover tooltip */
  Chart.Tooltip.positioners.cursor = function(elements, eventPosition) {
    if (!eventPosition) return false;
    let {top, bottom} = this.chart.chartArea;
    let {x, y} = eventPosition;
    y += y <= (top + bottom) / 3 ? 50 : -50;
    return {x, y};
  };

  /* update chart data if a chart is already loaded */
  if (!hpChart) {
    hpChart = new Chart("hpChart", {
      /* import plugin data */
      type: "line", plugins: [verticalHoverLine, legendPadding, hideTooltipOutside],

      /* add chart settings */
      options: {
        /* disable chart animations, fit to screen, detect cursor position, positioning */
        animation: false, responsive: true, maintainAspectRatio: false,
        interaction: { mode: "nearest", axis: "x", intersect: false },
        layout: { padding: {top: 10, bottom: 15, left: 10, right: 25} },
        
        /* add x/y-axis formatting */
        scales: {
          x: {
            offset: true,
            border: { display: false },
            grid: { color: "transparent" },
            ticks: {
              padding: 10, font: { family: "Inconsolata", size: 12 }, color: "#888888", maxRotation: 0, 
              callback: function(value, index) { return index % 2 == 0 ? this.getLabelForValue(value) : ""; }
            }
          },
          y: {
            border: { display: false },
            grid: { color: function(context) { return context.tick.value % 40000000 == 0 ? "#888888" : "#444444"; } },
            ticks: {
              padding: 15, font: { family: "Inconsolata", size: 12 }, color: "#888888", stepSize: 20000000, 
              callback: function(value, index) { return index % 2 == 0 ? numberFormat(value) : ""; }
            }
          }
        },

        /* add chart, legend, hover tooltip formatting */
        plugins: {
          title: { display: true, color: "#ffffff", font: { family: "Inconsolata", size: 20, weight: "bold" } },
          legend: {
            labels: { usePointStyle: true, boxHeight: 8,
              font: { family: "Inconsolata", size: 14 },
              /* make legend element grayscale if disabled */
              generateLabels: function(chart) {
                let hpLegend = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                hpLegend.forEach((label, index) => {
                  if (!chart.isDatasetVisible(index)) { label.fontColor = "#888888"; label.strokeStyle = "#888888"; }
                  else label.fontColor = chart.data.datasets[label.datasetIndex].borderColor;
                });
                return hpLegend;
              },
            }
          },
          tooltip: { usePointStyle: true, boxHeight: 8, position: "cursor", caretSize: 0,
            titleFont: { family: "Inconsolata", size: 12, weight: "bold", lineHeight: 0.75 },
            bodyFont: { family: "Inconsolata", size: 12 },
            callbacks: {
              /* add tooltip text colors */
              labelTextColor: function(context) { return context.dataset.borderColor; },
              label: function(context) { return context.dataset.label + ": " + numberFormat(context.parsed.y); }
            }
          }
        }
      }
    });
  }
  
  /* add global chart settings */
  hpChart.data.labels = versionIDs[modeNum - 1];
  hpChart.data.datasets = [
    createHPDataset(`Raw HP (${chartScoreNum})`, chartScoreNum == "20k" ? hpData[modeNum - 1][nodeNum - 1][0] : hpData[modeNum - 1][nodeNum - 1][1], "#e06666"),
    createHPDataset(`Alt HP (${chartScoreNum})`, chartScoreNum == "20k" ? hpData[modeNum - 1][nodeNum - 1][2] : hpData[modeNum - 1][nodeNum - 1][3], "#f6b26b"),
  ]
  hpChart.options.scales.y.min = chartScoreNum == "20k" ? 40000000 : 160000000;
  hpChart.options.scales.y.max = chartScoreNum == "20k" ? 120000000 : 400000000;
  hpChart.options.plugins.title.text = `Threshold Simulation HP (${chartScoreNum})`;
  hpChart.update();
  if (modeNum == 2) saveLastPage();
  saveSettings();
}

/* ----------------------------------------------------------------------------- MAIN ----------------------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", async () => { await loadThresholdPage(); });