/* Akeed · Connexion — Prod by Oussema Jl
 * Les données du site (assets/js/data.enc.js) sont chiffrées en AES-256-GCM.
 * La clé est dérivée du mot de passe (PBKDF2-SHA256) : sans le bon mot de passe,
 * rien n'est lisible. Le mot de passe n'est stocké nulle part dans le site. */
(function () {
  "use strict";
  const E = window.SITE_ENC;
  const KEY_STORE = "akeed-key";
  const $ = (s) => document.querySelector(s);
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const login = $("#login"), form = $("#loginForm"), input = $("#loginPwd"), err = $("#loginErr"), btn = $("#loginBtn");

  function fail(msg) { err.textContent = msg; err.hidden = false; login.hidden = false; }

  if (!E) return fail("Données du site introuvables (assets/js/data.enc.js). Lancez « Mettre a jour le site.bat ».");
  if (!window.crypto || !crypto.subtle) return fail("Ce navigateur ne permet pas le déchiffrement. Ouvrez le site avec Chrome ou Edge.");

  async function deriveKey(pwd) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pwd), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(E.salt), iterations: E.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
  }
  async function decrypt(key) {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(E.iv) }, key, b64(E.data));
    return JSON.parse(new TextDecoder().decode(plain));
  }
  function start(data) {
    login.remove();
    document.body.classList.remove("locked");
    window.AKEED_START(data);
  }
  // clé gardée seulement pendant la session de l'onglet (fermer l'onglet = déconnexion)
  function remember(key) {
    crypto.subtle.exportKey("raw", key).then((raw) => { try { sessionStorage.setItem(KEY_STORE, E.salt + ":" + toB64(raw)); } catch (e) {} });
  }
  async function tryStored() {
    let v; try { v = sessionStorage.getItem(KEY_STORE); } catch (e) {}
    if (!v || !v.startsWith(E.salt + ":")) return false;
    try {
      const key = await crypto.subtle.importKey("raw", b64(v.slice(E.salt.length + 1)), { name: "AES-GCM" }, true, ["decrypt"]);
      start(await decrypt(key));
      return true;
    } catch (e) { try { sessionStorage.removeItem(KEY_STORE); } catch (x) {} return false; }
  }

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!input.value) return;
    err.hidden = true; btn.disabled = true; btn.textContent = "Vérification…";
    try {
      const key = await deriveKey(input.value);
      const data = await decrypt(key);
      remember(key);
      input.value = "";
      start(data);
    } catch (e) {
      btn.disabled = false; btn.textContent = "Se connecter";
      fail("Mot de passe incorrect.");
      input.select();
    }
  });

  window.AKEED_LOGOUT = function () {
    try { sessionStorage.removeItem(KEY_STORE); } catch (e) {}
    location.hash = "";
    location.reload();
  };

  tryStored().then((ok) => { if (!ok) { login.hidden = false; input.focus(); } });
})();
