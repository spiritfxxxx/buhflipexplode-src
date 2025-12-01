/* ------------------------------------------------------------------------ MAIN PAGE ----------------------------------------------------------------------- */

let cntNoLeaks = 25;
let leaksToggle = document.getElementById("lks");
let spoilersToggle = document.getElementById("spl");
let versionNum = null, chartScoreNum = null, currNumberFormat = null;
let menuIsOpen = false, versionSelectorIsOpen = false, chartIsOpen = false;

let versionData = null, enemyData = null, hpChart = null;
let buffNames = null, buffDescs = null, versionDazeMult = null, versionAnomMult = null, versionEnemies = null;
let versionIDs = [], hpData = [];
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
      let currEnemyData = enemyData[currEnemyID];
      let eHP = currEnemy.hp;
      let eTags = currEnemyData.tags;
      raw60kEnemyHP += eHP;
      if (eTags.length >= 1 && !(eTags.length == 1 && eTags.includes("spoiler"))) {
        if (eTags.includes("counter")) alt60kEnemyHP -= eHP * 0.02;
        if (eTags.includes("miasma")) alt60kEnemyHP += eHP * (currEnemyID != "25300" ? 0.975 : 0.94);
        else if (eTags.includes("ucc")) alt60kEnemyHP += eHP * 0.964;
      }
      else alt60kEnemyHP += eHP;
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
  document.getElementById("v-name").innerHTML = currVersion.versionName;
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
    document.getElementById(`b-img${buff}`).src = `../assets/buffs/${buffNames[buff - 1].toLowerCase().replace(" ", "-").replace(" ", "-")}.webp`;
    document.getElementById(`b-name${buff}`).innerHTML = buffNames[buff - 1];
    document.getElementById(`b-desc${buff}`).innerHTML = versionNum == 8 && buffNames[buff - 1] == "Blazing Chill" ? "• Agent <span style='color:#ff5521;font-weight:bold;'>Fire Anomaly Buildup Rate</span> and <span style='color:#98eff0;font-weight:bold;'>Ice Anomaly Buildup Rate</span> increase by <span style='color:#2bad00;font-weight:bold;'>20%</span>, and ATK increases by <span style='color:#2bad00;font-weight:bold;'>25%</span>.<br>• When inflicting an <span style='color:#7e50bb;font-weight:bold;'>Attribute Anomaly</span> on enemies, the Agent restores <span style='color:#2bad00;font-weight:bold;'>400</span> Decibels and <span style='color:#7e50bb;font-weight:bold;'>Anomaly Proficiency</span> is increased by <span style='color:#2bad00;font-weight:bold;'>80</span>, lasting 15s. Decibels recovery can be triggered once every 15s." : buffDescs[buffNames[buff - 1]];
  }
}

/* place and display elements/enemies/weaknesses/resistances/HP/count on screen */
function showEnemies() {
  /* add side 1 & 2 displays */
  let side1 = document.querySelector("#s1"), side2 = document.querySelector("#s2"), side3 = document.querySelector("#s3");
  side1.innerHTML = ``; side2.innerHTML = ``; side3.innerHTML = ``;

  /* loop version's sides */
  for (let s = 1; s <= 3; ++s) {
    let side = s == 1 ? side1 : (s == 2 ? side2 : side3);
    /* add side x-x LvXX title */
    let sideHeader = document.createElement("div");
    sideHeader.className = "s-header";
    sideHeader.innerHTML = `Side ${s} Lv70`;

    /* add side supposed equal HP multiplier */
    let combHPMult = document.createElement("div");
    combHPMult.className = "s-hp-daze-anom-mult";
    combHPMult.innerHTML = `⇧ HP: <span style="color:#ff5555;">SOON™</span> | Daze: <span style="color:#ffe599;">${versionDazeMult}%</span> | Anom: <span style="color:#7e50bb;">${versionAnomMult}%</span>`;
    sideHeader.appendChild(combHPMult);
    side.appendChild(sideHeader);

    let currEnemy = versionEnemies[s - 1];
    let currEnemyID = currEnemy.id;
    let currEnemyType = currEnemy.type;
    let currEnemyData = enemyData[currEnemyID];

    /* define current enemy's parameters */
    let eTags = currEnemyData.tags;
    let eMods = currEnemyData.mods;
    let showEnemySpoilers = spoilersToggle.checked || !eTags.includes("spoiler");
    let eName = showEnemySpoilers ? currEnemyData.name : "SPOILER BOSS";
    let eImg = showEnemySpoilers ? `../assets/enemies/${currEnemyData.image}.webp` : `../assets/enemies/doppelganger-i.webp`;

    /* define current enemy's various stats */
    let eHP = currEnemy.hp;
    let eDef = currEnemyData.baseDef / 50 * 794;
    let eDaze = currEnemyData.baseDaze * 2.35 * (currEnemyID == "24300" ? 0.8 : 1);
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
      if (eTags.includes("ucc"))
        ttHP.innerHTML = `<span style="color:#ecce45;">✦</span><span class="tt-text">${instant("#ecce45", "IMPAIRED!!", eName, eHP, 1.2, 3, false)}</span>`;
      else if (eTags.includes("miasma"))
        ttHP.innerHTML = `<span style="color:#d4317b;">✦</span><span class="tt-text">${instant("#d4317b", "PURIFIED!!", eName, eHP, currEnemyID != "25300" ? 2.5 : 1.5, currEnemyID != "25300" ? 1 : 4, eTags.includes("counter"))}</span>`;
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

    side.appendChild(enemy);

    /* add enemy stage description */
    let stageDesc = document.createElement("div");
    stageDesc.className = "esd";
    stageDesc.innerHTML = eTags.includes("spoiler") && !spoilersToggle.checked ? `${currEnemyData.spoilerDesc}<br><br>${currEnemyData.spoilerPerf}` : ((currEnemyID[0] == '2') ? `${currEnemyData.desc}<br><br>${currEnemyData.perf}` : `${currEnemyData.desc[currEnemyType]}<br><br>${currEnemyData.perf[currEnemyType]}`);
    stageDesc.innerHTML += `${(currEnemyType == 1 || (currEnemyID == "14303" && versionNum == 4) || (currEnemyID == "14302" && versionNum >= 25)) ? `<br><br>${currEnemyData.misc}` : ``}`;
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
function instant(color, type, name, hp, dmg, cnt, counter) {
  return `<span style="font-weight:bold;text-decoration:underline;">${name}</span><br>
          <span style="color:#f6b26b;font-weight:bold;">Alt HP</span>: <span style="color:${color};font-weight:bold;">${numberFormat(Math.ceil(hp * (100 - dmg * cnt - 2 * counter) / 100))}</span><br>
          <span style="font-weight:bold;">(assume ${100 - dmg * cnt - 2 * counter}% of HP)</span><br><br>
          <span style="font-weight:bold;"><span style="color:${color};">${type}</span></span> ${cnt} time(s)`
          + (name == "Unknown Corruption Complex" ? ` on<br>legs, 3 time(s) on core` : ``)
          + (counter ? `<br><span style="font-weight:bold;"><span style="color:#b47ede;">COUNTERED!!</span></span> 1 time(s)` : ``);
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
  if (e.key == "Escape") { e.preventDefault(); chartIsOpen ? toggleChart() : (versionSelectorIsOpen ? toggleVersionSelector() : toggleMenu()); }
  else if (e.key == " " && !menuIsOpen && !chartIsOpen) { e.preventDefault(); toggleVersionSelector(); }
  else if (e.key == "Backspace" && !menuIsOpen && !versionSelectorIsOpen) { e.preventDefault(); toggleChart(); }
  else if (e.key == "ArrowLeft" && !menuIsOpen && !chartIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeVersion(-1); }
  else if (e.key == "ArrowRight" && !menuIsOpen && !chartIsOpen && !versionSelectorIsOpen) { e.preventDefault(); changeVersion(1); }
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
    nameDiv.innerHTML = currVersion.versionName;
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
  hpChart.data.labels = versionIDs;
  hpChart.data.datasets = [
    createHPDataset(`Raw HP`, chartScoreNum == "20k" ? hpData[0] : hpData[1], "#e06666"),
    createHPDataset(`Alt HP`, chartScoreNum == "20k" ? hpData[2] : hpData[3], "#f6b26b")
  ];
  hpChart.options.scales.y.min = chartScoreNum == "20k" ? 40000000 : 160000000;
  hpChart.options.scales.y.max = chartScoreNum == "20k" ? 160000000 : 480000000;
  hpChart.options.plugins.title.text = `Deadly Assault HP (${chartScoreNum})`;
  hpChart.update();
  saveProgress();
}


/* ----------------------------------------------------------------------------- MAIN ----------------------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", async () => { await loadDeadlyPage(); });