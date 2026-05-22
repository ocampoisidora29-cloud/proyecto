const usersStorageKey = "basicNeonUsers";
const activeUserKey = "basicNeonActiveUser";

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const loginMessage = document.querySelector("#loginMessage");
const registerMessage = document.querySelector("#registerMessage");

function getStoredUsers() {
  return JSON.parse(localStorage.getItem(usersStorageKey)) || [];
}

function saveStoredUsers(users) {
  localStorage.setItem(usersStorageKey, JSON.stringify(users));
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle("error", isError);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setActiveUser(user) {
  localStorage.setItem(activeUserKey, JSON.stringify({
    name: user.name,
    email: user.email
  }));
}

if (localStorage.getItem(activeUserKey)) {
  window.location.href = "dashboard.html";
}

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.querySelector("#registerName").value.trim();
  const email = normalizeEmail(document.querySelector("#registerEmail").value);
  const password = document.querySelector("#registerPassword").value;
  const users = getStoredUsers();

  if (!name || !isValidEmail(email) || password.length < 6) {
    showMessage(registerMessage, "Completa nombre, correo y una contrasena de 6 caracteres como minimo.", true);
    return;
  }

  if (users.some((user) => user.email === email)) {
    showMessage(registerMessage, "Ese correo ya esta registrado. Inicia sesion con tu contrasena.", true);
    return;
  }

  const newUser = { name, email, password };
  users.push(newUser);
  saveStoredUsers(users);
  setActiveUser(newUser);
  showMessage(registerMessage, "Usuario creado. Entrando...");

  window.location.href = "dashboard.html";
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = normalizeEmail(document.querySelector("#loginEmail").value);
  const password = document.querySelector("#loginPassword").value;
  const users = getStoredUsers();
  const user = users.find((storedUser) => storedUser.email === email && storedUser.password === password);

  if (!isValidEmail(email) || !password) {
    showMessage(loginMessage, "Introduce un correo valido y tu contrasena.", true);
    return;
  }

  if (!user) {
    showMessage(loginMessage, "Correo o contrasena incorrectos.", true);
    return;
  }

  setActiveUser(user);
  showMessage(loginMessage, "Sesion iniciada. Entrando...");
  window.location.href = "dashboard.html";
});
