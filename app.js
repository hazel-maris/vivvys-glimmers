
// ============================================================
// VIVVY'S GLIMMERS
// Version 0.1.0
// Authentication + Daily Glimmer
// ============================================================


// ============================================================
// SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL =
  "https://pmzfiubwcvxjkzbxbcsn.supabase.co/";

const SUPABASE_KEY =
  "sb_publishable_41nkpTCl6Tr3bzNxqQrOHA_AO1pg2iL";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

const loginSection =
  document.getElementById("login-section");

const loginForm =
  document.getElementById("login-form");

const glimmerSection =
  document.getElementById("glimmer-section");

const dailyGlimmer =
  document.getElementById("daily-glimmer");

const statusElement =
  document.getElementById("status");


// ============================================================
// HELPERS
// ============================================================

function setStatus(message) {
  statusElement.textContent = message;
}


// ============================================================
// DAILY SELECTION
// ============================================================

function getDailyIndex(count) {
  const today = new Date();

  const dateKey =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  return dateKey % count;
}


// ============================================================
// LOAD GLIMMERS
// ============================================================

async function loadGlimmer() {
  const { data, error } = await db
    .from("glimmers")
    .select("id, content")
    .order("id");

  if (error) {
    setStatus(error.message);
    return;
  }

  if (!data || data.length === 0) {
    dailyGlimmer.textContent =
      "Your glimmers will appear here ♡";
    return;
  }

  const index = getDailyIndex(data.length);

  dailyGlimmer.textContent =
    data[index].content;

  setStatus("");
}


// ============================================================
// SHOW APP
// ============================================================

async function showApp() {
  loginSection.hidden = true;
  glimmerSection.hidden = false;

  await loadGlimmer();
}


// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    setStatus("Signing in...");

    const email =
      document.getElementById("email").value;

    const password =
      document.getElementById("password").value;

    const { error } =
      await db.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error("Supabase login error:", error);
      setStatus(error.message);
      return;
    }

    await showApp();
  }
);



// ============================================================
// INITIALIZE
// ============================================================

async function initialize() {
  const { data, error } =
    await db.auth.getUser();

  if (!error && data.user) {
    await showApp();
  }
}


// ============================================================
// ADD GLIMMER
// ============================================================

const addGlimmerButton =
  document.getElementById("add-glimmer-button");

const addGlimmerForm =
  document.getElementById("add-glimmer-form");

const cancelGlimmerButton =
  document.getElementById("cancel-glimmer-button");

const newGlimmerInput =
  document.getElementById("new-glimmer");


// ============================================================
// SHOW / HIDE FORM
// ============================================================

addGlimmerButton.addEventListener(
  "click",
  () => {
    addGlimmerButton.hidden = true;
    addGlimmerForm.hidden = false;

    newGlimmerInput.focus();
  }
);


cancelGlimmerButton.addEventListener(
  "click",
  () => {
    addGlimmerForm.reset();

    addGlimmerForm.hidden = true;
    addGlimmerButton.hidden = false;
  }
);


// ============================================================
// SAVE GLIMMER
// ============================================================

addGlimmerForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const content =
      newGlimmerInput.value.trim();

    if (!content) {
      return;
    }

    const saveButton =
      addGlimmerForm.querySelector(
        'button[type="submit"]'
      );

    saveButton.disabled = true;

    setStatus("Saving your glimmer...");

    const { error } = await db
      .from("glimmers")
      .insert({
        content
      });

    saveButton.disabled = false;

    if (error) {
      console.error("Glimmer save error:", error);

      setStatus(
        "Couldn't save your glimmer. Please try again."
      );

      return;
    }

    addGlimmerForm.reset();
    addGlimmerForm.hidden = true;
    addGlimmerButton.hidden = false;

    setStatus("Your glimmer was saved! ♡");

    await loadGlimmer();
  }
);


initialize();
