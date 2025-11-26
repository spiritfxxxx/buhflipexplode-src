/* ------------------------------------------------------------------------ MAIN PAGE ----------------------------------------------------------------------- */

let cntNoLeaks = 35, oldModeNum = 4, modeNum = 4, v2_4 = 37;
let leaksToggle = document.getElementById("lks");
let spoilersToggle = document.getElementById("spl");
let oldVersionNum = null, currVersion = null, versionNum = null, nodeNum = null;
let chartNodeNum = null, oldChartDisplayType = null, chartDisplayType = null, currNumberFormat = null;
let menuIsOpen = false, versionSelectorIsOpen = false, chartIsOpen = false;

let versionData = null, versionDazeMult = null, versionAnomMult = null, versionEnemies = null, enemyData = null, hpChart = null;
let versionIDs = [], hpData = [];
let nodeLvlData = [ [25, 28, 30, 33, 35, 38, 40, 43, 45, 50],                                 // stable
                    [40, 43, 45, 48, 50, 53, 55, 60],                                         // disputed
                    [50, 53, 55, 60, 65],                                                     // ambush
                    [50, 53, 55, 58, 60, 65, 70] ];                                           // critical
let newNodeLvlData = [50, 55, 60, 65, 70];

let nodeHPMult = [ [11.19, 11.6, 13.51, 15.41, 18.53, 18.7, 21.58, 23.77, 28.24, 32.13],      // stable
                   [21.58, 23.77, 28.24, 28.96, 32.13, 34.60, 40.8, 46.04],                   // disputed
                   [32.13, 34.6, 40.8, 46.04, 47.74],                                         // ambush
                   [32.13, 34.6, 40.8, 41.58, 46.04, 47.74, 54.06] ];                         // critical
let newNodeHPMult = [32.13, 40.8, 46.04, 47.74, 54.06];

let nodeDefMult = [ [222, 256, 281, 319, 347, 390, 421, 469, 502, 592],                       // stable
                    [421, 469, 502, 555, 592, 649, 689, 794],                                 // disputed
                    [592, 649, 689, 794, 794],                                                // ambush
                    [592, 649, 689, 751, 794, 794, 794] ];                                    // critical
let newNodeDefMult = [592, 689, 794, 794, 794];

let nodeDazeMult = [ [1.04, 1.06, 1.08, 1.15, 1.2, 1.28, 1.2901, 1.46, 1.55, 1.78],           // stable
                     [1.329, 1.46, 1.55, 1.691, 1.78, 1.86, 1.92, 2.06],                      // disputed
                     [1.78, 1.86, 1.92, 2.06, 2.2],                                           // ambush
                     [1.78, 1.86, 1.92, 2, 2.06, 2.2, 2.35] ];                                // critical
let newNodeDazeMult = [1.78, 1.92, 2.06, 2.2, 2.35];
let elementsData = ["ice", "fire", "electric", "ether", "physical"];

/* load main page data from .json files, and display */
async function loadShiyuPage() {
  versionData = await (await fetch("sd-versions.json")).json();
  enemyData = await (await fetch("../assets/enemies.json")).json();
  for (let m = 1; m <= 4; ++m) versionIDs.push(Object.keys(versionData[m - 1].versions));
  buildHPData();
  loadSavedState();
  await showVersion();
  showNode();
  showChartNode();
  updateNumberFormat();
}

/* create hp database using 3D matrix */
function buildHPData() {
  hpData = [Array.from({length: 10}, () => Array.from({length: 3}, () => Array.from({length: 1}).fill(null))),
            Array.from({length: 8}, () => Array.from({length: 3}, () => Array.from({length: 1}).fill(null))),
            Array.from({length: 5}, () => Array.from({length: 3}, () => Array.from({length: 1}).fill(null))),
            Array.from({length: 7}, () => Array.from({length: 3}, () => Array.from({length: versionIDs[3].length}).fill(null))) ];
  for (let m = 1; m <= 4; ++m) {
    for (let v = 1; v <= versionIDs[m - 1].length; ++v) {
      versionEnemies = versionData[m - 1].versions[versionIDs[m - 1][v - 1]].versionEnemies;
      for (let n = 1; n <= versionEnemies.nodes.length; ++n) {
        let currNode = versionEnemies.nodes[n - 1];
        let rawHP = 0, aoeHP = 0, altHP = 0;
        let addAOE = true;
        for (let s = 1; s <= currNode.sides.length; ++s) {
          let currSide = currNode.sides[s - 1];
          if (currSide == null) continue;
          for (let w = 1; w <= currSide.waves.length; ++w) {
            let currWave = currSide.waves[w - 1];
            for (let e = 1; e <= currWave.enemies.length; ++e) {
              let currEnemy = currWave.enemies[e - 1];
              let currEnemyData = enemyData[currEnemy.id];
              let eHP = currEnemy.hp;
              let eTags = currEnemyData.tags;
              for (let cnt = 1; cnt <= currEnemy.count; ++cnt) {
                rawHP += currEnemy.id != "14000" ? eHP : 1;
                aoeHP += addAOE ? eHP : 0;
                if (eTags.length >= 1 && !(eTags.length == 1 && eTags.includes("spoiler"))) {
                  if (eTags.includes("brute")) altHP += eHP * 0.92;
                  else if (eTags.includes("robot")) altHP += eHP * 0.9;
                  else if (eTags.includes("miasma")) altHP += eHP * 0.85;
                  else if (eTags.includes("palicus")) altHP += eHP * 0.75;
                }
                else altHP += addAOE ? eHP : 0;
                addAOE = false;
              }
            }
            addAOE = true;
          }
        }
        hpData[m - 1][n - 1][0][v - 1] = rawHP;
        hpData[m - 1][n - 1][1][v - 1] = aoeHP;
        hpData[m - 1][n - 1][2][v - 1] = (m == 4 && n > 5) || m != 3 ? Math.ceil(altHP) : null;
      }
    }
  }
}

/* ◁ [version # + time] ▷ display */
async function showVersion() {
  currVersion = versionData[modeNum - 1].versions[versionIDs[modeNum - 1][versionNum - 1]];
  versionDazeMult = currVersion.versionDazeMult;
  versionAnomMult = currVersion.versionAnomMult;
  versionEnemies = currVersion.versionEnemies;
  document.getElementById("v-name").innerHTML = currVersion.versionName;
  document.getElementById("v-time").innerHTML = currVersion.versionTime;
  showNode();
}
async function changeVersion(n) {
  let lastVersion = parseInt(localStorage.getItem("lastSDVersion")), maxVersion = leaksToggle.checked ? versionIDs[modeNum - 1].length : cntNoLeaks;
  if (modeNum == 4) versionNum = (versionNum - 1 + n + maxVersion) % maxVersion + 1;
  else { modeNum = 4; versionNum = (!leaksToggle.checked && lastVersion > cntNoLeaks) ? cntNoLeaks : lastVersion; }
  await showVersion();
}

/* ◁ node # ▷ display */
function showNode() {
  if (oldModeNum != modeNum) {
    nodeNum = modeNum == 4 ? parseInt(localStorage.getItem("lastSDNode")) : versionEnemies.nodes.length;
    oldModeNum = modeNum;
    displayHPChart();
  }
  changePrePostNode();
  document.getElementById("n-text").innerHTML = nodeNum;
  showBuffs();
  showEnemies();
}
function changeNode(n) { nodeNum = (nodeNum - 1 + n + versionEnemies.nodes.length) % versionEnemies.nodes.length + 1; showNode(); }
function changePrePostNode() {
  if (oldVersionNum <= v2_4 && versionNum > v2_4) {
    if (nodeNum <= 2) nodeNum = 1;
    else if (nodeNum <= 4) nodeNum = 2;
    else nodeNum -= 2;
  }
  else if (oldVersionNum > v2_4 && versionNum <= v2_4) {
    if (nodeNum >= 3) nodeNum += 2;
    else if (nodeNum == 2) nodeNum = 3;
  }
  oldVersionNum = versionNum;
}

/* chart ◁ ▷ display */
function showChartNode() { displayHPChart(); }
function changeChartNode(n) {
  if (modeNum != 4) return;
  let maxChartNodeNum = chartDisplayType == "Pre 2.5" ? 7 : 5;
  chartNodeNum = (chartNodeNum - 1 + n + maxChartNodeNum) % maxChartNodeNum + 1;
  showChartNode();
}
function changePrePostChartNode() {
  if (oldChartDisplayType != chartDisplayType) {
    if (chartDisplayType == "Pre 2.5") {
      if (chartNodeNum >= 3) chartNodeNum += 2;
      else if (chartNodeNum == 2) chartNodeNum = 3;
    }
    else {
      if (chartNodeNum <= 2) chartNodeNum = 1;
      else if (chartNodeNum <= 4) chartNodeNum = 2;
      else chartNodeNum -= 2;
    }
  }
  oldChartDisplayType = chartDisplayType;
}

/* show specific chart variant for pre/post 2.5 */
function changeChart() { displayHPChart(); }

function showBuffs() {
  if (modeNum != 4) {
    document.getElementById("b-name").innerHTML = versionEnemies.nodes[nodeNum - 1].buffName;
    document.getElementById("b-desc").innerHTML = versionEnemies.nodes[nodeNum - 1].buffDesc;
  }
  else if (versionNum > v2_4) {
    if (nodeNum == 5) 
      for (let buff = 1; buff <= 3; ++buff) {
        document.getElementById(`b-name${buff}`).innerHTML = currVersion.buffName[buff - 1];
        document.getElementById(`b-desc${buff}`).innerHTML = currVersion.buffDesc[buff - 1];
      }
    else {
      document.getElementById("b-name").innerHTML = currVersion.buffName[0];
      document.getElementById("b-desc").innerHTML = currVersion.buffDesc[0];
    }
  }
  else {
    document.getElementById("b-name").innerHTML = currVersion.buffName;
    document.getElementById("b-desc").innerHTML = currVersion.buffDesc;
  }
  document.getElementById("b").style.display = (versionNum > v2_4 && nodeNum == 5) ? "none" : "block";
  document.getElementById("n5-b").style.display = (versionNum > v2_4 && nodeNum == 5) ? "flex" : "none";
}

/* place and display elements/enemies/weaknesses/resistances/HP/count on screen */
function showEnemies() {
  let currNode = versionEnemies.nodes[nodeNum - 1];
  
  /* add side 1 & 2 displays */
  let side1 = document.querySelector("#s1"), side2 = document.querySelector("#s2"), side3 = document.querySelector("#s3");
  side1.innerHTML = ``; side2.innerHTML = ``; side3.innerHTML = ``;
  side1.style.height = modeNum == 4 ? (nodeNum > 5 ? "775px" : "1350px") : modeNum == 3 ? "490px" : modeNum == 2 ? "775px" : (nodeNum > 8 ? "775px" : "1350px");
  side2.style.height = modeNum == 4 ? (nodeNum > 5 ? "775px" : "1350px") : modeNum == 3 ? "490px" : modeNum == 2 ? "775px" : (nodeNum > 8 ? "775px" : "1350px");
  side3.style.height = modeNum == 4 ? (nodeNum > 5 ? "775px" : "1350px") : modeNum == 3 ? "490px" : modeNum == 2 ? "775px" : (nodeNum > 8 ? "775px" : "1350px");
  if (versionNum <= v2_4 || nodeNum < 5) side3.style.display = "none";
  else side3.style.display = "flex";

  /* loop node's sides */
  for (let s = 1; s <= currNode.sides.length; ++s) {
    let side = s == 1 ? side1 : s == 2 ? side2 : side3;
    let currSide = currNode.sides[s - 1];
    let sideHPMult = null;

    /* add side x-x LvXX title */
    let sideHeader = document.createElement("div");
    sideHeader.className = "s-header";
    sideHeader.innerHTML = `${nodeNum}-${s} Lv${versionNum <= v2_4 ? nodeLvlData[modeNum - 1][nodeNum - 1] : newNodeLvlData[nodeNum - 1]}`;

    /* add side supposed equal HP multiplier */
    let combHPMult = document.createElement("div");
    combHPMult.className = "s-hp-daze-anom-mult";
    combHPMult.innerHTML = `HP: <span style="color:#ff5555;">N/A</span> | Daze: <span style="color:#ffe599;">N/A</span>`;
    sideHeader.appendChild(combHPMult);

    /* add side combined weaknesses/resistances */
    let combWR = document.createElement("div");
    combWR.className = "wr";
    generateWR(currSide != null ? currNode.sides[s - 1].sideElementMult : [1.0, 1.0, 1.0, 1.0, 1.0], combWR);
    sideHeader.appendChild(combWR);
    side.appendChild(sideHeader);

    if (currSide == null) continue;

    /* loop side's waves */
    for (let w = 1; w <= currSide.waves.length; ++w) {
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
        let eName = showEnemySpoilers ? currEnemyData.name : "SPOILER ENEMY";
        let eImg = showEnemySpoilers ? `../assets/enemies/${currEnemyData.image}.webp` : `../assets/enemies/doppelganger-i.webp`;

        /* define current enemy's various stats */
        let eHP = currEnemy.hp;
        let eHPMult = Math.round(eHP / currEnemyData.baseHP[currEnemyType] / (versionNum <= v2_4 ? nodeHPMult[modeNum - 1][nodeNum - 1] : newNodeHPMult[nodeNum - 1]) * 10000) / 100;
        let eDef = currEnemyData.baseDef / 50 * (versionNum <= v2_4 ? nodeDefMult[modeNum - 1][nodeNum - 1] : newNodeDefMult[nodeNum - 1]);
        let eDaze = currEnemyData.baseDaze[currEnemyType] * (versionNum <= v2_4 ? nodeDazeMult[modeNum - 1][nodeNum - 1] : newNodeDazeMult[nodeNum - 1]);
        let eStunMult = currEnemyData.stunMult;
        let eStunTime = currEnemyData.stunTime;
        let eAnom = currEnemyData.baseAnom;
        let eElementMult = currEnemyData.elementMult;

        /* finish adding side header after first+ enemy */
        if (sideHPMult == null) {
          combHPMult.innerHTML = `HP: <span style="color:#ff5555;">${eHPMult}%</span> | Daze: <span style="color:#ffe599;">${versionDazeMult}%</span>`;
          /* do not add header if not. dullahan (weird base hp) is not the only enemy in wave */
          if (currEnemyID != "10213" || currWave.enemies.length == 1) sideHPMult = eHPMult;
        }

        /* loop each enemy appearance */ 
        for (let cnt = 1; cnt <= currEnemy.count; ++cnt) {
          /* add enemy display */
          let enemy = document.createElement("div");
          enemy.className = "e";
          
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
          enemyHP.innerHTML = numberFormat(eHP);
          /* add special enemy tooltip (if necessary) */
          if (eTags.length >= 1 && !(eTags.length == 1 && eTags.includes("spoiler"))) {
            let ttHP = document.createElement("div");
            ttHP.className = "tt-e-hp";
            if (eTags.includes("hitch")) {
              ttHP.innerHTML = `<span style="color:#ffffff;">✦</span><span class="tt-text">${hitch(eHP)}</span>`;
              enemyHP.innerHTML = numberFormat(1);
            }
            else if (eTags.includes("brute"))
              ttHP.innerHTML = `<span style="color:#ecce45;">✦</span><span class="tt-text">${instant("#ecce45", "IMPAIRED!!", eName, eHP, 8, 1)}</span>`;
            else if (eTags.includes("robot"))
              ttHP.innerHTML = `<span style="color:#ecce45;">✦</span><span class="tt-text">${instant("#ecce45", "IMPAIRED!!", eName, eHP, 5, 2)}</span>`;
            else if (eTags.includes("miasma"))
              ttHP.innerHTML = `<span style="color:#d4317b;">✦</span><span class="tt-text">${instant("#d4317b", "PURIFIED!!", eName, eHP, 15, 1)}</span>`;
            else if (eTags.includes("palicus"))
              ttHP.innerHTML = `<span style="color:#93c47d;">✦</span><span class="tt-text">${palicus(eHP)}</span>`;
            enemyHP.appendChild(ttHP);
          }
          enemy.appendChild(enemyHP);

          /* add enemy specific HP multiplier if not in a margin of error */
          if (Math.abs(sideHPMult - eHPMult) > 1) {
            let specificHPMult = document.createElement("div");
            specificHPMult.className = "e-hp-mult";
            specificHPMult.innerHTML = `[${eHPMult}%]`;
            enemy.appendChild(specificHPMult);
          }

          /* add enemy def display */
          let enemyDef = document.createElement("div");
          enemyDef.className = "e-def";
          enemyDef.innerHTML = Math.ceil(eDef);
          enemy.appendChild(enemyDef);

          /* add enemy misc stat tooltip */
          let ttMiscStat = document.createElement("div");
          ttMiscStat.className = "tt-e-stat";
          ttMiscStat.innerHTML = `+<span class="tt-text">${generateEnemyStats(versionDazeMult / 100 * eDaze, eStunMult, eStunTime, eAnom, eElementMult, eMods)}</span>`;
          enemy.appendChild(ttMiscStat);

          waveEnemies.appendChild(enemy);
        }
      }
      wave.appendChild(waveEnemies);
      side.appendChild(wave);
    }
  }

  /* add raw + aoe + alt HP display */
  document.getElementById("n-hp-raw").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][0][versionNum - 1]);
  document.getElementById("n-hp-aoe").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][1][versionNum - 1]);
  document.getElementById("n-hp-alt").innerHTML = modeNum == 1 || modeNum == 2 || (modeNum == 4 && nodeNum > 5) ? numberFormat(hpData[modeNum - 1][nodeNum - 1][2][versionNum - 1]) : numberFormat(hpData[modeNum - 1][nodeNum - 1][1][versionNum - 1]);
  
  /* save current page + settings */
  if (modeNum == 4) saveLastPage();
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
function hitch(hp) {
  return `<span style="font-weight:bold;text-decoration:underline;">Hitchspiker</span><br>
          True <span style="color:#ff5555;font-weight:bold;">Raw HP</span>: <span style="color:#ff5555;font-weight:bold;">${numberFormat(hp)}</span><br><br>
          technically doesn't<br>need to be killed`;
}
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
          <span style="font-weight:bold;"><span style="color:${color};">${type}</span></span> ${cnt} time(s)`;
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
/* !!!!!!!!!!!!!!!!!! DEFAULT TO LATEST SHIYU 7 !!!!!!!!!!!!!!!!!! */
function loadSavedState() {
  if (localStorage.getItem("leaksEnabled") == "true") leaksToggle.checked = true;
  if (localStorage.getItem("spoilersEnabled") == "true") spoilersToggle.checked = true;
  versionNum = parseInt(localStorage.getItem("lastSDVersion") || `${cntNoLeaks}`);
  oldVersionNum = versionNum;
  nodeNum = parseInt(localStorage.getItem("lastSDNode") || "7");
  chartNodeNum = parseInt(localStorage.getItem("lastSDChartNode") || "7");
  chartDisplayType = localStorage.getItem("lastSDChartType") || "Pre 2.5";
  oldChartDisplayType = chartDisplayType;
  currNumberFormat = localStorage.getItem("numberFormat") || "period";
  if (!leaksToggle.checked) versionNum = Math.min(versionNum, cntNoLeaks);
  saveLastPage();
  saveSettings();
}

/* save current page location + settings */
function saveLastPage() {
  localStorage.setItem("lastSDVersion", versionNum);
  localStorage.setItem("lastSDNode", nodeNum);
  localStorage.setItem("lastSDChartNode", chartNodeNum);
  localStorage.setItem("lastSDChartType", chartDisplayType);
}
function saveSettings() {
  localStorage.setItem("numberFormat", currNumberFormat);
  localStorage.setItem("leaksEnabled", leaksToggle.checked);
  localStorage.setItem("spoilersEnabled", spoilersToggle.checked);
}

/* keyboard shortcuts to navigate main page */
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
  showNode();
  displayHPChart();
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
  title.innerHTML = `Critical Node`;
  row2.innerHTML = ``;

  /* loop enabled versions to add it to the selector */
  for (let m = 1; m <= 4; ++m) {
    for (let v = 1; v <= (m == 4 ? (leaksToggle.checked ? versionIDs[m - 1].length : cntNoLeaks) : 1); ++v) {
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
        versionNum = modeNum == 4 ? v : 1;
        toggleVersionSelector();
        showVersion();
      };

      /* add button to selector */
      m != 4 ? row1.appendChild(versionButton) : row2.appendChild(versionButton);
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
/* download the chart with the middle button in the chart top bar */
function downloadChart() {
  let downloadButton = document.createElement("a");
  downloadButton.href = hpChart.toBase64Image("image/png", 1.0);
  downloadButton.download = `Shiyu Defense - ${versionData[modeNum - 1].name} ` + (modeNum == 4 ? `${chartNodeNum} HP` : `HP`);
  downloadButton.click();
}
/* format 3 hp dataset */
function createHPDataset(label, data, color) {
  return { label, data, pointRadius: 2, borderWidth: 2, borderColor: color, pointHoverRadius: 4, pointHoverBorderWidth: 2, pointHoverBorderColor: color, backgroundColor: "#ffffff" };
}

function displayHPChart() {
  /* remove score selector if enemy dropdown is selected */
  chartDisplayType = document.getElementById("c-dd").value;
  changePrePostChartNode();
  let startChartVersion = chartDisplayType == "Pre 2.5" ? 0 : v2_4;
  let endChartVersion = chartDisplayType == "Pre 2.5" ? v2_4 : versionIDs[modeNum - 1].length;
  
  /* various plugins thanks to Chart.js documentation + videos + Stack Overflow + friends */
  /* position hover line highlighting respective hp points */
  const verticalHoverLine = {
    id: "verticalHoverLine",
    beforeDatasetsDraw(chart, args, plugins) {
      let { ctx, chartArea: {top, bottom, height} } = chart;
      ctx.save();
      for (let hp = 0; hp <= 2; ++hp)
        chart.getDatasetMeta(hp).data.forEach((dataPoint, index) => {
          if (dataPoint.active) {
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
            ticks: {
              padding: 15, font: { family: "Inconsolata", size: 12 }, color: "#888888",
              callback: function(value, index) { return index % 2 == 0 ? numberFormat(value) : ""; }
            }
          }
        },

        /* add chart legend, hover tooltip formatting */
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
  var labels;
  let rawHPData = [], aoeHPData = [], altHPData = [];
  if (modeNum != 4) {
    labels = Array.from({length: nodeLvlData[modeNum - 1].length}, (_, n) => `${versionData[modeNum - 1].name} ${n + 1}`);
    for (let n = 0; n < nodeLvlData[modeNum - 1].length; ++n) {
      rawHPData.push(hpData[modeNum - 1][n][0][0]);
      aoeHPData.push(hpData[modeNum - 1][n][1][0]);
      altHPData.push(hpData[modeNum - 1][n][2][0]);
    }
    hpChart.options.plugins.title.text = `Shiyu Defense: ${versionData[modeNum - 1].name} HP`;
    hpChart.options.scales.y.min = 0;
    hpChart.options.scales.y.max = 16000000;
    hpChart.options.scales.y.ticks.stepSize = 2000000;
    hpChart.options.scales.y.grid = { color: function(context) { return context.tick.value % 4000000 == 0 ? "#888888" : "#444444"; } };
  }
  else {
    labels = versionIDs[modeNum - 1].slice(startChartVersion, endChartVersion);
    let newHPData = hpData[modeNum - 1][chartNodeNum - 1].map(row => row.slice(startChartVersion, endChartVersion));
    rawHPData = newHPData[0];
    aoeHPData = newHPData[1];
    altHPData = newHPData[2];
    hpChart.options.plugins.title.text = `Shiyu Defense: Critical Node ${chartNodeNum} HP - ${chartDisplayType}`;
    hpChart.options.scales.y.min = chartDisplayType == "Pre 2.5" || chartNodeNum < 5 ? 0 : 80000000;
    hpChart.options.scales.y.max = chartDisplayType == "Pre 2.5" || chartNodeNum < 5 ? 70000000 : 240000000;
    hpChart.options.scales.y.ticks.stepSize = chartDisplayType == "Pre 2.5" || chartNodeNum < 5 ? 5000000 : 10000000;
    hpChart.options.scales.y.grid = { color: function(context) { return context.tick.value % (chartDisplayType == "Pre 2.5" || chartNodeNum < 5 ? 10000000 : 20000000) == 0 ? "#888888" : "#444444"; } };
  }
  hpChart.data.labels = labels;
  hpChart.data.datasets = [
    createHPDataset("Raw HP", rawHPData, "#e06666"),
    createHPDataset("AOE HP", aoeHPData, "#6d9eeb"),
    modeNum == 1 || modeNum == 2 || (modeNum == 4 && (chartDisplayType == "Pre 2.5" ? chartNodeNum > 5 : chartNodeNum > 3)) ? createHPDataset("Alt HP", altHPData, "#f6b26b") : null
  ].filter(Boolean);

  hpChart.update();
  if (modeNum == 4) saveLastPage();
  saveSettings();
}

/* ----------------------------------------------------------------------------- MAIN ----------------------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", async () => { await loadShiyuPage(); });