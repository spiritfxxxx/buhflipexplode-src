/* ------------------------------------------------------------------------ MAIN PAGE ----------------------------------------------------------------------- */

let cntNoLeaks = 29;
let leaksToggle = document.getElementById("lks"), spoilersToggle = document.getElementById("spl");
let bossDropdown = document.getElementById("b-dd");
let bossHPCalc1 = document.getElementById("b-hp1"), bossScoreCalc1 = document.getElementById("b-score1"), bossVerDropdown1 = document.getElementById("b-v-dd1");
let bossHPCalc2 = document.getElementById("b-hp2"), bossScoreCalc2 = document.getElementById("b-score2"), bossVerDropdown2 = document.getElementById("b-v-dd2");
let versionNum, chartScoreNum, currNumberFormat;
let currCalcBossID, currCalcData1, currCalcData2, currCalcMaxBossHP1, currCalcMaxBossHP2, currCalcVersion1, currCalcVersion2;
let menuIsOpen = versionSelectorIsOpen = chartIsOpen = calcIsOpen = false;

let versionData, enemyData, hpChart;
let buffNames, buffDescs, versionDazeMult, versionAnomMult, versionEnemies;
let versionIDs = hpData = [], specificHPData = Object.create(null);
let elementsData = ["ice", "fire", "electric", "ether", "physical"];

/* load main page data from .json files, and display */
async function loadDeadlyPage() {
  versionData = await (await fetch("da-versions.json")).json();
  enemyData = await (await fetch("../assets/enemies.json")).json();
  buffDescs = await (await fetch("../assets/buffs.json")).json();
  versionIDs = Object.keys(versionData);
  buildHPData();
  loadSavedState();
  await showVersion();
  displayHPChart();
  updateNumberFormat();
}

/* create hp database using 3D matrix */
function buildHPData() {
  hpData = Array.from({length: 4}, () => Array.from({length: versionIDs.length}).fill(null));
  for (let v = 1; v <= versionIDs.length; ++v) {
    let raw60kEnemyHP = 0, alt60kEnemyHP = 0;
    versionEnemies = versionData[versionIDs[v - 1]].versionEnemies;
    for (let b = 1; b <= 3; ++b) {
      let currEnemy = versionEnemies[b - 1];
      let currEnemyID = currEnemy.id;
      let currEnemyType = currEnemy.type;
      let currEnemyData = enemyData[currEnemyID];
      let eHP = Math.floor(8.74 * currEnemyData.baseHP[currEnemyType] * 24795 * currEnemy.mult / 10000);
      let eTags = currEnemyData.tags;
      raw60kEnemyHP += eHP;
      alt60kEnemyHP += eHP;
      if (eTags.length >= 1 && !(eTags.length == 1 && eTags.includes("spoiler"))) {
        if (eTags.includes("ucc")) alt60kEnemyHP -= eHP * 0.036;
        if (eTags.includes("hunter")) alt60kEnemyHP -= eHP * 0.01;
        if (eTags.includes("miasma")) alt60kEnemyHP -= eHP * (currEnemyID == "25300" ? 0.045 : (v >= 19 ? 0.025 : 0.03));
        if (eTags.includes("shutdown")) alt60kEnemyHP -= eHP * (currEnemyID == "26300" ? 0.03 : 0.015);
      }

      /* add boss appearance to boss hp map */
      if (!specificHPData[currEnemyID]) specificHPData[currEnemyID] = [];
      specificHPData[currEnemyID].push([versionIDs[v - 1], eHP]);
    }
    hpData[0][v - 1] = Math.ceil(raw60kEnemyHP * 0.281083138);
    hpData[1][v - 1] = Math.ceil(raw60kEnemyHP);
    hpData[2][v - 1] = Math.ceil(alt60kEnemyHP * 0.281083138);
    hpData[3][v - 1] = Math.ceil(alt60kEnemyHP);
  }
}

/* ◁ [version # + time] ▷ display */
async function showVersion() {
  let currVersion = versionData[versionIDs[versionNum - 1]];
  versionDazeMult = currVersion.versionDazeMult;
  versionAnomMult = currVersion.versionAnomMult;
  versionEnemies = currVersion.versionEnemies;
  buffNames = currVersion.buffNames;
  document.getElementById("v-name").innerHTML = currVersion.versionName + (versionNum == cntNoLeaks ? `<span style='color:#ff0000;font-weight:bold;'> (LIVE)</span>` : ``);
  document.getElementById("v-time").innerHTML = currVersion.versionTime;
  showBuffs();
  showEnemies();
}
async function changeVersion(n) {
  let maxVersion = leaksToggle.checked ? versionIDs.length : cntNoLeaks;
  versionNum = (versionNum - 1 + n + maxVersion) % maxVersion + 1;
  await showVersion();
}

/* show version buffs */
function showBuffs() {
  for (let buff = 1; buff <= 3; ++buff) {
    document.getElementById(`b-img${buff}`).src = `../assets/buffs/${buffNames[buff - 1].toLowerCase().replaceAll(" ", "-")}.webp`;
    document.getElementById(`b-name${buff}`).innerHTML = buffNames[buff - 1].replace(" v2", "");
    document.getElementById(`b-desc${buff}`).innerHTML = buffDescs[buffNames[buff - 1]];
  }
}

/* place and display elements/enemies/weaknesses/resistances/HP/count on screen */
function showEnemies() {
  /* add side 1 & 2 displays */
  let side1 = document.querySelector("#s1"), side2 = document.querySelector("#s2"), side3 = document.querySelector("#s3");
  side1.innerHTML = side2.innerHTML = side3.innerHTML = ``;

  /* loop version's sides */
  for (let s = 1; s <= 3; ++s) {
    let side = s == 1 ? side1 : (s == 2 ? side2 : side3);
    /* add side x-x LvXX title */
    let sideHeader = document.createElement("div");
    sideHeader.className = "s-header";
    sideHeader.innerHTML = `Side ${s} Lv70`;

    let currEnemy = versionEnemies[s - 1];
    let currEnemyID = currEnemy.id;
    let currEnemyType = currEnemy.type;
    let currEnemyData = enemyData[currEnemyID];

    /* add side HP multiplier */
    let hpMult = document.createElement("div");
    hpMult.className = "s-hp-daze-anom-mult";
    hpMult.innerHTML = `HP: <span style="color:#ff5555;">${currEnemy.mult}%</span> | Daze: <span style="color:#ffe599;">${versionDazeMult}%</span> | Anom: <span style="color:#7756c6;">${versionAnomMult}%</span>`;
    sideHeader.appendChild(hpMult);
    side.appendChild(sideHeader);

    /* define current enemy's parameters */
    let eTags = currEnemyData.tags;
    let eMods = currEnemyData.mods;
    let showEnemySpoilers = spoilersToggle.checked || !eTags.includes("spoiler");
    let eName = showEnemySpoilers ? currEnemyData.name : "SPOILER BOSS";
    let eImg = showEnemySpoilers ? `../assets/enemies/${currEnemyData.image}.webp` : `../assets/enemies/doppelganger-i.webp`;

    /* define current enemy's various stats */
    let eHP = Math.floor(8.74 * currEnemyData.baseHP[currEnemyType] * 24795 * currEnemy.mult / 10000);
    let eDef = currEnemyData.baseDef * 1588 / 100;
    let eDaze = currEnemyData.baseDaze[currEnemyType] * 2.35 * (currEnemyID == "24300" ? 0.8 : 1);
    let eStunMult = currEnemyData.stunMult;
    let eStunTime = currEnemyData.stunTime;
    let eAnom = currEnemyData.baseAnom;
    let eElementMult = currEnemyData.elementMult;

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

      let eHPNew = eHP;
      let color = "#ffffff";

      if (eTags.includes("ucc")) {
        eHPNew -= eHP * 0.036;
        color = "#ca9a00";
        ttHP.innerHTML += instant(color, "IMPAIRED!!", 3) + ` on<br>legs, 3 time(s) on core<br>`;
      }
      if (eTags.includes("hunter")) {
        eHPNew -= eHP * 0.01;
        color = "#ca9a00";
        ttHP.innerHTML += instant(color, "IMPAIRED!!", 1) + `<br>`;
      }
      if (eTags.includes("miasma")) {
        eHPNew -= eHP * (currEnemyID == "25300" ? 0.045 : (versionNum >= 19 ? 0.025 : 0.03));
        color = "#b4317b";
        ttHP.innerHTML += instant(color, "PURIFIED!!", currEnemyID == "25300" ? 3 : 1) + `<br>`;
      }
      if (eTags.includes("shutdown")) {
        eHPNew -= eHP * (currEnemyID == "26300" ? 0.03 : 0.015);
        color = "#b47ede";
        ttHP.innerHTML += instant(color, "SHUTDOWN!!", (currEnemyID == "26300" ? 2 : 1)) + `<br>`;
      }
      ttHP.innerHTML = alt(color, currEnemyID == "25300" ? (eName.slice(0, 21) + "<br>" + eName.slice(21)) : eName, eHPNew, eHP) + ttHP.innerHTML;
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
    ttMiscStat.innerHTML = `+</span><span class="tt-text">${generateEnemyStats(eDaze, eStunMult, eStunTime, versionAnomMult / 100 * eAnom, eElementMult, eMods)}</span>`;
    enemy.appendChild(ttMiscStat);

    side.appendChild(enemy);

    /* add enemy stage description */
    let stageDesc = document.createElement("div");
    stageDesc.className = "esd";
    stageDesc.innerHTML = eTags.includes("spoiler") && !spoilersToggle.checked ? `${currEnemyData.spoilerDesc}` : `${currEnemyData.desc[currEnemyType]}<br><br>`;
    stageDesc.innerHTML += (currEnemyID == "14301" && versionNum == 6) ? `• Successfully triggering <span style='font-weight:bold;'>Perfect Assist</span> grants <span style='color:#ffaf2c;font-weight:bold;'>300 Performance Points</span>. A maximum of 5000 Performance Points can be obtained.` : (eTags.includes("spoiler") && !spoilersToggle.checked ? `${currEnemyData.spoilerPerf}` : `${currEnemyData.perf[currEnemyType]}`);
    stageDesc.innerHTML += `${(currEnemyID[0] == '2' || (currEnemyID == "14303" && versionNum >= 4)) ? `<br><br>${currEnemyData.misc}` : ``}`;
    side.appendChild(stageDesc);
  }

  /* add raw + alt HP display */
  document.getElementById("v-hp-raw-20000").innerHTML = numberFormat(hpData[0][versionNum - 1]);
  document.getElementById("v-hp-raw-60000").innerHTML = numberFormat(hpData[1][versionNum - 1]);
  document.getElementById("v-hp-alt-20000").innerHTML = numberFormat(hpData[2][versionNum - 1]);
  document.getElementById("v-hp-alt-60000").innerHTML = numberFormat(hpData[3][versionNum - 1]);

  /* save current page + settings */
  saveProgress();
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
  let wkCnt = resCnt = 0;
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
function alt(color, name, hpNew, hp) {
  return `<span style="color:${color};">✦</span><span class="tt-text">
          <span style="font-weight:bold;text-decoration:underline;">${name}</span><br>
          <span style="color:#f6b26b;font-weight:bold;">Alt HP</span>: <span style="color:${color};font-weight:bold;">${numberFormat(Math.ceil(hpNew))}</span><br>
          <span style="font-weight:bold;">(assume ${Math.round(hpNew / hp * 1000) / 10}% of HP)</span><br><br>`;
}
function instant(color, type, cnt) { return `<span style="font-weight:bold;"><span style="color:${color};">${type}</span></span> ${cnt} time(s)</span>`; }

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
/* !!!!!!!!!!!!!!!!!! DEFAULT TO LATEST DA !!!!!!!!!!!!!!!!!! */
function loadSavedState() {
  if (localStorage.getItem("leaksEnabled") == "true") leaksToggle.checked = true;
  if (localStorage.getItem("spoilersEnabled") == "true") spoilersToggle.checked = true;
  versionNum = parseInt(localStorage.getItem("lastDAVersion") || `${cntNoLeaks}`);
  chartScoreNum = localStorage.getItem("lastDAChartScore") || "60k";
  currNumberFormat = localStorage.getItem("numberFormat") || "period";
  if (!leaksToggle.checked) versionNum = Math.min(versionNum, cntNoLeaks);
  saveProgress();
}

/* save current page location + settings */
function saveProgress() {
  localStorage.setItem("lastDAVersion", versionNum);
  localStorage.setItem("lastDAChartScore", chartScoreNum);
  localStorage.setItem("numberFormat", currNumberFormat);
  localStorage.setItem("leaksEnabled", leaksToggle.checked);
  localStorage.setItem("spoilersEnabled", spoilersToggle.checked);
}

/* keyboard shortcuts to navigate main page */
document.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key == "Escape") { e.preventDefault(); calcIsOpen ? toggleCalc() : chartIsOpen ? toggleChart() : versionSelectorIsOpen ? toggleVersionSelector() : toggleMenu(); }
  else if (e.key == " " && !calcIsOpen && !chartIsOpen && !menuIsOpen) { e.preventDefault(); toggleVersionSelector(); }
  else if (e.key == "Backspace" && !calcIsOpen && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); toggleChart(); }
  else if (e.key == "=" && !chartIsOpen && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); toggleCalc(); }
  else if (e.key == "ArrowLeft" && !calcIsOpen && !chartIsOpen && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeVersion(-1); }
  else if (e.key == "ArrowRight" && !calcIsOpen && !chartIsOpen && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeVersion(1); }
  else if (e.key == "ArrowUp") { e.preventDefault(); }
  else if (e.key == "ArrowDown") { e.preventDefault(); }
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
  gridContent.innerHTML = ``;

  /* loop enabled versions to add it to the selector */
  for (let v = 1; v <= (leaksToggle.checked ? versionIDs.length : cntNoLeaks); ++v) {
    let currVersion = versionData[versionIDs[v - 1]];

    /* create a new version selection button */
    let versionButton = document.createElement("div");
    let nameDiv = document.createElement("div");
    let timeDiv = document.createElement("div");
    versionButton.className = "vg-c";
    nameDiv.className = "vg-c-name";
    timeDiv.className = "vg-c-time";
    nameDiv.innerHTML = currVersion.versionName + (v == cntNoLeaks ? `<span style='color:#ff0000;font-weight:bold;'> (LIVE)</span>` : ``);
    timeDiv.innerHTML = currVersion.versionTime;
    versionButton.appendChild(nameDiv);
    versionButton.appendChild(timeDiv);

    /* make it clickable, and if clicked go to that version */
    versionButton.onclick = () => {
      versionNum = v;
      toggleVersionSelector();
      showVersion();
    };

    gridContent.appendChild(versionButton);
  }
}

/* -------------------------------------------------------------------------- CALCULATOR -------------------------------------------------------------------- */

function toggleCalc() {
  let calc = document.getElementById("cc");
  let calcOverlay = document.getElementById("cc-o");
  let fixedCalcButton = document.getElementById("open-mb-btn");

  /* enables/disables calculator */
  if (calcIsOpen) {
    document.body.classList.remove("no-scroll");
    calc.style.display = "none";
    calcOverlay.style.display = "none";
    fixedCalcButton.style.display = "none";
  }
  else {
    document.body.classList.add("no-scroll");
    calc.style.display = "block";
    calcOverlay.style.display = "block";
    fixedCalcButton.style.display = "block";
  }

  /* put boss options into a dropdown */
  let enemyIDs = Object.keys(enemyData);
  let select = document.getElementById("b-dd");
  select.innerHTML = ``;
  for (let i = 0; i < enemyIDs.length; ++i) {
    if (enemyIDs[i][2] == '3' && enemyIDs[i] != "10301" && enemyIDs[i] != "10302" && enemyIDs[i] != "10303" && enemyIDs[i] != "16300") {
      let option = document.createElement("option");
      option.text = (spoilersToggle.checked || !enemyData[enemyIDs[i]].tags.includes("spoiler")) ? enemyData[enemyIDs[i]].name : "SPOILER BOSS";
      option.value = enemyIDs[i];
      select.appendChild(option);
    }
  }

  calcIsOpen = !calcIsOpen;
  changeBoss();
}

/* specific boss hp/score display */
function changeBoss() {
  let bossDropdownResize = document.getElementById("b-dd-resize");

  /* change display image to selected boss */
  let bImg = document.getElementById("cc-b-img");
  bImg.src = (spoilersToggle.checked || !enemyData[bossDropdown.value].tags.includes("spoiler")) ? `../assets/enemies/${enemyData[bossDropdown.value].image}.webp` : `../assets/enemies/doppelganger-i.webp`;;
  
  /* resize boss dropdown based off of name length (to look nicer) */
  if (bossDropdown.selectedIndex == -1) bossDropdown.selectedIndex = 0;
  bossDropdownResize.textContent = bossDropdown.options[bossDropdown.selectedIndex].text;
  bossDropdown.style.width = bossDropdownResize.offsetWidth + 30 + "px";

  /* compile all version appearances in into both dropdowns */
  bossVerDropdown1.innerHTML = ``, bossVerDropdown2.innerHTML = ``;
  for (let v = 0; v < specificHPData[bossDropdown.value].length; ++v) {
    let option1 = document.createElement("option"), option2 = document.createElement("option");
    let verHP = specificHPData[bossDropdown.value][v][0];
    option1.text = option1.value = `${verHP[0]}.${verHP[2]} Version ${verHP[4]}`;
    option2.text = option2.value = `${verHP[0]}.${verHP[2]} Version ${verHP[4]}`;
    bossVerDropdown1.appendChild(option1);
    bossVerDropdown2.appendChild(option2);
  }

  /* set current boss data to first version values */
  currCalcBossID = bossDropdown.value;
  currCalcData1 = specificHPData[currCalcBossID][bossVerDropdown1.selectedIndex];
  currCalcData2 = specificHPData[currCalcBossID][bossVerDropdown2.selectedIndex];
  currCalcVersion1 = currCalcData1[0];
  currCalcVersion2 = currCalcData2[0];
  currCalcMaxBossHP1 = currCalcData1[1];
  currCalcMaxBossHP2 = currCalcData2[1];

  /* fill in 100% hp and 60000 score into the input boxes */
  bossHPCalc1.value = currCalcMaxBossHP1;
  bossHPCalc2.value = currCalcMaxBossHP2;
  bossScoreCalc1.value = bossScoreCalc2.value = 60000;
  calculateBoss(currCalcMaxBossHP1, 60000, 1);
  calculateBoss(currCalcMaxBossHP2, 60000, 2);
}

/* shows new specific boss/version on edit */
bossDropdown.addEventListener("change", () => { changeBoss(); });
bossVerDropdown1.addEventListener("change", () => {
  currCalcData1 = specificHPData[currCalcBossID][bossVerDropdown1.selectedIndex];
  currCalcVersion1 = currCalcData1[0];
  currCalcMaxBossHP1 = currCalcData1[1];
  calculateBoss(currCalcMaxBossHP1, 60000, 1);
});
bossVerDropdown2.addEventListener("change", () => {
  currCalcData2 = specificHPData[currCalcBossID][bossVerDropdown2.selectedIndex];
  currCalcVersion2 = currCalcData2[0];
  currCalcMaxBossHP2 = currCalcData2[1];
  calculateBoss(currCalcMaxBossHP2, 60000, 2);
});

/* runs new calculation for boss hp/score on edit */
bossHPCalc1.addEventListener("change", () => { calculateBoss(parseInt(bossHPCalc1.value.replaceAll(".", "").replaceAll(",", "")), 60000, 1); });
bossHPCalc2.addEventListener("change", () => { calculateBoss(parseInt(bossHPCalc2.value.replaceAll(".", "").replaceAll(",", "")), 60000, 2); });
bossScoreCalc1.addEventListener("change", () => { calculateBoss(currCalcMaxBossHP1, parseInt(bossScoreCalc1.value), 1); });
bossScoreCalc2.addEventListener("change", () => { calculateBoss(currCalcMaxBossHP2, parseInt(bossScoreCalc2.value), 2); });

/* calculate new boss hp/score and display in input boxes */
function calculateBoss(hp, score, option) {
  let finalHP = option == 1 ? currCalcMaxBossHP1 : currCalcMaxBossHP2, finalScore = 60000;
  let bossHP = option == 1 ? bossHPCalc1 : bossHPCalc2;
  let bossScore = option == 1 ? bossScoreCalc1 : bossScoreCalc2;
  let bossData = option == 1 ? currCalcData1 : currCalcData2;

  if (!Number.isInteger(hp) || !Number.isInteger(score)) { bossHP.value = ""; bossScore.value = ""; return; }

  /* limits hp and score within the bounds of 0-maxHP and 0-60000 */
  if (hp < 0) hp = 0;
  else if (option == 1 && hp > currCalcMaxBossHP1) hp = currCalcMaxBossHP1;
  else if (option == 2 && hp > currCalcMaxBossHP2) hp = currCalcMaxBossHP2;
  if (score < 0) score = 0;
  else if (score > 60000) score = 60000;

  let bossValues = Array.from({length: 7}, () => Array.from({length: 3}).fill(null));
  bossValues = [[0, 0, 0], [1200, 4, 4000], [1700, 4, 4800], [2200, 4, 7200], [2500, 4, 9600], [3000, 4, 10400], [5000, 3, 7800], [5000, 6, 16200]];

  /* calculate both hp/score to the floor threshold */
  let calcHP = 0, calcScore = 0, thres;
  for (thres = 0; thres < 8; ++thres) {
    let hpToNextThreshold = bossValues[thres][0] * bossValues[thres][1] * bossData[1] / (874 * 100);
    let scoreToNextThreshold = bossValues[thres][2];
    if (calcHP + hpToNextThreshold > hp + 1) break;
    if (calcScore + scoreToNextThreshold > score) break;
    calcHP += hpToNextThreshold;
    calcScore += scoreToNextThreshold;
  }

  /* adds on last needed reamining hp/score to fit the parameters */
  if (thres < 8) {
    let hpToNextThreshold = bossValues[thres][0] * bossValues[thres][1] * bossData[1] / (874 * 100);
    let scoreToNextThreshold = bossValues[thres][2];
    finalHP = calcHP + (score - calcScore) / scoreToNextThreshold * hpToNextThreshold;
    finalScore = calcScore + (hp - calcHP) / hpToNextThreshold * bossValues[thres][2];
  }

  /* set input boxes to their respective calculated hp/score values */
  bossHP.value = numberFormat(score != 60000 ? Math.floor(finalHP) : hp);
  bossScore.value = score != 60000 ? score : Math.floor(finalScore);
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
  saveProgress();
  displayHPChart();
}

/* download the chart with the middle button in the chart top bar */
function downloadChart() {
  let downloadButton = document.createElement("a");
  downloadButton.href = hpChart.toBase64Image("image/png", 1.0);
  downloadButton.download = `Deadly Assault HP (${chartScoreNum})`;
  downloadButton.click();
}

/* format 3 hp dataset */
function createHPDataset(label, data, color) {
  return { label, data, pointRadius: 2, borderWidth: 2, borderColor: color, pointHoverRadius: 4, pointHoverBorderWidth: 2, pointHoverBorderColor: color, backgroundColor: "#ffffff" };
}

function displayHPChart() {
  /* change color of selected score value */
  let chartScoreButtons = document.querySelectorAll(".c-k");
  chartScoreButtons.forEach(btn => btn.classList.toggle("selected", btn.dataset.format == chartScoreNum));

  /* various plugins thanks to Chart.js documentation + videos + Stack Overflow */
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
            grid: { color: function(context) { return context.tick.value % 40000000 == 0 ? "#888888" : "#444444"; } },
            ticks: {
              padding: 15, font: { family: "Inconsolata", size: 12 }, color: "#888888", 
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
  hpChart.data.labels = versionIDs;
  hpChart.data.datasets = [
    createHPDataset(`Raw HP`, chartScoreNum == "20k" ? hpData[0] : hpData[1], "#e06666"),
    createHPDataset(`Alt HP`, chartScoreNum == "20k" ? hpData[2] : hpData[3], "#f6b26b")
  ];
  hpChart.options.scales.y.min = chartScoreNum == "20k" ? 40000000 : 120000000;
  hpChart.options.scales.y.max = chartScoreNum == "20k" ? 200000000 : 600000000;
  hpChart.options.scales.y.ticks.stepSize = chartScoreNum == "20k" ? 10000000 : 30000000;
  hpChart.options.plugins.title.text = `Deadly Assault HP (${chartScoreNum})`;
  hpChart.update();
  saveProgress();
}

/* ----------------------------------------------------------------------------- MAIN ----------------------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", async () => { await loadDeadlyPage(); });