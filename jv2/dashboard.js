const activeUserKey = "basicNeonActiveUser";
const activeUser = JSON.parse(localStorage.getItem(activeUserKey));
const currentUser = activeUser || { name: "Usuario", email: "" };

const albums = [
  { artist: "Tems", album: "For Broken Ears", search: "Tems For Broken Ears" , clave:"Tems" },
  { artist: "KAROL G", album: "Manana Sera Bonito", search: "Karol G Manana Sera Bonito" , clave:"Karol" },
  { artist: "Rosalia", album: "Motomami", search: "Rosalia Motomami" , clave:"Rosalia" },
  { artist: "Rihanna", album: "ANTI", search: "Rihanna ANTI" , clave:"Riri" },
  { artist: "Lady Gaga", album: "Chromatica", search: "Lady Gaga Chromatica" , clave:"Lady" },
  { artist: "Arctic Monkeys", album: "AM", search: "Arctic Monkeys AM" , clave:"Artic" },
  { artist: "Extremoduro", album: "Agila", search: "Extremoduro Agila" , clave:"Extremoduro" },
  { artist: "Heroes del Silencio", album: "Senderos de Traicion", search: "Heroes del Silencio Senderos de Traicion" , clave:"Heroes" },
  { artist: "Manu Chao", album: "Clandestino", search: "Manu Chao Clandestino" , clave:"Manu"},
  { artist: "Bob Marley", album: "Legend", search: "Bob Marley Legend", clave:"Bob"},
  { artist: "Dave", album: "Psychodrama", search: "Dave Psychodrama" , clave:"Dave"},
  { artist: "Dua Lipa", album: "Future Nostalgia", search: "Dua Lipa Future Nostalgia" , clave:"Dua" }
];

if (!activeUser) {
  window.location.href = "index.html";
}

const songsList = document.querySelector(".songs-list");
const counterSpan = document.getElementById("track-counter");
const favoriteSongs = document.querySelector("#favoriteSongs");
const favoritesEmpty = document.querySelector("#favoritesEmpty");
const likedSongsSection = document.querySelector("#likedSongsSection");
const showLikedSongsBtn = document.querySelector("#showLikedSongsBtn");
const audioPlayer = document.querySelector("#audioPlayer");
const currentTime = document.querySelector("#currentTime");
const totalTime = document.querySelector("#totalTime");
const songProgress = document.querySelector("#songProgress");
const playPauseBtn = document.querySelector("#playPauseBtn");
const favoritesStorageKey = `pinkMusicFavorites:${currentUser.email || "invitado"}`;
const favoriteItems = new Map();

const welcomeName = document.querySelector("#welcomeName");
const welcomeEmail = document.querySelector("#welcomeEmail");
const logoutBtn = document.querySelector("#logoutBtn");
const albumGrid = document.querySelector("#albumGrid");
const musicSearch = document.querySelector("#musicSearch");
const searchResults = document.querySelector("#searchResults");
const searchEmpty = document.querySelector("#searchEmpty");
const albumSongsSection = document.querySelector("#albumSongsSection");
const albumSongsCover = document.querySelector("#albumSongsCover");
const albumSongsTitle = document.querySelector("#albumSongsTitle");
const albumSongsMeta = document.querySelector("#albumSongsMeta");
const albumSongsDescription = document.querySelector("#albumSongsDescription");
const albumSongsList = document.querySelector("#albumSongsList");
const backToAlbumsBtn = document.querySelector("#backToAlbumsBtn");

welcomeName.textContent = `Bienvenido, ${currentUser.name}`;
welcomeEmail.textContent = currentUser.email;

function getSelectedSongsCount() {
  return favoriteItems.size;
}

function updateFavoriteCounter() {
  const total = getSelectedSongsCount();
  counterSpan.textContent = `${total} ${total === 1 ? "cancion seleccionada" : "canciones seleccionadas"}`;
  favoritesEmpty.hidden = total > 0;
}

function getStoredFavorites() {
  return JSON.parse(localStorage.getItem(favoritesStorageKey)) || [];
}

function saveStoredFavorites() {
  localStorage.setItem(favoritesStorageKey, JSON.stringify([...favoriteItems.values()]));
}

function getSongData(song) {
  return {
    id: song.dataset.songId,
    title: song.querySelector(".song-info h3").textContent,
    artist: song.querySelector(".song-info p").textContent,
    album: song.querySelector(".album").textContent,
    duration: song.querySelector(".duration").textContent,
    cover: song.querySelector("img").src,
    audio: song.dataset.audio || ""
  };
}

function syncLikeButtons(songId, isLiked) {
  document.querySelectorAll(`.song[data-song-id="${songId}"] .like`).forEach((button) => {
    button.classList.toggle("liked", isLiked);
    button.textContent = isLiked ? "\u2665" : "\u2661";
    button.setAttribute("aria-pressed", String(isLiked));
  });
}

function addFavoriteSong(songOrData) {
  const data = songOrData instanceof HTMLElement ? getSongData(songOrData) : songOrData;
  if (favoriteSongs.querySelector(`[data-favorite-id="${data.id}"]`)) return;

  favoriteItems.set(data.id, data);

  const item = document.createElement("article");
  item.className = "favorite-song";
  item.dataset.favoriteId = data.id;
  item.innerHTML = `
    <img src="${data.cover}" alt="Portada de ${data.title}">
    <div>
      <h3>${data.title}</h3>
      <p>${data.artist}</p>
      <span>${data.album} - ${data.duration}</span>
    </div>
  `;

  favoriteSongs.prepend(item);
}

function removeFavoriteSong(songOrId) {
  const songId = typeof songOrId === "string" ? songOrId : songOrId.dataset.songId;
  const item = favoriteSongs.querySelector(`[data-favorite-id="${songId}"]`);
  favoriteItems.delete(songId);
  if (item) item.remove();
}

function restoreStoredFavorites() {
  getStoredFavorites().forEach((storedFavorite) => {
    const songId = typeof storedFavorite === "string" ? storedFavorite : storedFavorite.id;
    const song = songsList.querySelector(`[data-song-id="${songId}"]`);

    if (song) {
      addFavoriteSong(song);
      syncLikeButtons(songId, true);
      return;
    }

    if (storedFavorite && typeof storedFavorite === "object") {
      addFavoriteSong(storedFavorite);
    }
  });
}

function formatPlayerTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function getSongDurationInSeconds(song) {
  const durationText = song.querySelector(".duration")?.textContent.trim() || "0:00";
  const [minutes = 0, seconds = 0] = durationText.split(":").map(Number);
  return (minutes * 60) + seconds;
}

function getPlayerDuration() {
  const realDuration = audioPlayer?.duration;
  const fallbackDuration = Number(audioPlayer?.dataset.fallbackDuration) || 0;

  return Number.isFinite(realDuration) && realDuration > 0
    ? realDuration
    : fallbackDuration;
}

function updatePlayerFromSong(song) {
  const data = getSongData(song);
  updatePlayerFromSongData(data, getSongDurationInSeconds(song));
}

function updatePlayerFromSongData(data, fallbackSeconds) {
  const duration = fallbackSeconds ?? getDurationTextInSeconds(data.duration);
  const coverBox = document.querySelector(".cover-box");
  const title = document.querySelector(".Albumtitulo");
  const artist = document.querySelector(".Albumtipo");

  coverBox.innerHTML = '<img src="' + data.cover + '" alt="Portada de ' + data.title + '">';
  title.textContent = data.title;
  artist.textContent = data.artist;

  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load(); // limpia la fuente anterior sin error
    if (data.audio) {
      audioPlayer.src = data.audio;
      audioPlayer.dataset.fallbackDuration = String(duration);
      audioPlayer.currentTime = 0;
      audioPlayer.load();
    }
  }

  if (playPauseBtn) {
    playPauseBtn.textContent = "▶";
    playPauseBtn.setAttribute("aria-label", "Reproducir cancion");
  }

  totalTime.textContent = formatPlayerTime(duration);
  currentTime.textContent = "0:00";
  songProgress.min = "0";
  songProgress.max = String(duration);
  songProgress.value = "0";
}

function getDurationTextInSeconds(durationText) {
  const [minutes = 0, seconds = 0] = String(durationText || "0:00").split(":").map(Number);
  return (minutes * 60) + seconds;
}

function updatePlayerProgress() {
  const duration = getPlayerDuration();
  const elapsed = audioPlayer?.currentTime || 0;
  currentTime.textContent = formatPlayerTime(elapsed);
  totalTime.textContent = formatPlayerTime(duration);
  songProgress.max = String(duration || 0);
  songProgress.value = String(Math.min(elapsed, duration || elapsed));
}

const songDescriptions = {
  "Blinding Lights": "Tema pop con energia ochentera, sintetizadores brillantes y ritmo perfecto para abrir una playlist.",
  "As It Was": "Cancion pop ligera y melancolica, con una melodia directa y un sonido muy limpio.",
  "Kingston Town": "Clasico reggae-pop relajado, ideal para un ambiente tranquilo y calido.",
  "Wonderwall": "Balada rock muy conocida, con guitarras acusticas y tono nostalgico.",
  "Sweet Home Alabama": "Rock sureno con guitarras potentes y un estribillo muy reconocible.",
  "Angel": "Mezcla suave de reggae y pop, con ritmo amable y ambiente romantico."
};

const artistDescriptions = {
  "The Weeknd": "Artista canadiense de pop y R&B, conocido por sonidos nocturnos, sintetizadores y melodias pegadizas.",
  "Harry Styles": "Cantante britanico de pop y rock suave, con canciones luminosas y estribillos faciles de recordar.",
  "UB40": "Grupo britanico de reggae pop, famoso por adaptar el reggae a un sonido accesible.",
  "Oasis": "Banda britanica de rock alternativo, clave en el britpop de los anos 90.",
  "Lynyrd Skynyrd": "Banda estadounidense de rock sureno, con guitarras reconocibles y canciones de estadio.",
  "Shaggy": "Artista jamaicano-estadounidense que mezcla reggae, dancehall y pop."
};
const urlDescriptions = {
  "The Weeknd": "Artista canadiense de pop y R&B, conocido por sonidos nocturnos, sintetizadores y melodias pegadizas.",
  "Harry Styles": "Cantante britanico de pop y rock suave, con canciones luminosas y estribillos faciles de recordar.",
  "UB40": "Grupo britanico de reggae pop, famoso por adaptar el reggae a un sonido accesible.",
  "Oasis": "Banda britanica de rock alternativo, clave en el britpop de los anos 90.",
  "Lynyrd Skynyrd": "Banda estadounidense de rock sureno, con guitarras reconocibles y canciones de estadio.",
  "Tonada": {url:"music/el_golpe_de_mi_tambo.mp3"},
};
const albumTrackLists = {
  Tems: [
    { title: "Interference", duration: "2:50", url: "" },
    { title: "Ice T", duration: "3:40", url: "" },
    { title: "Free Mind", duration: "4:07", url: "" },
    { title: "Higher", duration: "3:16", url: "" },
    { title: "Damages", duration: "2:49", url: "" },
    { title: "The Key", duration: "2:45", url: "" },
    { title: "Where You Are", duration: "2:48", url: "" }
  ],
  Karol: [
    { title: "Mientras Me Curo Del Cora", duration: "2:44", url:"music/KAROL G - Mientras Me Curo Del Cora (Official Video).mp3"},
    { title: "X Si Volvemos", duration: "3:20", url:"music/KAROL G - Besties (Visualizer).mp3" },
    { title: "Pero Tu", duration: "3:03", url:"music/KAROL G, Quevedo - Pero Tú (Visualizer).mp3" },
    { title: "Besties", duration: "2:42", url:"music/KAROL G - Besties (Visualizer).mp3"},
    { title: "Gucci Los Paños", duration: "3:06", url:"music/KAROL G - GUCCI LOS PAÑOS (Visualizer).mp3"},
    { title: "TQG", duration: "3:18", url:"music/KAROL G - Besties (Visualizer).mp3" },
    { title: "Tus Gafitas", duration: "2:47", url:"music/KAROL G - Besties (Visualizer).mp3" },
    { title: "Ojos Ferrari", duration: "3:00", url:"music/KAROL G, Justin Quiles, Angel Dior - Ojos Ferrari (Visualizer).mp3"},
    { title: "Mercurio", duration: "2:40", url:"music/KAROL G - Mercurio (Visualizer).mp3" },
    { title: "Gatubela", duration: "3:28", url:"music/KAROL G - Besties (Visualizer).mp3" },
    { title: "Karmika", duration: "3:56", url:"music/KAROL G, Bad Gyal, Sean Paul - Kármika (Visualizer).mp3" },
    { title: "Provenza", duration: "3:30", url:"music/KAROL G - Besties (Visualizer).mp3" },
    { title: "Carolina", duration: "2:43", url:"music/KAROL G - Besties (Visualizer).mp3" },
    { title: "Dañanos La Amistad", duration: "3:03", url:"music/KAROL G, Sech - Dañamos La Amistad (Visualizer).mp3" },
    { title: "Amargura", duration: "2:51", url:"music/KAROL G - Amargura (Visualizer).mp3" },
    { title: "Cairo", duration: "3:18", url:"music/KAROL G - Besties (Visualizer).mp3" },
    { title: "Mañana Sera Bonito", duration: "3:30", url:"music/KAROL G - Besties (Visualizer).mp3" }
  ],
  Rosalia: [
    { title: "Saoko", duration: "2:17", url: "" },
    { title: "Candy", duration: "3:13", url: "" },
    { title: "La Fama", duration: "3:08", url: "" },
    { title: "Bulerias", duration: "2:35", url: "" },
    { title: "Chicken Teriyaki", duration: "2:02", url: "" },
    { title: "Hentai", duration: "2:42", url: "" },
    { title: "Bizcochito", duration: "1:49", url: "" },
    { title: "G3 N15", duration: "4:12", url: "" },
    { title: "Motomami", duration: "1:01", url: "" },
    { title: "Diablo", duration: "2:45", url: "" },
    { title: "Delirio de Grandeza", duration: "2:35", url: "" },
    { title: "Cuuuuuuuuuute", duration: "2:30", url: "" },
    { title: "Como Un G", duration: "4:22", url: "" },
    { title: "Abcdefg", duration: "1:05", url: "" },
    { title: "La Combi Versace", duration: "2:40", url: "" },
    { title: "Sakura", duration: "3:21", url: "" }
  ],
  Riri: [
    { title: "Consideration", duration: "2:41", url: "" },
    { title: "James Joint", duration: "1:12", url: "" },
    { title: "Kiss It Better", duration: "4:13", url: "" },
    { title: "Work", duration: "3:39", url: "" },
    { title: "Desperado", duration: "3:06", url: "" },
    { title: "Woo", duration: "3:55", url: "" },
    { title: "Needed Me", duration: "3:11", url: "" },
    { title: "Yeah, I Said It", duration: "2:13", url: "" },
    { title: "Same Ol' Mistakes", duration: "6:37", url: "" },
    { title: "Never Ending", duration: "3:22", url: "" },
    { title: "Love On The Brain", duration: "3:44", url: "" },
    { title: "Higher", duration: "2:00", url: "" },
    { title: "Close To You", duration: "3:43", url: "" },
    { title: "Goodnight Gotham", duration: "1:28", url: "" },
    { title: "Pose", duration: "2:24", url: "" },
    { title: "Sex With Me", duration: "3:26", url: "" }
  ],
  Lady: [
    { title: "Chromatica I", duration: "1:00", url: ""},
    { title: "Alice", duration: "2:57", url: "" },
    { title: "Stupid Love", duration: "3:13", url: "" },
    { title: "Rain On Me", duration: "3:02", url: "" },
    { title: "Free Woman", duration: "3:11", url: "" },
    { title: "Fun Tonight", duration: "2:53", url: "" },
    { title: "Chromatica II", duration: "0:41", url: "" },
    { title: "911", duration: "2:52", url: "" },
    { title: "Plastic Doll", duration: "3:41", url: "" },
    { title: "Sour Candy", duration: "2:37", url: "" },
    { title: "Enigma", duration: "2:59", url: "" },
    { title: "Replay", duration: "3:06", url: "" },
    { title: "Chromatica III", duration: "0:27", url: "" },
    { title: "Sine From Above", duration: "4:04", url: "" },
    { title: "1000 Doves", duration: "3:35", url: "" },
    { title: "Babylon", duration: "2:41", url: "" }
  ],
  Artic: [
    { title: "Do I Wanna Know?", duration: "4:32", url: "" },
    { title: "R U Mine?", duration: "3:21", url: "" },
    { title: "One For The Road", duration: "3:26", url: "" },
    { title: "Arabella", duration: "3:27", url: "" },
    { title: "I Want It All", duration: "3:04", url: "" },
    { title: "No. 1 Party Anthem", duration: "4:03", url: "" },
    { title: "Mad Sounds", duration: "3:35", url: "" },
    { title: "Fireside", duration: "3:01", url: "" },
    { title: "Why'd You Only Call Me When You're High?", duration: "2:41", url: "" },
    { title: "Snap Out Of It", duration: "3:13", url: "" },
    { title: "Knee Socks", duration: "4:17", url: "" },
    { title: "I Wanna Be Yours", duration: "3:04", url: "" }
  ],
  Extremoduro: [
    { title: "Buscando Una Luna", duration: "4:22", url: "" },
    { title: "Prometeo", duration: "4:06", url: "" },
    { title: "Sucede", duration: "3:11", url: "" },
    { title: "So Payaso", duration: "4:40", url: "" },
    { title: "El Dia De La Bestia", duration: "4:35", url: "" },
    { title: "Tomas", duration: "4:16", url: "" },
    { title: "Que Sonrisa Tan Rara", duration: "3:58", url: "" },
    { title: "Cabezabajo", duration: "4:03", url: "" },
    { title: "Abreme El Pecho Y Registra", duration: "3:58", url: "" },
    { title: "Todos Me Dicen", duration: "4:30", url: "" },
    { title: "Correcaminos Estate Al Loro", duration: "3:19", url: "" },
    { title: "La Carrera", duration: "4:05", url: "" },
    { title: "Me Estoy Quitando", duration: "4:03", url: "" }
  ],
  Heroes: [
    { title: "Entre Dos Tierras", duration: "6:08", url: "" },
    { title: "Maldito Duende", duration: "4:14", url: "" },
    { title: "La Carta", duration: "3:06", url: "" },
    { title: "Malas Intenciones", duration: "3:48", url: "" },
    { title: "Sal", duration: "4:19", url: "" },
    { title: "Senda", duration: "3:56", url: "" },
    { title: "Hechizo", duration: "4:31", url: "" },
    { title: "Oracion", duration: "4:05", url: "" },
    { title: "Despertar", duration: "2:48", url: "" },
    { title: "Decadencia", duration: "4:18", url: "" },
    { title: "Con Nombre De Guerra", duration: "4:16", url: "" },
    { title: "El Cuadro II", duration: "2:47", url: "" }
  ],
  Manu: [
    { title: "Clandestino", duration: "2:28", url: "" },
    { title: "Desaparecido", duration: "3:47", url: "" },
    { title: "Bongo Bong", duration: "2:38", url: "" },
    { title: "Je Ne T'aime Plus", duration: "2:04", url: "" },
    { title: "Mentira", duration: "4:37", url: "" },
    { title: "Lagrimas De Oro", duration: "2:59", url: "" },
    { title: "Mama Call", duration: "2:21", url: "" },
    { title: "Luna Y Sol", duration: "3:07", url: "" },
    { title: "Por El Suelo", duration: "2:21", url: "" },
    { title: "Welcome To Tijuana", duration: "4:04", url: "" },
    { title: "Dia Luna Dia Pena", duration: "1:30", url: "" },
    { title: "Malegria", duration: "2:55", url: "" },
    { title: "La Vie A 2", duration: "3:00", url: "" },
    { title: "Minha Galera", duration: "2:21", url: "" },
    { title: "La Despedida", duration: "3:08", url: "" },
    { title: "El Viento", duration: "2:26", url: "" }
  ],
  Bob: [
    { title: "Is This Love", duration: "3:52", url: "" },
    { title: "No Woman, No Cry", duration: "4:06", url: "" },
    { title: "Could You Be Loved", duration: "3:57", url: "" },
    { title: "Three Little Birds", duration: "3:00", url: "" },
    { title: "Buffalo Soldier", duration: "4:18", url: "" },
    { title: "Get Up, Stand Up", duration: "3:17", url: "" },
    { title: "Stir It Up", duration: "5:30", url: "" },
    { title: "Easy Skanking", duration: "2:53", url: "" },
    { title: "One Love / People Get Ready", duration: "2:52", url: "" },
    { title: "I Shot The Sheriff", duration: "4:41", url: "" },
    { title: "Waiting In Vain", duration: "4:16", url: "" },
    { title: "Redemption Song", duration: "3:47", url: "" },
    { title: "Satisfy My Soul", duration: "4:31", url: "" },
    { title: "Exodus", duration: "7:40", url: "" },
    { title: "Jamming", duration: "3:32", url: "" }
  ],
  Dave: [
    { title: "Psycho", duration: "4:08", url: "" },
    { title: "Streatham", duration: "3:25", url: "" },
    { title: "Black", duration: "3:48", url: "" },
    { title: "Purple Heart", duration: "2:44", url: "" },
    { title: "Location", duration: "4:01", url: "" },
    { title: "Disaster", duration: "4:00", url: "" },
    { title: "Screwface Capital", duration: "4:13", url: "" },
    { title: "Environment", duration: "3:24", url: "" },
    { title: "Lesley", duration: "11:08", url: "" },
    { title: "Voices", duration: "3:18", url: "" },
    { title: "Drama", duration: "7:04", url: "" }
  ],
  Dua: [
    { title: "Future Nostalgia", duration: "3:04", url: "" },
    { title: "Don't Start Now", duration: "3:03", url: "" },
    { title: "Cool", duration: "3:29", url: "" },
    { title: "Physical", duration: "3:13", url: "" },
    { title: "Levitating", duration: "3:23", url: "" },
    { title: "Pretty Please", duration: "3:15", url: "" },
    { title: "Hallucinate", duration: "3:28", url: "" },
    { title: "Love Again", duration: "4:18", url: "" },
    { title: "Break My Heart", duration: "3:41", url: "" },
    { title: "Good In Bed", duration: "3:38", url: "" },
    { title: "Boys Will Be Boys", duration: "2:46", url: "" }
  ]
};

function normalizeSearchText(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getSongSearchText(song) {
  return normalizeSearchText([
    song.querySelector(".song-info h3")?.textContent,
    song.querySelector(".song-info p")?.textContent,
    song.querySelector(".album")?.textContent
  ].join(" "));
}

function buildSongResult(song) {
  const data = getSongData(song);

  return {
    type: "Cancion",
    title: data.title,
    subtitle: data.artist,
    image: data.cover,
    description: songDescriptions[data.title] || `${data.title} es una cancion de ${data.artist}, incluida en ${data.album}. Duracion: ${data.duration}.`,
    searchText: normalizeSearchText(`${data.title} ${data.artist} ${data.album}`),
    action: () => {
      updatePlayerFromSong(song);
      likedSongsSection.classList.remove("is-hidden");
      showLikedSongsBtn.setAttribute("aria-expanded", "true");
      song.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
}

function buildAlbumResult(album, card) {
  return {
    type: "Album",
    title: album.album,
    subtitle: album.artist,
    image: card?.querySelector("img")?.src || "",
    description: `${album.album} es un album recomendado de ${album.artist}. Aparece en la zona de albumes recomendados.`,
    searchText: normalizeSearchText(`${album.artist} ${album.album} ${album.search}`),
    action: () => openAlbumSongs(album)
  };
}

function buildArtistResults(songResults, albumResults) {
  const artists = new Map();

  [...songResults, ...albumResults].forEach((result) => {
    if (artists.has(result.subtitle)) return;

    artists.set(result.subtitle, {
      type: "Artista",
      title: result.subtitle,
      subtitle: result.type === "Cancion" ? "Artista en canciones" : "Artista en albumes",
      image: result.image,
      description: artistDescriptions[result.subtitle] || `${result.subtitle} aparece en tu biblioteca musical dentro de canciones o albumes recomendados.`,
      searchText: normalizeSearchText(`${result.subtitle} artista ${result.title}`),
      action: result.action
    });
  });

  return [...artists.values()];
}

function renderSearchResults(results) {
  searchResults.innerHTML = "";

  results.forEach((result) => {
    const button = document.createElement("button");
    button.className = "search-result";
    button.type = "button";
    button.innerHTML = `
      ${result.image ? `<img src="${result.image}" alt="">` : `<span class="search-result-icon">${result.type[0]}</span>`}
      <span>
        <strong>${result.title}</strong>
        <small>${result.type} - ${result.subtitle}</small>
        <em>${result.description}</em>
      </span>
    `;

    button.addEventListener("click", result.action);
    searchResults.appendChild(button);
  });

  searchResults.hidden = results.length === 0;
}

function applyMusicSearch() {
  const query = normalizeSearchText(musicSearch.value.trim());
  const songs = [...songsList.querySelectorAll(".song")];
  const albumCards = [...albumGrid.querySelectorAll(".album-card")];
  const songResults = songs.map(buildSongResult);
  const albumResults = albums.map((album, index) => buildAlbumResult(album, albumCards[index]));
  const artistResults = buildArtistResults(songResults, albumResults);
  const allResults = [...songResults, ...artistResults, ...albumResults];
  const filteredResults = query
    ? allResults.filter((result) => result.searchText.includes(query))
    : [];

  songs.forEach((song) => {
    song.hidden = Boolean(query) && !getSongSearchText(song).includes(query);
  });

  albumCards.forEach((card) => {
    card.hidden = Boolean(query) && !normalizeSearchText(card.dataset.search || card.textContent).includes(query);
  });

  if (query && likedSongsSection.classList.contains("is-hidden")) {
    likedSongsSection.classList.remove("is-hidden");
    showLikedSongsBtn.setAttribute("aria-expanded", "true");
  }

  renderSearchResults(filteredResults);
  searchEmpty.hidden = !query || filteredResults.length > 0;
}

if (songsList && counterSpan && favoriteSongs && favoritesEmpty) {
  restoreStoredFavorites();

  songsList.addEventListener("click", (event) => {
    const button = event.target.closest(".like");
    const song = event.target.closest(".song");
    if (!song) return;

    if (!button) {
      updatePlayerFromSong(song);
      return;
    }

    const isLiked = button.classList.toggle("liked");

    if (isLiked) {
      addFavoriteSong(song);
    } else {
      removeFavoriteSong(song);
    }

    syncLikeButtons(song.dataset.songId, isLiked);
    updateFavoriteCounter();
    saveStoredFavorites();
  });

  updateFavoriteCounter();
}

if (favoriteSongs && songsList) {
  favoriteSongs.addEventListener("click", (event) => {
    const favoriteItem = event.target.closest(".favorite-song");
    if (!favoriteItem) return;

    const originalSong = songsList.querySelector(`[data-song-id="${favoriteItem.dataset.favoriteId}"]`);
    if (originalSong) {
      updatePlayerFromSong(originalSong);
      return;
    }

    const storedFavorite = favoriteItems.get(favoriteItem.dataset.favoriteId);
    if (storedFavorite) updatePlayerFromSongData(storedFavorite);
  });
}

if (albumSongsList) {
  albumSongsList.addEventListener("click", (event) => {
    const button = event.target.closest(".like");
    const song = event.target.closest(".song");
    if (!song) return;

    if (button) {
      const isLiked = !button.classList.contains("liked");

      if (isLiked) {
        addFavoriteSong(song);
      } else {
        removeFavoriteSong(song);
      }

      syncLikeButtons(song.dataset.songId, isLiked);
      updateFavoriteCounter();
      saveStoredFavorites();
      return;
    }

    updatePlayerFromSong(song);
    document.querySelector(".playing-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

if (backToAlbumsBtn && albumSongsSection) {
  backToAlbumsBtn.addEventListener("click", () => {
    albumSongsSection.classList.add("is-hidden");
    document.querySelector(".albums-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (showLikedSongsBtn && likedSongsSection) {
  showLikedSongsBtn.addEventListener("click", () => {
    const isHidden = likedSongsSection.classList.toggle("is-hidden");
    showLikedSongsBtn.setAttribute("aria-expanded", String(!isHidden));
  });
}

if (audioPlayer && songProgress && currentTime && totalTime) {
  audioPlayer.addEventListener("timeupdate", updatePlayerProgress);
  audioPlayer.addEventListener("loadedmetadata", updatePlayerProgress);
  audioPlayer.addEventListener("ended", () => {
    if (playPauseBtn) {
      playPauseBtn.textContent = "▶";
      playPauseBtn.setAttribute("aria-label", "Reproducir cancion");
    }
  });

  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
      if (!audioPlayer.src || audioPlayer.src === window.location.href) return;
      if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.textContent = "❚❚";
        playPauseBtn.setAttribute("aria-label", "Pausar cancion");
      } else {
        audioPlayer.pause();
        playPauseBtn.textContent = "▶";
        playPauseBtn.setAttribute("aria-label", "Reproducir cancion");
      }
    });
  }

  songProgress.addEventListener("input", () => {
    audioPlayer.currentTime = Number(songProgress.value) || 0;
    updatePlayerProgress();
  });
}

function createAlbumCard(album) {
  const card = document.createElement("article");
  card.className = "album-card";
  card.dataset.search = `${album.artist} ${album.album} ${album.search}`;
  card.innerHTML = `
    <div class="album-art"><span>${album.artist}</span></div>
    <h3>${album.album}</h3>
    <p>${album.artist}</p>
  `;
  card.addEventListener("click", () => openAlbumSongs(album));
  return card;
}

function getAlbumArtwork(album) {
  const albumImage = albumGrid.querySelector(`[data-clave="${album.clave}"]`);
  return albumImage?.getAttribute("src") || "";
}

function createAlbumTrackElement(album, track, index, artwork) {
  const song = document.createElement("article");
  song.className = "song album-track";
  song.dataset.songId = `${album.clave}-${index + 1}`;
  song.dataset.audio = track.url || "";
  song.innerHTML = `
    <span class="number">${index + 1}</span>
    <img src="${artwork}" alt="Portada de ${album.album}">
    <div class="song-info">
      <h3>${track.title}</h3>
      <p>${album.artist}</p>
      <small>${track.description || `Cancion de ${album.album}`}</small>
    </div>
    <span class="album">${album.album}</span>
    <button class="like" type="button" aria-label="Anadir ${track.title} a favoritos" aria-pressed="false">♡</button>
    <span class="duration">${track.duration}</span>
  `;
  syncLikeButtons(song.dataset.songId, favoriteItems.has(song.dataset.songId));
  return song;
}

function openAlbumSongs(album) {
  const tracks = albumTrackLists[album.clave] || [];
  const artwork = getAlbumArtwork(album);

  albumSongsCover.src = artwork;
  albumSongsCover.alt = `Portada de ${album.album}`;
  albumSongsTitle.textContent = album.album;
  albumSongsMeta.textContent = album.artist;
  albumSongsDescription.textContent = `Selecciona una cancion de ${album.album} para reproducirla en On playing.`;
  albumSongsList.innerHTML = "";

  tracks.forEach((track, index) => {
    albumSongsList.appendChild(createAlbumTrackElement(album, track, index, artwork));
  });

  albumSongsSection.classList.remove("is-hidden");
  albumSongsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getLargeArtwork(url) {
  return url.replace("100x100bb", "600x600bb");
}

async function loadAlbumCovers() {
  albumGrid.innerHTML = "";
  albums.forEach((album) => albumGrid.appendChild(createAlbumCard(album)));

  const cards = [...albumGrid.querySelectorAll(".album-card")];

  await Promise.all(albums.map(async (album, index) => {
    try {
      const query = encodeURIComponent(album.search);
      const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=1`);
      const data = await response.json();
      const artwork = data.results[0]?.artworkUrl100;

      if (!artwork) return;

      cards[index].querySelector(".album-art").innerHTML = `<img src="${getLargeArtwork(artwork)}" data-clave=${album.clave} alt="Portada de ${album.album} de ${album.artist}">`;
    } catch (error) {
      console.warn(`No se pudo cargar la portada de ${album.artist}`, error);
    }
  }));
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(activeUserKey);
  window.location.href = "index.html";
});

if (musicSearch && searchResults && searchEmpty && songsList && albumGrid) {
  musicSearch.addEventListener("input", applyMusicSearch);
}

loadAlbumCovers();
