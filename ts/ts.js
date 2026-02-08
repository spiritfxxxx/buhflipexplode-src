/* ------------------------------------------------------------------------ MAIN PAGE ----------------------------------------------------------------------- */

let cntNoLeaks = 2, oldModeNum = 2, modeNum = 2, v26 = 2;
let leaksToggle = document.getElementById("lks");
let spoilersToggle = document.getElementById("spl");
let oldVersionNum, versionNum, nodeNum, maxNode, endingNum, currNumberFormat;
let menuIsOpen = versionSelectorIsOpen = false;

let versionData, enemyData;
let buffNames, buffDescs, versionBossDazeMult, versionEnemyDazeMult, versionBossAnomMult, versionEnemyAnomMult, versionEnemies;
let versionIDs = hpData = [];

let nodeLvlData = [];
let easyNodeLvlData = [55, 58, 60, 65];
let pre26HardNodeLvlData = [60, 63, 65, 70, 70, 70];
let post26HardNodeLvlData = [60, 65, 70, 70, 70];

/* new full list of numbers thanks to Dimbreath's database */
let nodeEnemyHPMult = [100,116,135,157,181,193,206,220,235,271,291,314,338,364,419,431,444,458,472,543,618,703,801,912,1049,1111,1176,1246,1320,1518,1609,1706,1809,1919,2207,2320,2440,2566,2698,3103,3404,3734,4097,4494,5169,5591,6049,6544,7079,8141,8826,9569,10374,11246,12934,13260,13595,13938,14290,16434,16774,17121,17475,17837,18206,18583,18968,19361,19761,21738];
let nodeBossHPMult = [100,116,135,157,181,193,206,220,235,271,291,314,338,364,419,431,444,458,472,543,618,703,801,912,1049,1134,1227,1328,1437,1653,1792,1942,2106,2283,2626,2865,3126,3411,3722,4281,4717,5197,5727,6311,7258,7691,8151,8637,9153,10527,11227,11975,12772,13623,15667,15957,16252,16553,16860,19389,19716,20049,20387,20731,21081,21437,21799,22167,22541,24795];
let nodeDefMult = [100,108,116,124,132,142,152,164,176,188,200,214,228,242,258,274,290,306,324,344,362,382,402,422,444,466,490,512,536,562,586,612,638,666,694,722,750,780,810,842,872,904,938,970,1004,1038,1074,1110,1146,1184,1220,1258,1298,1338,1378,1418,1460,1502,1544,1588,1588,1588,1588,1588,1588,1588,1588,1588,1588,1588];
let nodeDazeMult = [100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,101,102,103,104,104,105,106,107,108,110,113,115,118,120,123,125,128,130,133,137,142,146,151,155,160,164,169,173,178,180,183,186,189,192,195,197,200,203,206,209,212,215,217,220,223,226,229,232,235];

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
  updateNumberFormat();
}

/* create hp database using 3D matrix */
async function buildHPData() {
  hpData = [Array.from({length: 4}, () => Array.from({length: 7}, () => Array.from({length: 1}).fill(null))),
            Array.from({length: 6}, () => Array.from({length: 7}, () => Array.from({length: versionIDs[1].length}).fill(null))) ];
  for (let m = 1; m <= 2; ++m) {
    for (let v = 1; v <= versionIDs[m - 1].length; ++v) {
      nodeLvlData = m == 1 ? easyNodeLvlData : (v < v26 ? pre26HardNodeLvlData : post26HardNodeLvlData);
      versionEnemies = versionData[m - 1].versions[versionIDs[m - 1][v - 1]].versionEnemies;
      for (let n = 1; n <= versionEnemies.nodes.length; ++n) {
        let currNode = versionEnemies.nodes[n - 1];
        let raw60kEnemyHP = alt60kEnemyHP = rawHP = aoeHP = altHP = 0;
        let addAOE = true;

        let currEnemy = currNode.sides[0].waves[0].enemies[0];
        let currEnemyID = currEnemy.id;
        let currEnemyType = currEnemy.type;
        let currEnemyData = enemyData[currEnemyID];
        let eHP =  Math.floor(8.74 * currEnemyData.baseHP[currEnemyType] * nodeBossHPMult[nodeLvlData[n - 1] - 1] * currEnemy.mult / 10000);
        let eTags = currEnemyData.tags;

        raw60kEnemyHP += eHP;
        alt60kEnemyHP += eHP;
        if (eTags.length >= 1 && !(eTags.length == 1 && eTags.includes("spoiler"))) {
          if (eTags.includes("ucc")) alt60kEnemyHP -= eHP * 0.036;
          if (eTags.includes("hunter")) alt60kEnemyHP -= eHP * 0.01;
          if (eTags.includes("miasma")) alt60kEnemyHP -= eHP * (currEnemyID == "25300" ? 0.045 : 0.025);
          if (eTags.includes("shutdown")) alt60kEnemyHP -= eHP * (currEnemyID == "26300" ? 0.03 : 0.015);
        }
        hpData[m - 1][n - 1][0][v - 1] = Math.ceil(raw60kEnemyHP * 0.281083138);
        hpData[m - 1][n - 1][1][v - 1] = Math.ceil(raw60kEnemyHP);
        hpData[m - 1][n - 1][2][v - 1] = Math.ceil(alt60kEnemyHP * 0.281083138);
        hpData[m - 1][n - 1][3][v - 1] = Math.ceil(alt60kEnemyHP);

        for (let s = 2; s <= 5; ++s) {
          let currSide = currNode.sides[s - 1];
          if (currSide == null) continue;
          let sideHPMult = currSide.sideHPMult;
          for (let w = 1; w <= currSide.waves.length; ++w) {
            let currWave = currSide.waves[w - 1];
            for (let e = 1; e <= currWave.enemies.length; ++e) {
              let currEnemy = currWave.enemies[e - 1];
              let currEnemyData = enemyData[currEnemy.id];
              let eHP = Math.round(currEnemyData.baseHP[currEnemyType] * sideHPMult * nodeEnemyHPMult[nodeLvlData[n - 1] - 1] / 10000);
              let eTags = currEnemyData.tags;
              for (let cnt = 1; cnt <= currEnemy.count; ++cnt) {
                rawHP += currEnemy.id != "14000" ? eHP : 1;
                aoeHP += addAOE ? eHP : 0;
                altHP += eHP;
                if (eTags.length >= 1 && !(eTags.length == 1 && (eTags.includes("spoiler") || eTags.includes("hitch")))) {
                  if (eTags.includes("palicus")) altHP -= eHP * 0.25;
                  if (eTags.includes("robot")) altHP -= eHP * 0.1;
                  if (eTags.includes("brute")) altHP -= eHP * 0.08;
                  if (eTags.includes("miasma")) altHP -= eHP * (currEnemy.id == "26202" ? 0.3 : 0.15);
                }
                else altHP -= addAOE ? 0 : eHP;
                addAOE = false;
              }
            }
            addAOE = true;
          }
        }
        hpData[m - 1][n - 1][4][v - 1] = rawHP;
        hpData[m - 1][n - 1][5][v - 1] = aoeHP;
        hpData[m - 1][n - 1][6][v - 1] = Math.ceil(altHP);
      }
    }
  }
}

/* ◁ [version # + time] ▷ display */
async function showVersion() {
  let currVersion = versionData[modeNum - 1].versions[versionIDs[modeNum - 1][versionNum - 1]];
  versionBossDazeMult = currVersion.versionBossDazeMult;
  versionEnemyDazeMult = currVersion.versionEnemyDazeMult;
  versionBossAnomMult = currVersion.versionBossAnomMult;
  versionEnemyAnomMult = currVersion.versionEnemyAnomMult;
  versionEnemies = currVersion.versionEnemies;
  document.getElementById("v-name").innerHTML = currVersion.versionName + (modeNum == 2 && versionNum == cntNoLeaks ? `<span style='color:#ff0000;font-weight:bold;'> (LIVE)</span>` : ``);
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
    nodeNum = modeNum == 2 ? parseInt(localStorage.getItem("lastTSNode")) : 4;
    oldModeNum = modeNum;
  }
  if (modeNum == 2) changePrePostNode();
  maxNode = versionNum < v26 ? 4 : 3;
  nodeLvlData = modeNum == 1 ? easyNodeLvlData : (versionNum < v26 ? pre26HardNodeLvlData : post26HardNodeLvlData);
  document.getElementById("n-text").innerHTML = `${nodeNum < maxNode ? nodeNum : maxNode}`;
  showEndings();
  showBuffs();
  showEnemies();
}
function changeNode(n) {
  if (modeNum == 2 && nodeNum > maxNode) nodeNum = maxNode;
  nodeNum = (nodeNum - 1 + n + maxNode) % maxNode + 1;
  if (modeNum == 2 && nodeNum == maxNode) nodeNum += endingNum - 1;
  showNode();
}
function changePrePostNode() {
  if (oldVersionNum < v26 && versionNum >= v26) {
    if (nodeNum == 3 || (nodeNum >= maxNode && nodeNum - maxNode < 2)) nodeNum--;
    else if (nodeNum >= maxNode && nodeNum - maxNode >= 2) nodeNum = 4;
  }
  else if (oldVersionNum >= v26 && versionNum < v26 && nodeNum >= 2) nodeNum++;
  oldVersionNum = versionNum;
}

/* add ending choices to final node */
function showEndings() {
  if (versionNum >= v26 && endingNum > 2) endingNum = 2;
  if (modeNum == 2 && nodeNum >= maxNode) {
    document.getElementById("end").style.display = "flex";
    document.getElementById("end-3").style.display = versionNum < v26 ? "flex" : "none";
    let endingButtons = document.querySelectorAll(".end-text");
    endingButtons.forEach(btn => btn.classList.toggle("selected", btn.dataset.format == endingNum));
  }
  else document.getElementById("end").style.display = "none";
}
/* show specific ending variant for final node */
function changeEndings(n) { endingNum = n; nodeNum = (versionNum < v26 ? 3 : 2) + n; showNode(); }

/* show node buffs */
function showBuffs() {
  buffNames = versionEnemies.nodes[nodeNum - 1].buffNames;
  for (let buff = 1; buff <= 4; ++buff) {
    document.getElementById(`b-img${buff}`).src = `../assets/buffs/${buffNames[buff - 1].toLowerCase().replaceAll(" ", "-")}.webp`;
    document.getElementById(`b-name${buff}`).innerHTML = buffNames[buff - 1];
    document.getElementById(`b-desc${buff}`).innerHTML = buffDescs[buffNames[buff - 1]];
  }
}

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

    /* add side x-x LvXX title */
    let sideHeader = document.createElement("div");
    sideHeader.className = "s-header";
    sideHeader.innerHTML = `${s == 1 ? `Final BATTLE` : s <= 4 ? `Required` : `Optional`} ${nodeNum < maxNode ? nodeNum : maxNode}${modeNum != 2 || nodeNum < maxNode ? `` : `.${nodeNum - maxNode + 1}`}${s != 1 ? `-${s - 1}` : ``} Lv${nodeLvlData[nodeNum - 1]}`;

    /* add side supposed equal HP multiplier */
    let combHPMult = document.createElement("div");
    combHPMult.className = "s-hp-daze-anom-mult";
    combHPMult.innerHTML = `HP: <span style="color:#ff5555;">N/A</span> | Daze: <span style="color:#ffe599;">N/A</span> | Anom: <span style="color:#7756c6;">N/A</span>`;
    sideHeader.appendChild(combHPMult);

    /* add side combined weaknesses/resistances */
    if (s >= 2) {
      let combWR = document.createElement("div");
      combWR.className = "wr";
      generateWR(currSide != null ? currNode.sides[s - 1].sideElementMult : [1.0, 1.0, 1.0, 1.0, 1.0], combWR);
      sideHeader.appendChild(combWR);
    }
    side.appendChild(sideHeader);

    if (currSide == null) continue;
    let sideHPMult = s == 1 ? currSide.waves[0].enemies[0].mult : currSide.sideHPMult;
    combHPMult.innerHTML = `HP: <span style="color:#ff5555;">${modeNum == 1 ? Math.round(sideHPMult * 100) / 100 : sideHPMult}%</span> | Daze: <span style="color:#ffe599;">${s == 1 ? versionBossDazeMult : versionEnemyDazeMult}%</span> | Anom: <span style="color:#7756c6;">${s == 1 ? versionBossAnomMult : versionEnemyAnomMult}%</span>`;

    /* loop side's waves */
    for (let w = 1; w <= currSide.waves.length; ++w) {
      let wave = document.createElement("div");
      wave.className = "w";

      /* add wave WAVE # title */
      if (s >= 2) {
        let waveHeader = document.createElement("div");
        waveHeader.className = "w-num";
        waveHeader.innerHTML = `WAVE ${w}`;
        wave.appendChild(waveHeader);
      }

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
        let eHP = (s == 1 ? Math.floor : Math.round)(sideHPMult * currEnemyData.baseHP[currEnemyType] * (s == 1 ? 8.74 : 1) * (s == 1 ? nodeBossHPMult : nodeEnemyHPMult)[nodeLvlData[nodeNum - 1] - 1] / 10000);
        let eDef = currEnemyData.baseDef * nodeDefMult[nodeLvlData[nodeNum - 1] - 1] / 100;
        let eDaze = currEnemyData.baseDaze[currEnemyType] * nodeDazeMult[nodeLvlData[nodeNum - 1] - 1] * (currEnemyID == "24300" ? 0.8 : 1) / 100;
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

            /* set tooltip to be smaller */
            if (s >= 2) { ttHP.style.fontSize = "36px"; ttHP.style.top = "-19px"; ttHP.style.right = "87px"; }

            if (eTags.includes("hitch")) {
              ttHP.innerHTML = hitch(eHP) + `<br>`;
              enemyHP.innerHTML = numberFormat(1);
            }
            else {
              let eHPNew = eHP;
              let color = "#ffffff";

              if (eTags.includes("palicus")) {
                eHPNew -= eHP * 0.25;
                color = "#93c47d";
                ttHP.innerHTML += palicus(eHPNew) + `<br>`;
              }
              if (eTags.includes("robot")) {
                eHPNew -= eHP * 0.1;
                color = "#ca9a00";
                ttHP.innerHTML += instant(color, "IMPAIRED!!", 2) + `<br>`;
              }
              if (eTags.includes("brute")) {
                eHPNew -= eHP * 0.08;
                color = "#ca9a00";
                ttHP.innerHTML += instant(color, "IMPAIRED!!", 1) + `<br>`;
              }
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
                eHPNew -= eHP * (currEnemyID[2] != '3' ? 0.15 : (currEnemyID == "25300" ? 0.045 : 0.025));
                color = "#b4317b";
                ttHP.innerHTML += instant(color, "PURIFIED!!", currEnemyID == "25300" ? 3 : 1) + `<br>`;
              }
              if (eTags.includes("shutdown")) {
                eHPNew -= eHP * (currEnemyID == "26300" ? 0.03 : 0.015);
                color = "#b47ede";
                ttHP.innerHTML += instant(color, "SHUTDOWN!!", (currEnemyID == "26300" ? 2 : 1)) + `<br>`;
              }
              ttHP.innerHTML = alt(color, currEnemyID == "25300" ? (eName.slice(0, 21) + "<br>" + eName.slice(21)) : eName, eHPNew, eHP) + ttHP.innerHTML;
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
          ttMiscStat.innerHTML = `+</span><span class="tt-text">${generateEnemyStats((currEnemyID[2] == '3' ? versionBossDazeMult : versionEnemyDazeMult) / 100 * eDaze, eStunMult, eStunTime, (currEnemyID[2] == '3' ? versionBossAnomMult : versionEnemyAnomMult) / 100 * eAnom, eElementMult, eMods)}</span>`;
          enemy.appendChild(ttMiscStat);
          
          /* change image formatting for bosses/enemies */
          if (s >= 2) {
            enemyImg.style.height = enemyHover.style.maxHeight = enemyHover.style.width = "108px";
            enemyName.style.fontSize = enemyHP.style.fontSize = enemyDef.style.fontSize = "12px";
            waveEnemies.style.padding = "15px";
          }

          waveEnemies.appendChild(enemy);

          /* add enemy stage description */
          if (side == boss && currEnemyID[2] == '3') {
            document.querySelector(".esd")?.remove();
            let stageDesc = document.createElement("div");
            stageDesc.className = "esd";
            stageDesc.innerHTML = eTags.includes("spoiler") && !spoilersToggle.checked ? `${currEnemyData.spoilerDesc}<br><br>${currEnemyData.spoilerPerf}` : `${currEnemyData.desc[currEnemyType]}<br><br>${currEnemyData.perf[currEnemyType]}`;
            stageDesc.innerHTML += `<br><br>• When an extra score multiplier is active in this stage, the <span style='color:#ffaf2c;font-weight:bold;'>Performance Points</span> cap will increase accordingly.`;
            stageDesc.innerHTML += `${currEnemyID[0] == '2' || currEnemyID == "14303" || (currEnemyID == "14302") ? `<br><br>${currEnemyData.misc}` : ``}`;
            boss.parentElement.appendChild(stageDesc);
          }
        }
      }
      wave.appendChild(waveEnemies);
      side.appendChild(wave);
    }
  }

  /* add raw + alt HP display */
  document.getElementById("n-hp-b-raw-20000").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][0][versionNum - 1]);
  document.getElementById("n-hp-b-raw-60000").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][1][versionNum - 1]);
  document.getElementById("n-hp-b-alt-20000").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][2][versionNum - 1]);
  document.getElementById("n-hp-b-alt-60000").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][3][versionNum - 1]);
  document.getElementById("n-hp-raw").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][4][versionNum - 1]);
  document.getElementById("n-hp-aoe").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][5][versionNum - 1]);
  document.getElementById("n-hp-alt").innerHTML = numberFormat(hpData[modeNum - 1][nodeNum - 1][6][versionNum - 1]);

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
  if (s == 1) { weakImg1.style.width = "24px"; weakImg2.style.width = "24px"; resImg1.style.width = "24px"; resImg2.style.width = "24px"; }
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
function hitch(hp) {
  return `<span style="color:#ffffff;">✦</span><span class="tt-text">
          <span style="font-weight:bold;text-decoration:underline;">Hitchspiker</span><br>
          True <span style="color:#ff5555;font-weight:bold;">Raw HP</span>: <span style="color:#ff5555;font-weight:bold;">${numberFormat(hp)}</span><br><br>
          technically doesn't<br>need to be killed</span>`;
}
function palicus() { return `hit both 50% of the time</span>`; }
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
/* !!!!!!!!!!!!!!!!!! DEFAULT TO LATEST TS !!!!!!!!!!!!!!!!!! */
function loadSavedState() {
  if (localStorage.getItem("leaksEnabled") == "true") leaksToggle.checked = true;
  if (localStorage.getItem("spoilersEnabled") == "true") spoilersToggle.checked = true;
  versionNum = parseInt(localStorage.getItem("lastTSVersion") || `${cntNoLeaks}`);
  oldVersionNum = versionNum;
  nodeNum = parseInt(localStorage.getItem("lastTSNode") || "3");
  endingNum = parseInt(localStorage.getItem("lastTSEnding") || "1");
  currNumberFormat = localStorage.getItem("numberFormat") || "period";
  if (!leaksToggle.checked) versionNum = Math.min(versionNum, cntNoLeaks);
  saveLastPage();
  saveSettings();
}

/* save current page location + settings */
function saveLastPage() {
  localStorage.setItem("lastTSVersion", versionNum);
  localStorage.setItem("lastTSNode", nodeNum);
  localStorage.setItem("lastTSEnding", endingNum);
}
function saveSettings() {
  localStorage.setItem("numberFormat", currNumberFormat);
  localStorage.setItem("leaksEnabled", leaksToggle.checked);
  localStorage.setItem("spoilersEnabled", spoilersToggle.checked);
}

/* keyboard shortcuts to navigate main page */
document.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key == "Escape") { e.preventDefault(); versionSelectorIsOpen ? toggleVersionSelector() : toggleMenu(); }
  else if (e.key == " " && !menuIsOpen) { e.preventDefault(); toggleVersionSelector(); }
  else if (e.key == "ArrowLeft" && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeVersion(-1); }
  else if (e.key == "ArrowRight" && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeVersion(1); }
  else if (e.key == "ArrowUp" && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeNode(1); }
  else if (e.key == "ArrowDown" && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeNode(-1); }
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
      nameDiv.innerHTML = currVersion.versionName + (m == 2 && v == cntNoLeaks ? `<span style='color:#ff0000;font-weight:bold;'> (LIVE)</span>` : ``);
      timeDiv.innerHTML = currVersion.versionTime;
      versionButton.appendChild(nameDiv);
      versionButton.appendChild(timeDiv);

      /* make it clickable, and if clicked go to that version */
      versionButton.onclick = () => {
        modeNum = m;
        versionNum = modeNum == 2 ? v : 1;
        toggleVersionSelector();
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

/* ----------------------------------------------------------------------------- MAIN ----------------------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", async () => { await loadThresholdPage(); });