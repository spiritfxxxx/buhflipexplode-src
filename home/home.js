/* ------------------------------------------------------------------------ MAIN PAGE ----------------------------------------------------------------------- */

let leaksToggle = document.getElementById("lks");
let spoilersToggle = document.getElementById("spl");
let currNumberFormat;
let menuIsOpen = false;

// build & display main page
function loadPage() {
  loadSavedState();
  changeNumberFormat();
}

/* ------------------------------------------------------------------------- GIF ------------------------------------------------------------------------ */

let buhImg = document.getElementById("buh");
let buh = "../assets/misc/buh.webp";
let buhFlip = "../assets/misc/buhFlip.webp";
let buhFlipExplode = "../assets/misc/buhFlipExplode.webp";
let canClick = true;

// pause buh after flipping/exploding (he is tired)
function enableClicksAfterDelay() {
  setTimeout(() => { canClick = true; }, 3000);
}

// flip/explode buh
function playGif(src, duration) {
  if (!canClick) return;
  canClick = false;
  let currTime = new Date().getTime();
  buhImg.src = src + "?t=" + currTime;
  setTimeout(() => {
    buhImg.src = buh + "?t=" + (currTime + duration);
    enableClicksAfterDelay();
  }, duration);
}
buhImg.addEventListener("click", () => { playGif(buhFlip, 2970); });
buhImg.addEventListener("contextmenu", (e) => { e.preventDefault(); playGif(buhFlipExplode, 2480); });

/* ------------------------------------------------------------ MISCELLANEOUS + QOL + NAVIGATION ------------------------------------------------------------ */

// load last page/settings
function loadSavedState() {
  if (localStorage.getItem("leaksEnabled") == "true") leaksToggle.checked = true;
  if (localStorage.getItem("spoilersEnabled") == "true") spoilersToggle.checked = true;
  currNumberFormat = localStorage.getItem("numberFormat") || "period";
}

// save current page/settings
function saveProgress() {
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
  if (e.key == "Escape") { e.preventDefault(); toggleMenu(); }
  else if (e.key == "Enter" && !menuIsOpen) { e.preventDefault(); jumpToTop(); }
  else if (e.key == " ") { e.preventDefault(); }
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
  saveProgress();
}

// display/hide leaks/spoilers
leaksToggle.addEventListener("change", () => {
  if (!leaksToggle.checked) spoilersToggle.checked = false;
  saveProgress();
});
spoilersToggle.addEventListener("change", () => {
  if (spoilersToggle.checked) leaksToggle.checked = true;
  saveProgress();
});

/* ----------------------------------------------------------------------------- MAIN ----------------------------------------------------------------------- */

window.addEventListener("DOMContentLoaded", async () => { loadPage(); });