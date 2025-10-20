/* ------------------------------------------------------------------------ MAIN PAGE ----------------------------------------------------------------------- */
let buhImg = document.getElementById("buh");
let buh = "../assets/misc/buh.webp";
let buhFlip = "../assets/misc/buhFlip.webp";
let buhFlipExplode = "../assets/misc/buhFlipExplode.webp";
let canClick = true;

/* pause buh after flipping/exploding (he is tired) */
function enableClicksAfterDelay() {
  setTimeout(() => { canClick = true; }, 3000);
}

/* flip/explode buh for the gif's specified duration */
function playGif(src, duration) {
  if (!canClick) return;
  canClick = false;
  buhImg.src = src + "?t=" + new Date().getTime();
  setTimeout(() => {
    buhImg.src = buh + "?t=" + new Date().getTime();
    enableClicksAfterDelay();
  }, duration);
}

/* left click to flip, right click to explode */
buhImg.addEventListener("click", () => { playGif(buhFlip, 2970); });
buhImg.addEventListener("contextmenu", (e) => { e.preventDefault(); playGif(buhFlipExplode, 2480); });

/* ------------------------------------------------------------------------ MENU BAR ----------------------------------------------------------------------- */

var currNumberFormat;
let leaksToggle = document.getElementById("lks");
let spoilersToggle = document.getElementById("spl");
let menuIsOpen = false;

/* load main page menu bar + settings */
function loadHomePage() {
  loadSavedState();
  updateNumberFormat();
}

/* load last saved page location + settings */
/* !!!!!!!!!!!!!!!!!! DEFAULT TO LATEST DA !!!!!!!!!!!!!!!!!! */
function loadSavedState() {
  currNumberFormat = localStorage.getItem("numberFormat") || "period";
  if (localStorage.getItem("leaksEnabled") == "true") leaksToggle.checked = true;
  if (localStorage.getItem("spoilersEnabled") == "true") spoilersToggle.checked = true;
}

/* save current page location + settings */
function saveProgress() {
  localStorage.setItem("numberFormat", currNumberFormat);
  localStorage.setItem("leaksEnabled", leaksToggle.checked);
  localStorage.setItem("spoilersEnabled", spoilersToggle.checked);
}

/* keyboard shortcuts to navigate main page */
document.addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.key == "Escape") {e.preventDefault; toggleMenu(); }
  else if (e.key == " ") { e.preventDefault(); }
  return;
});

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
  saveProgress();
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
  saveProgress();
});
spoilersToggle.addEventListener("change", () => {
  if (spoilersToggle.checked) leaksToggle.checked = true;
  saveProgress();
});

/* ----------------------------------------------------------------------------- MAIN ----------------------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", async () => { loadHomePage(); });