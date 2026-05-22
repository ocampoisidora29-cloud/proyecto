const DB_NAME = "biblioteca-canciones";
const DB_VERSION = 1;
const STORE = "songs";
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/flac", "audio/aac", "audio/mp4"];
const DEFAULT_REPO_SONGS = [
  {
    id: "repo-luz-de-medianoche",
    title: "Luz de medianoche",
    artist: "Preview local",
    album: "Archivos del repositorio",
    fileName: "luz-de-medianoche.wav",
    sourceUrl: "media/previews/luz-de-medianoche.wav",
    fileType: "audio/wav",
    duration: 8,
    isPreview: true
  },
  {
    id: "repo-ruta-del-verano",
    title: "Ruta del verano",
    artist: "Preview local",
    album: "Archivos del repositorio",
    fileName: "ruta-del-verano.wav",
    sourceUrl: "media/previews/ruta-del-verano.wav",
    fileType: "audio/wav",
    duration: 8,
    isPreview: true
  },
  {
    id: "repo-cinta-azul",
    title: "Cinta azul",
    artist: "Preview local",
    album: "Archivos del repositorio",
    fileName: "cinta-azul.wav",
    sourceUrl: "media/previews/cinta-azul.wav",
    fileType: "audio/wav",
    duration: 8,
    isPreview: true
  }
];

const state = {
  db: null,
  songs: [],
  repoSongs: [],
  filteredSongs: [],
  activeId: null,
  activeUrl: null
};

const els = {
  fileInput: document.querySelector("#fileInput"),
  newSongButton: document.querySelector("#newSongButton"),
  addDemoButton: document.querySelector("#addDemoButton"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  songList: document.querySelector("#songList"),
  songCount: document.querySelector("#songCount"),
  emptyState: document.querySelector("#emptyState"),
  clearButton: document.querySelector("#clearButton"),
  audioPlayer: document.querySelector("#audioPlayer"),
  playerStatus: document.querySelector("#playerStatus"),
  playerTitle: document.querySelector("#playerTitle"),
  playerMeta: document.querySelector("#playerMeta"),
  coverArt: document.querySelector("#coverArt"),
  songTemplate: document.querySelector("#songTemplate")
};

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("title", "title", { unique: false });
      store.createIndex("artist", "artist", { unique: false });
      store.createIndex("createdAt", "createdAt", { unique: false });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(mode = "readonly") {
  return state.db.transaction(STORE, mode).objectStore(STORE);
}

function getAllSongs() {
  return new Promise((resolve, reject) => {
    const request = tx().getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveSong(song) {
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").put(song);
    request.onsuccess = () => resolve(song);
    request.onerror = () => reject(request.error);
  });
}

function deleteSong(id) {
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function clearSongs() {
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function parseFileName(fileName) {
  const clean = fileName.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim();
  const parts = clean.split(/\s+-\s+/);

  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(" - ").trim(),
      album: ""
    };
  }

  return {
    artist: "Sin artista",
    title: clean || fileName,
    album: ""
  };
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function makeId() {
  return `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`;
}

async function importFiles(files) {
  const audioFiles = [...files].filter((file) => file.type.startsWith("audio/") || AUDIO_TYPES.includes(file.type));

  for (const file of audioFiles) {
    const parsed = parseFileName(file.name);
    await saveSong({
      id: makeId(),
      title: parsed.title,
      artist: parsed.artist,
      album: parsed.album,
      fileName: file.name,
      fileType: file.type || "audio/mpeg",
      size: file.size,
      duration: await readDuration(file),
      createdAt: Date.now(),
      blob: file,
      sourceUrl: "",
      isPreview: false
    });
  }

  els.fileInput.value = "";
  await refreshSongs();
}

function readDuration(file) {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      cleanup();
      resolve(Number.isFinite(duration) ? duration : 0);
    };
    audio.onerror = () => {
      cleanup();
      resolve(0);
    };
    audio.src = url;
  });
}

function createPreviewBlob(seed = 220) {
  const sampleRate = 44100;
  const duration = 8;
  const samples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.min(1, t * 3, (duration - t) * 2);
    const wave = Math.sin(2 * Math.PI * seed * t) * 0.58 + Math.sin(2 * Math.PI * (seed * 1.5) * t) * 0.22;
    view.setInt16(44 + i * 2, wave * envelope * 22000, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view, offset, value) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

async function addPreviewSongs() {
  const previews = [
    ["Luz de medianoche", "Preview local", "Bocetos", 196],
    ["Ruta del verano", "Preview local", "Bocetos", 246],
    ["Cinta azul", "Preview local", "Bocetos", 294]
  ];

  for (const [title, artist, album, tone] of previews) {
    await saveSong({
      id: makeId(),
      title,
      artist,
      album,
      fileName: `${artist} - ${title}.wav`,
      fileType: "audio/wav",
      size: 0,
      duration: 8,
      createdAt: Date.now(),
      blob: createPreviewBlob(tone),
      isPreview: true
    });
  }

  await refreshSongs();
}

async function addEmptySong() {
  await saveSong({
    id: makeId(),
    title: "Nueva canción",
    artist: "Sin artista",
    album: "",
    fileName: "",
    fileType: "",
    size: 0,
    duration: 0,
    createdAt: Date.now(),
    blob: null,
    sourceUrl: "",
    isPreview: false
  });
  await refreshSongs();
}

function loadRepoSongs() {
  const catalog = Array.isArray(window.REPO_SONGS) ? window.REPO_SONGS : DEFAULT_REPO_SONGS;
  state.repoSongs = catalog.map((song, index) => ({
    ...song,
    id: song.id || `repo-${index}`,
    size: 0,
    createdAt: 0,
    blob: null,
    isRepoFile: true
  }));
}

async function refreshSongs() {
  const storedSongs = await getAllSongs();
  const storedIds = new Set(storedSongs.map((song) => song.id));
  state.songs = [
    ...state.repoSongs.filter((song) => !storedIds.has(song.id)),
    ...storedSongs
  ];
  applyFilters();
}

function applyFilters() {
  const term = els.searchInput.value.trim().toLowerCase();
  const [sortKey, sortDirection] = els.sortSelect.value.split("-");

  state.filteredSongs = state.songs
    .filter((song) => {
      const haystack = `${song.title} ${song.artist} ${song.album} ${song.fileName}`.toLowerCase();
      return haystack.includes(term);
    })
    .sort((a, b) => {
      const left = a[sortKey] ?? "";
      const right = b[sortKey] ?? "";
      if (typeof left === "number" && typeof right === "number") {
        return sortDirection === "asc" ? left - right : right - left;
      }
      return sortDirection === "asc"
        ? String(left).localeCompare(String(right), "es")
        : String(right).localeCompare(String(left), "es");
    });

  renderSongs();
}

function renderSongs() {
  els.songList.replaceChildren();
  els.songCount.textContent = `${state.songs.length} ${state.songs.length === 1 ? "canción" : "canciones"}`;
  els.emptyState.classList.toggle("is-visible", state.songs.length === 0);
  els.clearButton.disabled = state.songs.length === 0;

  for (const song of state.filteredSongs) {
    const row = els.songTemplate.content.firstElementChild.cloneNode(true);
    const playButton = row.querySelector(".play-button");
    const titleInput = row.querySelector(".title-input");
    const artistInput = row.querySelector(".artist-input");
    const albumInput = row.querySelector(".album-input");
    const attachInput = row.querySelector(".attach-input");
    const attachLabel = row.querySelector(".attach-button span");
    const duration = row.querySelector(".duration");
    const deleteButton = row.querySelector(".delete-button");

    row.classList.toggle("is-active", song.id === state.activeId);
    titleInput.value = song.title;
    artistInput.value = song.artist;
    albumInput.value = song.album;
    duration.textContent = formatDuration(song.duration);
    playButton.disabled = !song.blob && !song.sourceUrl;
    attachLabel.textContent = song.blob || song.sourceUrl ? "Cambiar" : "Poner archivo";
    playButton.textContent = song.id === state.activeId && !els.audioPlayer.paused ? "Ⅱ" : "▶";

    playButton.addEventListener("click", () => playSong(song));
    attachInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const parsed = parseFileName(file.name);
      await saveSong({
        ...song,
        id: song.isRepoFile ? `${song.id}-personal` : song.id,
        title: song.title === "Nueva canción" ? parsed.title : song.title,
        artist: song.artist === "Sin artista" ? parsed.artist : song.artist,
        fileName: file.name,
        fileType: file.type || "audio/mpeg",
        size: file.size,
        duration: await readDuration(file),
        blob: file,
        sourceUrl: "",
        isRepoFile: false,
        isPreview: false
      });
      await refreshSongs();
    });
    deleteButton.addEventListener("click", async () => {
      if (song.isRepoFile) {
        alert("Esta canción viene como archivo del repositorio. Para quitarla, borra su entrada en catalog.js o elimina el archivo de media/previews.");
        return;
      }
      if (!confirm(`¿Eliminar "${song.title}" de la base?`)) return;
      await deleteSong(song.id);
      if (state.activeId === song.id) resetPlayer();
      await refreshSongs();
    });

    const updateField = debounce(async () => {
      await saveSong({
        ...song,
        title: titleInput.value.trim() || "Sin título",
        artist: artistInput.value.trim() || "Sin artista",
        album: albumInput.value.trim()
      });
      await refreshSongs();
    }, 350);

    titleInput.addEventListener("input", updateField);
    artistInput.addEventListener("input", updateField);
    albumInput.addEventListener("input", updateField);

    els.songList.append(row);
  }
}

function debounce(fn, delay) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function playSong(song) {
  if (!song.blob && !song.sourceUrl) {
    els.playerStatus.textContent = "Sin archivo";
    els.playerTitle.textContent = song.title;
    els.playerMeta.textContent = "Usa el botón Poner archivo en esta canción.";
    return;
  }

  if (state.activeId === song.id && !els.audioPlayer.paused) {
    els.audioPlayer.pause();
    renderSongs();
    return;
  }

  if (state.activeUrl) URL.revokeObjectURL(state.activeUrl);

  state.activeId = song.id;
  state.activeUrl = song.blob ? URL.createObjectURL(song.blob) : "";
  els.audioPlayer.src = song.blob ? state.activeUrl : song.sourceUrl;
  els.playerStatus.textContent = song.isPreview ? "Preview local" : "Reproduciendo";
  els.playerTitle.textContent = song.title;
  els.playerMeta.textContent = [song.artist, song.album].filter(Boolean).join(" · ") || song.fileName;
  els.coverArt.textContent = song.title.trim().charAt(0).toUpperCase() || "♪";
  renderSongs();

  try {
    await els.audioPlayer.play();
  } catch {
    els.playerStatus.textContent = "Pulsa play";
  }
}

function resetPlayer() {
  if (state.activeUrl) URL.revokeObjectURL(state.activeUrl);
  state.activeId = null;
  state.activeUrl = null;
  els.audioPlayer.removeAttribute("src");
  els.audioPlayer.load();
  els.playerStatus.textContent = "Listo para reproducir";
  els.playerTitle.textContent = "Selecciona una canción";
  els.playerMeta.textContent = "Añade archivos o usa el preview.";
  els.coverArt.textContent = "♪";
}

els.fileInput.addEventListener("change", (event) => importFiles(event.target.files));
els.newSongButton.addEventListener("click", addEmptySong);
els.addDemoButton.addEventListener("click", addPreviewSongs);
els.searchInput.addEventListener("input", applyFilters);
els.sortSelect.addEventListener("change", applyFilters);
els.audioPlayer.addEventListener("play", renderSongs);
els.audioPlayer.addEventListener("pause", renderSongs);
els.audioPlayer.addEventListener("ended", renderSongs);
els.clearButton.addEventListener("click", async () => {
  if (!confirm("¿Vaciar toda la base de canciones de este navegador?")) return;
  resetPlayer();
  await clearSongs();
  await refreshSongs();
});

openDb()
  .then(async (db) => {
    state.db = db;
    loadRepoSongs();
    await refreshSongs();
  })
  .catch(() => {
    els.emptyState.classList.add("is-visible");
    els.emptyState.innerHTML = "<h3>No se pudo abrir la base local</h3><p>Prueba con un navegador moderno como Chrome, Edge o Firefox.</p>";
  });
