/* ------------------------------------------------------------------------ MAIN PAGE ----------------------------------------------------------------------- */

let vLive = 38, vBeta = 39, v22 = 19, v28 = 35;
let leaksToggle = document.getElementById("lks")
let spoilersToggle = document.getElementById("spl");
let bossDropdown = document.getElementById("cc-b-dd");
let bossVerDropdown1 = document.getElementById("cc-b-v-dd1"), bossScoreCalc1 = document.getElementById("cc-b-score1"), bossHPCalc1 = document.getElementById("cc-b-hp1");
let bossVerDropdown2 = document.getElementById("cc-b-v-dd2"), bossScoreCalc2 = document.getElementById("cc-b-score2"), bossHPCalc2 = document.getElementById("cc-b-hp2");
let versionNum, chartScoreNum, currCalcBossID, currCalcData1, currCalcData2, currCalcVersion1, currCalcVersion2, currCalcMaxBossHP1, currCalcMaxBossHP2, currNumberFormat;
let menuIsOpen = versionSelectorIsOpen = calcIsOpen = chartIsOpen = false;

let versionData, enemyData, buffData, hpChart;
let versionBuffIDs, versionHPMult, versionDazeMult, versionAnomMult, versionEnemies;
let versionIDs = [], hpData = [], hpDataSpecific = Object.create(null);
let elementsData = ["ice", "fire", "electric", "ether", "physical", "wind"];

// build & display main page
async function loadPage() {
  versionData = await (await fetch("da-versions.json")).json();
  enemyData = await (await fetch("../../assets/zzz/enemies.json")).json();
  buffData = await (await fetch("../../assets/zzz/buffs.json")).json();
  versionIDs = Object.keys(versionData);
  loadHPData();
  loadSavedState();
  showVersion();
  changeNumberFormat();
}

// build hp database
function loadHPData() {
  hpData = Array.from({length: 4}, () => Array.from({length: versionIDs.length}).fill(null));
  for (let v = 1; v <= versionIDs.length; ++v) {
    let versionEnemies = versionData[versionIDs[v - 1]].versionEnemies;
    let raw60kEnemyHP = alt60kEnemyHP = 0;

    // build boss hp database
    for (let s = 1; s <= 3; ++s) {
      let sideHPMult = versionData[versionIDs[v - 1]].versionHPMult[s - 1];

      let currEnemy = versionEnemies[s - 1];
      let currEnemyID = currEnemy.id;
      let currEnemyType = currEnemy.type;
      let currEnemyHPMult = currEnemy.hpMult ? currEnemy.hpMult : sideHPMult;
      let currEnemyData = enemyData[currEnemyID];
      let eHP = currEnemyData.baseHP[currEnemyType] * 24795 * currEnemyHPMult * 8.74 / 10000;
      let eTags = currEnemyData.tags;

      // calculate boss hp
      raw60kEnemyHP += eHP;
      alt60kEnemyHP += eHP * (currEnemyID[2] >= "2" && currEnemyData.baseDEF[currEnemyType] < 60 ? (794 + currEnemyData.baseDEF[currEnemyType] * 1588 / 100) / (794 + 60 * 1588 / 100) : 1);
      if (eTags.length >= 1 && !(eTags.length == 1 && eTags.includes("spoiler"))) {
        if (eTags.includes("ucc")) alt60kEnemyHP -= eHP * 0.036;
        if (eTags.includes("hunter")) alt60kEnemyHP -= eHP * 0.01;
        if (eTags.includes("miasma")) alt60kEnemyHP -= eHP * (currEnemyID == "25300" ? 0.045 : (v >= v22 ? 0.025 : 0.03));
        if (eTags.includes("shutdown")) alt60kEnemyHP -= eHP * (currEnemyID == "28300" ? 0.02 : currEnemyID == "27300" ? 0.025 : currEnemyID == "26300" ? 0.04 : 0.015);
        if (eTags.includes("convert")) alt60kEnemyHP += eHP * (currEnemyID == "30300" ? 0.045 : 0.003);
      }

      // add boss appearance to boss hp map
      if (!hpDataSpecific[currEnemyID]) hpDataSpecific[currEnemyID] = [];
      hpDataSpecific[currEnemyID].push([versionIDs[v - 1], Math.round(eHP)]);
    }
    hpData[0][v - 1] = Math.round(raw60kEnemyHP * 0.281083138);
    hpData[1][v - 1] = Math.round(raw60kEnemyHP);
    hpData[2][v - 1] = Math.round(alt60kEnemyHP * 0.281083138);
    hpData[3][v - 1] = Math.round(alt60kEnemyHP);
  }
}

// display version/time/id
function showVersion() {
  let currVersion = versionData[versionIDs[versionNum - 1]];
  versionBuffIDs = currVersion.versionBuffIDs;
  versionHPMult = currVersion.versionHPMult;
  versionDazeMult = currVersion.versionDazeMult;
  versionAnomMult = currVersion.versionAnomMult;
  versionEnemies = currVersion.versionEnemies;
  document.getElementById("v-name").innerHTML = currVersion.versionName + (versionNum == vLive ? `<span style="color:#ff0000;font-weight:bold;"> (LIVE)</span>` : versionNum >= vBeta ? `<span style="color:#52a9f7;font-weight:bold;"> (BETA)</span>` : ``);
  document.getElementById("v-time").innerHTML = currVersion.versionTime;
  document.getElementById("v-id").innerHTML = `ID: 69${versionNum.toString().padStart(3, `0`)}${versionNum >= vBeta ? `1` : ``}`;
  showBuffs();
  showEnemies();
}
function changeVersion(n) {
  let maxVersion = leaksToggle.checked ? versionIDs.length : vLive;
  versionNum = (versionNum - 1 + n + maxVersion) % maxVersion + 1;
  showVersion();
}

// display buffs
function showBuffs() {
  for (let buff = 1; buff <= versionBuffIDs.length; ++buff) {
    let b = document.getElementById(`b${buff}`);
    let buffImg = document.createElement("img");
    let buffName = document.createElement("div");
    let buffDesc = document.createElement("div");
    buffImg.className = "b-img";
    buffName.className = "b-name";
    buffDesc.className = "bt-desc";
    b.innerHTML = ``;
    buffImg.src = `../../assets/zzz/buffs/${buffData[versionBuffIDs[buff - 1]][1]}.webp`;
    buffName.innerHTML = buffData[versionBuffIDs[buff - 1]][0];
    buffDesc.innerHTML = buffData[versionBuffIDs[buff - 1]][2];
    b.appendChild(buffImg);
    b.appendChild(buffName);
    b.appendChild(buffDesc);
  }
}

// display enemies
function showEnemies() {
  // display sides
  let side1 = document.getElementById("s1"), side2 = document.getElementById("s2"), side3 = document.getElementById("s3");
  side1.innerHTML = side2.innerHTML = side3.innerHTML = ``;

  // loop sides
  for (let s = 1; s <= versionEnemies.length; ++s) {
    let side = s == 1 ? side1 : s == 2 ? side2 : side3;

    // display side title
    let sideHeader = document.createElement("div");
    sideHeader.className = "s-header";
    sideHeader.innerHTML = `Side ${s} Lv70`;

    // display side HP multiplier
    let hpMult = document.createElement("div");
    let sideHPMult = versionHPMult[s - 1], sideDazeMult = versionDazeMult[s - 1];
    hpMult.className = "s-hp-daze-anom-mult";
    hpMult.innerHTML = `HP: <span style="color:#ff5555;">${sideHPMult}%</span> | Daze: <span style="color:#ffe599;">${sideDazeMult}%</span> | Anom: <span style="color:#7b78ff;">${versionAnomMult}%</span>`;
    sideHeader.appendChild(hpMult);
    side.appendChild(sideHeader);

    // display wave
    let waveEnemies = document.createElement("div");
    waveEnemies.className = "w-e";

    let currEnemy = versionEnemies[s - 1];
    let currEnemyID = currEnemy.id;
    let currEnemyType = currEnemy.type;
    let currEnemyHPMult = currEnemy.hpMult ? currEnemy.hpMult : sideHPMult;
    let currEnemyData = enemyData[currEnemyID];

    // define enemy parameters
    let eTags = currEnemyData.tags;
    let eMods = currEnemyData.mods;
    let showEnemySpoilers = spoilersToggle.checked || !eTags.includes("spoiler");
    let eName = showEnemySpoilers ? currEnemyData.name : "SPOILER BOSS";
    let eImg = showEnemySpoilers ? `../../assets/zzz/enemies/${currEnemyData.image}.webp` : `../../assets/zzz/enemies/doppelganger-i.webp`;

    // define enemy stats
    let eHP = Math.floor(8.74 * sideHPMult * currEnemyData.baseHP[currEnemyType] * 24795 / 10000);
    let eDEF = Math.ceil(currEnemyData.baseDEF[currEnemyType] * 1588 / 100);
    let eDaze = currEnemyData.baseDaze[currEnemyType] * 2.35;
    let eStunMult = currEnemyData.stunMult;
    let eStunTime = currEnemyData.stunTime;
    let eAnom = currEnemyData.baseAnom;
    let eElementMult = currEnemyData.elementMult;

    // display enemy
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

    // display enemy weaknesses/resistances
    let enemyWR = document.createElement("div");
    enemyWR.className = "wr";
    generateWR(eElementMult, enemyWR, currEnemyID);
    enemy.appendChild(enemyWR);

    // display enemy hp
    let hp = document.createElement("div");
    let enemyHP = document.createElement("div");
    hp.className = "hp";
    enemyHP.className = "e-hp";
    enemyHP.innerHTML = showNumberFormat(eHP);
    hp.appendChild(enemyHP);

    // display special enemy tooltip
    if (eTags.length >= 1 && !(eTags.length == 1 && eTags.includes("spoiler"))) {
      let ttHP = document.createElement("div");
      ttHP.className = "tt-e-hp";

      let lowDEF = currEnemyID[2] >= "2" && currEnemyData.baseDEF[currEnemyType] < 60;
      let eHPNew = eHP * (lowDEF ? (794 + currEnemyData.baseDEF[currEnemyType] * 1588 / 100) / (794 + 60 * 1588 / 100) : 1);
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
        eHPNew -= eHP * (currEnemyID == "25300" ? 0.045 : (versionNum >= v22 ? 0.025 : 0.03));
        color = "#b4317b";
        ttHP.innerHTML += instant(color, "PURIFIED!!", currEnemyID == "25300" ? 3 : 1) + `<br>`;
      }
      if (eTags.includes("shutdown")) {
        eHPNew -= eHP * (currEnemyID == "28300" ? 0.02 : currEnemyID == "27300" ? 0.025 : currEnemyID == "26300" ? 0.04 : 0.015);
        color = "#b47ede";
        ttHP.innerHTML += instant(color, "SHUTDOWN!!", currEnemyID == "26300" ? 2 : 1) + `<br>`;
      }
      if (eTags.includes("convert")) {
        eHPNew += eHP * (currEnemyID == "30300" ? 0.045 : 0.003);
        color = "#007bb8";
        ttHP.innerHTML += instant(color, "CONVERT!!", 1) + `<br>`;
      }

      // display tooltip text
      ttHP.innerHTML = alt(color, eName, eHPNew, eHP, lowDEF) + ttHP.innerHTML;
      hp.appendChild(ttHP);
    }

    // display enemy specific hp multiplier
    if (sideHPMult != currEnemyHPMult) {
      let specificHPMult = document.createElement("div");
      specificHPMult.className = "e-hp-mult";
      specificHPMult.innerHTML = `[${currEnemyHPMult}%]`;
      hp.appendChild(specificHPMult);
    }
    enemy.appendChild(hp);

    // display enemy def
    let enemyDEF = document.createElement("div");
    enemyDEF.className = "e-def";
    enemyDEF.innerHTML = eDEF;
    enemy.appendChild(enemyDEF);

    // display enemy misc stats
    let ttMiscStat = document.createElement("div");
    ttMiscStat.className = "tt-e-stat";
    ttMiscStat.innerHTML = `+<span class="tt-text">${generateEnemyStats(sideDazeMult / 100 * eDaze, eStunMult, eStunTime, versionAnomMult / 100 * eAnom, eElementMult, eMods)}</span>`;
    enemy.appendChild(ttMiscStat);

    // display enemy 40%+ resistances
    let enemyR = document.createElement("div");
    enemyR.className = "res-40plus";
    generateR(eElementMult, enemyR, currEnemyID, enemy);

    waveEnemies.appendChild(enemy);

    // add enemy stage description
    let trait = document.createElement("div");
    let traitTitle = document.createElement("div");
    let traitDesc = document.createElement("div");
    trait.className = "t";
    traitTitle.className = "t-title";
    traitDesc.className = "bt-desc";
    traitTitle.innerHTML = `Side ${s} Boss Traits`;
    trait.appendChild(traitTitle);
    traitDesc.innerHTML = eTags.includes("spoiler") && !spoilersToggle.checked ? `${currEnemyData.spoilerDesc}<br>` : `${currEnemyData.desc[currEnemyType]}<br>`;
    traitDesc.innerHTML += (currEnemyID == "14301" && versionNum == 6) ? `• Successfully triggering <span style="font-weight:bold;">Perfect Assist</span> grants <span style="color:#ffaf2c;font-weight:bold;">300 Performance Points</span>. A maximum of 5000 Performance Points can be obtained.` : (eTags.includes("spoiler") && !spoilersToggle.checked ? `${currEnemyData.spoilerPerf}` : `${currEnemyData.perf[currEnemyType]}`);
    traitDesc.innerHTML += `${(currEnemyID[0] >= "2" || (currEnemyID == "14303" && versionNum >= 4)) ? `<br>${currEnemyData.misc}` : ``}`;
    trait.appendChild(traitDesc);

    side.appendChild(waveEnemies);
    side.appendChild(trait);
  }

  // display HP values
  document.getElementById("v-hp-raw-20000").innerHTML = showNumberFormat(hpData[0][versionNum - 1]);
  document.getElementById("v-hp-raw-60000").innerHTML = showNumberFormat(hpData[1][versionNum - 1]);
  document.getElementById("v-hp-alt-20000").innerHTML = showNumberFormat(hpData[2][versionNum - 1]);
  document.getElementById("v-hp-alt-60000").innerHTML = showNumberFormat(hpData[3][versionNum - 1]);

  // save current page/settings
  saveProgress();
}

/* -------------------------------------------------------------------- INFO GENERATOR -------------------------------------------------------------------- */

// display weaknesses/resistances
function generateWR(mult, wr, id) {
  let weakImg1 = document.createElement("img");
  let weakImg2 = document.createElement("img");
  let resImg1 = document.createElement("img");
  let resImg2 = document.createElement("img");
  weakImg1.className = weakImg2.className = "wk";
  resImg1.className = resImg2.className = "res";
  weakImg1.src = weakImg2.src = "../../assets/zzz/elements/none.webp";
  resImg1.src = resImg2.src = "../../assets/zzz/elements/none.webp";
  let wkCnt = resCnt = 0;
  for (let e = 0; e < elementsData.length - (versionNum < v28); ++e) {
    if (mult[e] < 1) { (wkCnt == 0 ? weakImg1 : weakImg2).src = `../../assets/zzz/elements/${elementsData[e]}.webp`; ++wkCnt;}
    else if (mult[e] > 1) { (resCnt == 0 ? resImg1 : resImg2).src = `../../assets/zzz/elements/${elementsData[e]}.webp`; ++resCnt; }
  }
  wr.appendChild(weakImg1);
  if (versionNum >= v28 && id == "24300") {
    let weakImg3 = document.createElement("img");
    weakImg3.className = "wk";
    weakImg3.src = "../../assets/zzz/elements/physical.webp";
    wr.appendChild(weakImg3);
  }
  wr.appendChild(weakImg2);
  wr.appendChild(resImg1);
  wr.appendChild(resImg2);
}

// display 40%+ resistances
function generateR(mult, r, id, enemy) {
  let hasRES = false;
  let bossRES = document.createElement("div");
  let resEle = document.createElement("div");
  bossRES.className = "e-res-title";
  resEle.className = "e-res-ele";
  bossRES.innerHTML = "Boss DMG RES";

  for (let e = 0; e < elementsData.length - (versionNum < v28); ++e) {
    if (mult[e] > 1.2) {
      hasRES = true;
      let res = document.createElement("div");
      let resImg = document.createElement("img");
      let resMult = document.createElement("div");
      res.className = "e-res";
      resImg.className = "res";
      resMult.className = "e-res-mult";
      resImg.style.borderWidth = "0px";
      resImg.src = `../../assets/zzz/elements/${elementsData[e]}.webp`;
      resMult.innerHTML = `${Math.round(mult[e] * 100) - 100}%`;
      res.appendChild(resImg);
      res.appendChild(resMult);
      resEle.appendChild(res);
    }
  }

  // display only for bosses
  if (id[2] >= "2" && hasRES) { r.appendChild(bossRES); r.appendChild(resEle); enemy.appendChild(r); }
}

// display special tooltip
function alt(color, name, hpNew, hp, def) {
  return `<span style="color:${color};">✦</span><span class="tt-text">
          <span style="font-weight:bold;text-decoration:underline;">${name}</span><br>
          <span style="color:#f6b26b;font-weight:bold;">Alt HP</span>: <span style="color:${color};font-weight:bold;">${showNumberFormat(Math.ceil(hpNew))}</span><br>
          <span style="font-weight:bold;">(${def ? `normalized → ` : ``}${Math.round(hpNew / hp * 1000) / 10}% of Base HP)</span><br><br>`;
}
function instant(color, type, cnt) { return `<span style="font-weight:bold;"><span style="color:${color};">${type}</span></span> ${cnt} time(s)</span>`; }

// display misc stats
function generateEnemyStats(daze, stun, time, anom, dmg, mods) {
  let anomMult = [1, 1, 1, 1, 1.2, 0.5];
  let color = ["#98eff0", "#ff5521", "#2eb6ff", "#fe437e", "#f0d12b", "#a6c5fd"];
  let stats = `<span style="font-weight:bold;">Max Daze: <span style="color:#ffe599;">${Math.round(daze * 10000) / 10000}</span></span><br>
              (<span style="color:#ffe599;font-weight:bold;">${stun}%</span> DMG for <span style="color:#ffe599;font-weight:bold;">${time}s</span>)<br><br>`;
  if (mods.includes("no-anom")) return stats + `<span style="font-weight:bold;">IMMUNE TO ANOMALY</span>`;
  else {
    stats += `<span style="font-weight:bold;">Min Anomaly Buildup:</span><br>`;
    for (let i = 0; i < elementsData.length - (versionNum < v28); ++i) stats += `<span style="color:${color[i]};font-weight:bold;">${Math.round(anom * anomMult[i] * (1 / (2 - Math.min(dmg[i], 1.2))) * 100) / 100}</span>/`;
    stats = stats.slice(0, -1) + `<br>${mods.includes("no-freeze") ? `<span style="color:#98eff0;font-weight:bold;">UNFREEZABLE</span>` : ``}`;
  }
  return stats;
}

/* ------------------------------------------------------------ MISCELLANEOUS + QOL + NAVIGATION ------------------------------------------------------------ */

// load last page/settings
// !!!!!!!!!!!!!!!!!! DEFAULT TO LATEST DA !!!!!!!!!!!!!!!!!!
function loadSavedState() {
  if (localStorage.getItem("leaksEnabled") == "true") leaksToggle.checked = true;
  if (localStorage.getItem("spoilersEnabled") == "true") spoilersToggle.checked = true;
  versionNum = parseInt(localStorage.getItem("lastDAVersion") || `${vLive}`);
  chartScoreNum = localStorage.getItem("lastDAChartType") || "60k";
  currNumberFormat = localStorage.getItem("numberFormat") || "period";
  if (!leaksToggle.checked) versionNum = Math.min(versionNum, vLive);
  saveProgress();
}

// save current page/settings
function saveProgress() {
  localStorage.setItem("lastDAVersion", versionNum);
  localStorage.setItem("lastDAChartType", chartScoreNum);
  localStorage.setItem("numberFormat", currNumberFormat);
  localStorage.setItem("leaksEnabled", leaksToggle.checked);
  localStorage.setItem("spoilersEnabled", spoilersToggle.checked);
}

// go to top of page
function jumpToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

// navigation keyboard shortcuts
document.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key == "Escape") { e.preventDefault(); versionSelectorIsOpen ? toggleVersionSelector() : chartIsOpen ? toggleChart() : calcIsOpen ? toggleCalc() : toggleMenu(); }
  else if (e.key == "`" && !menuIsOpen && !versionSelectorIsOpen && !calcIsOpen) { e.preventDefault(); toggleChart(); }
  else if (e.key == "Tab" && !menuIsOpen && !versionSelectorIsOpen && !chartIsOpen) { e.preventDefault(); toggleCalc(); }
  else if (e.key == "Enter" && !menuIsOpen && !versionSelectorIsOpen && !chartIsOpen && !calcIsOpen) { e.preventDefault(); jumpToTop(); }
  else if (e.key == " " && !menuIsOpen && !chartIsOpen && !calcIsOpen) { e.preventDefault(); toggleVersionSelector(); }
  else if (e.key == "ArrowLeft" && !menuIsOpen && !versionSelectorIsOpen && !chartIsOpen && !calcIsOpen) { e.preventDefault(); changeVersion(-1); }
  else if (e.key == "ArrowRight" && !menuIsOpen && !versionSelectorIsOpen && !chartIsOpen && !calcIsOpen) { e.preventDefault(); changeVersion(1); }
  else if (e.key == "ArrowUp") { e.preventDefault(); }
  else if (e.key == "ArrowDown") { e.preventDefault(); }
});

/* ------------------------------------------------------------------------ MENU BAR ----------------------------------------------------------------------- */

// display/hide menu bar
function toggleMenu() {
  menuIsOpen = !menuIsOpen;
  let menuBar = document.getElementById("mb");
  let menuBarOverlay = document.getElementById("mb-o");
  document.body.style.overflow = menuIsOpen ? "hidden" : "auto";
  menuBar.style.display = menuBarOverlay.style.display = menuIsOpen ? "flex" : "none";
}

// display number format & example: 2222222 2,222,222 2.222.222
function showNumberFormat(num) {
  if (currNumberFormat == "comma") return num.toLocaleString("en-US");
  if (currNumberFormat == "period") return num.toLocaleString("de-DE");
  return num;
}
function changeNumberFormat(e) {
  if (e) currNumberFormat = e.dataset.format;
  let ex = document.getElementById("mb-ex-num");
  let numFormatButtons = document.querySelectorAll(".nfb");
  ex.innerHTML = showNumberFormat(2222222);
  numFormatButtons.forEach(btn => btn.classList.toggle("selected", btn.dataset.format == currNumberFormat));
  showEnemies();
}

// display/hide leaks/spoilers
leaksToggle.addEventListener("change", () => {
  if (!leaksToggle.checked) {
    spoilersToggle.checked = false;
    if (versionNum > vLive) versionNum = vLive;
  }
  showVersion();
});
spoilersToggle.addEventListener("change", () => {
  if (spoilersToggle.checked) leaksToggle.checked = true;
  showEnemies();
});

/* -------------------------------------------------------------------- VERSION SELECTOR -------------------------------------------------------------------- */

// display/hide version selector
function toggleVersionSelector() {
  versionSelectorIsOpen = !versionSelectorIsOpen;
  let versionSelector = document.getElementById("vs");
  let versionSelectorOverlay = document.getElementById("vs-o");
  document.body.style.overflow = versionSelectorIsOpen ? "hidden" : "auto";
  versionSelector.style.display = versionSelectorOverlay.style.display = versionSelectorIsOpen ? "flex" : "none";
  if (versionSelectorIsOpen) showVersionSelector();
}

// display version selector
function showVersionSelector() {
  let gridContent = document.getElementById("vg");
  gridContent.innerHTML = ``;

  // display allowed versions
  for (let v = 1; v <= (leaksToggle.checked ? versionIDs.length : vLive); ++v) {
    let currVersion = versionData[versionIDs[v - 1]];

    // display version selection button
    let versionButton = document.createElement("div");
    let nameDiv = document.createElement("div");
    let timeDiv = document.createElement("div");
    let idDiv = document.createElement("div");
    versionButton.className = "vg-c";
    nameDiv.className = "vg-c-name";
    timeDiv.className = "vg-c-time";
    idDiv.className = "vg-c-id";
    nameDiv.innerHTML = currVersion.versionName + (v == vLive ? `<span style="color:#ff0000;font-weight:bold;"> (LIVE)</span>` : v >= vBeta ? `<span style="color:#52a9f7;font-weight:bold;"> (BETA)</span>` : ``);
    timeDiv.innerHTML = currVersion.versionTime;
    idDiv.innerHTML = `ID: 69${v.toString().padStart(3, `0`)}${v >= vBeta ? `1` : ``}`;
    versionButton.appendChild(nameDiv);
    versionButton.appendChild(timeDiv);
    versionButton.appendChild(idDiv);
    gridContent.appendChild(versionButton);

    // go to version on click
    versionButton.onclick = () => {
      versionNum = v;
      toggleVersionSelector();
      showVersion();
    };
  }
}

/* -------------------------------------------------------------------------- CALCULATOR -------------------------------------------------------------------- */

// display/hide calculator
function toggleCalc() {
  calcIsOpen = !calcIsOpen;
  let calc = document.getElementById("cc");
  let calcOverlay = document.getElementById("cc-o");
  document.body.style.overflow = calcIsOpen ? "hidden" : "auto";
  calc.style.display = calcOverlay.style.display = calcIsOpen ? "flex" : "none";

  // build boss dropdown
  let enemyIDs = Object.keys(enemyData);
  let select = document.getElementById("cc-b-dd");
  select.innerHTML = ``;
  for (let i = 0; i < enemyIDs.length; ++i) {
    if (enemyIDs[i][2] == "3" && enemyIDs[i] != "10301" && enemyIDs[i] != "10302" && enemyIDs[i] != "10303" && enemyIDs[i] != "16300" && enemyIDs[i] != "28301") {
      let option = document.createElement("option");
      option.text = (spoilersToggle.checked || !enemyData[enemyIDs[i]].tags.includes("spoiler")) ? enemyData[enemyIDs[i]].name : "SPOILER BOSS";
      option.value = enemyIDs[i];
      select.appendChild(option);
    }
  }
  changeBoss();
}

// display specific boss
function changeBoss() {
  let bossDropdownResize = document.getElementById("cc-b-dd-resize");

  // display specific boss image
  let bossImg = document.getElementById("cc-b-img");
  bossImg.src = (spoilersToggle.checked || !enemyData[bossDropdown.value].tags.includes("spoiler")) ? `../../assets/zzz/enemies/${enemyData[bossDropdown.value].image}.webp` : `../../assets/zzz/enemies/doppelganger-i.webp`;;

  // resize boss dropdown based on name length (to look nicer)
  bossDropdown.selectedIndex = Math.max(bossDropdown.selectedIndex, 0);
  bossDropdownResize.textContent = bossDropdown.options[bossDropdown.selectedIndex].text;
  bossDropdown.style.width = bossDropdownResize.offsetWidth + 30 + "px";

  // build boss versions dropdowns
  bossVerDropdown1.innerHTML = ``, bossVerDropdown2.innerHTML = ``;
  for (let v = 0; v < hpDataSpecific[bossDropdown.value].length; ++v) {
    let option1 = document.createElement("option"), option2 = document.createElement("option");
    let versionHP = hpDataSpecific[bossDropdown.value][v][0];
    option1.text = option1.value = option2.text = option2.value = `${versionHP[0]}.${versionHP[2]} Phase ${versionHP[4]}`;
    bossVerDropdown1.appendChild(option1);
    bossVerDropdown2.appendChild(option2);
  }

  // display boss first version
  currCalcBossID = bossDropdown.value;
  currCalcData1 = hpDataSpecific[currCalcBossID][bossVerDropdown1.selectedIndex];
  currCalcData2 = hpDataSpecific[currCalcBossID][bossVerDropdown2.selectedIndex];
  currCalcVersion1 = currCalcData1[0];
  currCalcVersion2 = currCalcData2[0];
  currCalcMaxBossHP1 = currCalcData1[1];
  currCalcMaxBossHP2 = currCalcData2[1];

  // display max hp/score
  bossHPCalc1.value = currCalcMaxBossHP1;
  bossHPCalc2.value = currCalcMaxBossHP2;
  bossScoreCalc1.value = bossScoreCalc2.value = 60000;
  calculateBoss(currCalcMaxBossHP1, 60000, 1);
  calculateBoss(currCalcMaxBossHP2, 60000, 2);
}

// display new specific boss/version
bossDropdown.addEventListener("change", () => { changeBoss(); });
bossVerDropdown1.addEventListener("change", () => {
  currCalcData1 = hpDataSpecific[currCalcBossID][bossVerDropdown1.selectedIndex];
  currCalcVersion1 = currCalcData1[0];
  currCalcMaxBossHP1 = currCalcData1[1];
  calculateBoss(currCalcMaxBossHP1, 60000, 1);
});
bossVerDropdown2.addEventListener("change", () => {
  currCalcData2 = hpDataSpecific[currCalcBossID][bossVerDropdown2.selectedIndex];
  currCalcVersion2 = currCalcData2[0];
  currCalcMaxBossHP2 = currCalcData2[1];
  calculateBoss(currCalcMaxBossHP2, 60000, 2);
});

// display specific boss version hp/score
bossHPCalc1.addEventListener("change", () => { calculateBoss(parseInt(bossHPCalc1.value.replaceAll(".", "").replaceAll(",", "")), 60000, 1); });
bossHPCalc2.addEventListener("change", () => { calculateBoss(parseInt(bossHPCalc2.value.replaceAll(".", "").replaceAll(",", "")), 60000, 2); });
bossScoreCalc1.addEventListener("change", () => { calculateBoss(currCalcMaxBossHP1, parseInt(bossScoreCalc1.value), 1); });
bossScoreCalc2.addEventListener("change", () => { calculateBoss(currCalcMaxBossHP2, parseInt(bossScoreCalc2.value), 2); });

// calculate specific boss version hp/score
function calculateBoss(hp, score, option) {
  let finalHP = option == 1 ? currCalcMaxBossHP1 : currCalcMaxBossHP2, finalScore = 60000;
  let bossHP = option == 1 ? bossHPCalc1 : bossHPCalc2;
  let bossScore = option == 1 ? bossScoreCalc1 : bossScoreCalc2;
  let bossData = option == 1 ? currCalcData1 : currCalcData2;

  if (!Number.isInteger(hp) || !Number.isInteger(score)) { bossHP.value = ""; bossScore.value = ""; return; }

  // constrains hp/score within 0-maxHP/0-60000
  if (hp < 0) hp = 0;
  else if (option == 1 && hp > currCalcMaxBossHP1) hp = currCalcMaxBossHP1;
  else if (option == 2 && hp > currCalcMaxBossHP2) hp = currCalcMaxBossHP2;
  if (score < 0) score = 0;
  else if (score > 60000) score = 60000;

  let bossValues = Array.from({length: 7}, () => Array.from({length: 3}).fill(null));
  bossValues = [[0, 0, 0], [1200, 4, 4000], [1700, 4, 4800], [2200, 4, 7200], [2500, 4, 9600], [3000, 4, 10400], [5000, 3, 7800], [5000, 6, 16200]];

  // calculate hp/score to the floored threshold
  let calcHP = 0, calcScore = 0, threshold;
  let hpToNextThreshold, scoreToNextThreshold;
  for (threshold = 0; threshold < 8; ++threshold) {
    hpToNextThreshold = bossValues[threshold][0] * bossValues[threshold][1] * bossData[1] / 874 / 100;
    scoreToNextThreshold = bossValues[threshold][2];
    if (calcHP + hpToNextThreshold > hp + 1) break;
    if (calcScore + scoreToNextThreshold > score) break;
    calcHP += hpToNextThreshold;
    calcScore += scoreToNextThreshold;
  }

  // add remaining needed hp/score
  if (threshold < 8) {
    finalHP = calcHP + (score - calcScore) / scoreToNextThreshold * hpToNextThreshold;
    finalScore = calcScore + (hp - calcHP) / hpToNextThreshold * bossValues[threshold][2];
  }

  // display hp/score
  bossHP.value = showNumberFormat(score != 60000 ? Math.floor(finalHP) : hp);
  bossScore.value = score != 60000 ? score : Math.floor(finalScore);
}

/* ----------------------------------------------------------------------------- CHART ----------------------------------------------------------------------- */

// display/hide chart
function toggleChart() {
  chartIsOpen = !chartIsOpen;
  let chart = document.getElementById("c");
  document.body.style.overflow = chartIsOpen ? "hidden" : "auto";
  chart.style.display = chartIsOpen ? "flex" : "none";
  if (chartIsOpen) showHPChart();
}
function changeChartPoints(n) {
  if (chartScoreNum == n) return;
  chartScoreNum = n;
  saveProgress();
  showHPChart();
}

// download chart
function downloadChart() {
  let downloadButton = document.createElement("a");
  downloadButton.href = hpChart.toBase64Image("image/png", 1.0);
  downloadButton.download = `Deadly Assault HP - ${chartScoreNum} Score`;
  downloadButton.click();
}

// build chart hp dataset
function generateHPDataset(label, data, color) {
  return { label, data, pointRadius: 2, borderWidth: 2, borderColor: color, pointHoverRadius: 4, pointHoverBorderWidth: 2, pointHoverBorderColor: color, backgroundColor: "#ffffff" };
}

// display chart
function showHPChart() {
  // change color of selected score value
  let chartScoreButtons = document.querySelectorAll(".c-k");
  chartScoreButtons.forEach(btn => btn.classList.toggle("selected", btn.dataset.format == chartScoreNum));

  // various plugins thanks to Chart.js documentation + videos + Stack Overflow
  // hover dotted line
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
  // legend padding
  const legendPadding = {
    id: "legendPadding",
    beforeInit(chart) {
      let newLegend = chart.legend.fit;
      chart.legend.fit = function fit() { newLegend.bind(chart.legend)(); chart.legend.height += 15; }
    }
  };
  // hide info outside of chart
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

  // hover tooltip
  Chart.Tooltip.positioners.cursor = function(elements, eventPosition) {
    if (!eventPosition) return false;
    let {top, bottom} = this.chart.chartArea;
    let {x, y} = eventPosition;
    y += y <= (top + bottom) / 3 ? 50 : -50;
    return {x, y};
  };

  // display new chart
  if (!hpChart) {
    hpChart = new Chart("hpChart", {
      // import plugins
      type: "line", plugins: [verticalHoverLine, legendPadding, hideTooltipOutside],

      // chart settings
      options: {
        // fit & position chart, detect cursor, disable animations
        animation: false, responsive: true, maintainAspectRatio: false,
        interaction: { mode: "nearest", axis: "x", intersect: false },
        layout: { padding: {top: 10, bottom: 15, left: 10, right: 25} },

        // format x & y axis
        scales: {
          x: {
            offset: true,
            border: { display: false },
            grid: { color: "transparent" },
            ticks: {
              padding: 10, font: { family: "Inconsolata", size: 12 }, color: "#888888", maxRotation: 0,
              callback: function(value, index) { return index % 4 == 0 ? this.getLabelForValue(value) : ""; }
            }
          },
          y: {
            border: { display: false },
            grid: { color: function(context) { return context.tick.value % 40000000 == 0 ? "#888888" : "#444444"; } },
            ticks: {
              padding: 15, font: { family: "Inconsolata", size: 12 }, color: "#888888",
              callback: function(value, index) { return index % 2 == 0 ? showNumberFormat(value) : ""; }
            }
          }
        },

        // format title, legend, tooltip
        plugins: {
          title: { display: true, color: "#ffffff", font: { family: "Inconsolata", size: 20, weight: "bold" } },
          legend: {
            labels: { usePointStyle: true, boxHeight: 8,
              font: { family: "Inconsolata", size: 14 },
              // grayscale disabled legend element
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
              // format tooltip text
              labelTextColor: function(context) { return context.dataset.borderColor; },
              label: function(context) { return context.dataset.label + ": " + showNumberFormat(context.parsed.y); }
            }
          }
        }
      }
    });
  }

  // global chart settings
  hpChart.data.labels = versionIDs;
  hpChart.data.datasets = [
    generateHPDataset(`Raw HP`, chartScoreNum == "20k" ? hpData[0] : hpData[1], "#e06666"),
    generateHPDataset(`Alt HP`, chartScoreNum == "20k" ? hpData[2] : hpData[3], "#f6b26b")
  ];
  hpChart.options.scales.y.min = chartScoreNum == "20k" ? 40000000 : 120000000;
  hpChart.options.scales.y.max = chartScoreNum == "20k" ? 280000000 : 840000000;
  hpChart.options.scales.y.ticks.stepSize = chartScoreNum == "20k" ? 20000000 : 60000000;
  hpChart.options.plugins.title.text = `Deadly Assault HP - ${chartScoreNum} Score`;
  hpChart.update();
  saveProgress();
}

/* ----------------------------------------------------------------------------- MAIN ----------------------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", async () => { await loadPage(); });