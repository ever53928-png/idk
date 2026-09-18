// Read and display a previously saved value, if the page contains #saved.
const savedSentence = localStorage.getItem("myFigSentence");
if (savedSentence) {
  document.getElementById("saved").textContent = `Saved: ${savedSentence}`;
}

// Launch the hidden Arcade 5 interface after the user types Z, M, G.
function enableSecretLetterCode(secretLetters, callback) {
  const typedLetters = [];

  document.addEventListener("keydown", (event) => {
    typedLetters.push(event.key.toUpperCase());

    if (typedLetters.length > secretLetters.length) {
      typedLetters.shift();
    }

    if (typedLetters.join("") === secretLetters.join("")) {
      callback();
      typedLetters.length = 0;
    }
  });
}

enableSecretLetterCode(["Z", "M", "G"], openArcadeWindow);

function openArcadeWindow() {
  const popup = window.open("");
  if (!popup) {
    window.location.href = "https://cdn.jsdelivr.net/npm/@arcade-v/arcade_v";
    return;
  }

  const popupDocument = popup.document;
  popupDocument.head.innerHTML = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@arcade-v/arcade_v/navigation/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  `;

  popupDocument.body.innerHTML = `
    <ul class="navbar">
      <li><a aria-label="Home" data-page="home"><i class="fas fa-home nav-icon"></i> Home</a></li>
      <li><a aria-label="Games" data-page="games"><i class="fas fa-gamepad nav-icon"></i> Games</a></li>
      <li><a aria-label="Apps" data-page="apps"><i class="fas fa-mobile-alt nav-icon"></i> Apps</a></li>
      <li><a aria-label="Settings" data-page="settings"><i class="fas fa-cog nav-icon"></i> Settings</a></li>
      <li><a aria-label="Fullscreen" data-page="fullscreen"><i class="fas fa-expand nav-icon"></i> Fullscreen</a></li>
    </ul>
    <div id="content-container" class="content-container"></div>
    <iframe id="Game" frameborder="0" allow="fullscreen"></iframe>
    <div id="spinner"><div class="spinner-icon"></div></div>
  `;

  const cdn = "https://cdn.jsdelivr.net/npm/@arcade-v/arcade_v/navigation";
  const contentContainer = popupDocument.getElementById("content-container");
  const gameFrame = popupDocument.getElementById("Game");
  const spinner = popupDocument.getElementById("spinner");

  function updateActiveLink(url) {
    popupDocument.querySelectorAll("ul li a").forEach((link) => {
      link.classList.toggle("active", url.includes(link.dataset.page));
    });
  }

  async function loadPageContent(url) {
    spinner.style.display = "flex";
    try {
      const separator = url.includes("?") ? "&" : "?";
      const response = await fetch(`${url}${separator}nocache=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      console.error("Failed to load:", url, error);
      return null;
    } finally {
      spinner.style.display = "none";
    }
  }

  function appendScript(url, callback) {
    const script = popupDocument.createElement("script");
    script.src = url;
    script.type = "text/javascript";
    script.onload = callback;
    popupDocument.body.appendChild(script);
  }

  async function changePageContent(url, afterLoad) {
    const content = await loadPageContent(url);
    if (content === null) return;

    contentContainer.innerHTML = content;
    contentContainer.style.display = "block";
    gameFrame.src = "about:blank";
    gameFrame.style.display = "none";
    updateActiveLink(url);
    afterLoad?.();
  }

  function requestFullscreen() {
    const target = contentContainer.offsetWidth > 0 && contentContainer.offsetHeight > 0
      ? contentContainer
      : gameFrame;
    (target.requestFullscreen || target.mozRequestFullScreen ||
      target.webkitRequestFullscreen || target.msRequestFullscreen)?.call(target);
  }

  popupDocument.querySelector('[data-page="home"]').onclick = () =>
    changePageContent(`${cdn}/home.html`, () => {
      appendScript(`${cdn}/home.js`, () => popup.displayRandomQuote?.());
      appendScript(`${cdn}/customization.js`);
    });

  popupDocument.querySelector('[data-page="games"]').onclick = () =>
    changePageContent(`${cdn}/games/games.html`, () => {
      appendScript(`${cdn}/games/games.js`, () =>
        popup.fetchGames?.(`${cdn}/games/games.json`));
      appendScript(`${cdn}/customization.js`);
    });

  popupDocument.querySelector('[data-page="apps"]').onclick = () =>
    changePageContent(`${cdn}/games/apps.html`, () => {
      appendScript(`${cdn}/games/games.js`, () =>
        popup.fetchGames?.(`${cdn}/games/apps.json`));
      appendScript(`${cdn}/customization.js`);
    });

  popupDocument.querySelector('[data-page="settings"]').onclick = () => {
    changePageContent(`${cdn}/settings.html`);
    appendScript(`${cdn}/customization.js`);
  };
  popupDocument.querySelector('[data-page="fullscreen"]').onclick = requestFullscreen;

  // The original creates these defaults only when they do not already exist.
  if (localStorage.getItem("faviconSrc") === null) {
    localStorage.setItem("faviconSrc", "https://gitlab.com/arcade_v/arcade_v_images/-/raw/main/favicon/logo.png");
  }
  if (localStorage.getItem("pageTitle") === null) localStorage.setItem("pageTitle", "Arcade 5");
  if (localStorage.getItem("userFont") === null) localStorage.setItem("userFont", "Pixelify Sans");

  popupDocument.querySelector('[data-page="home"]').click();
}
