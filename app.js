
// ============================================================
// VIVVY'S GLIMMERS
// Version 0.1.0
// Authentication + Daily Glimmer
// ============================================================


// ============================================================
// SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL =
  "https://pmzfiubwcvxjkzbxbcsn.supabase.co";

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
// PHOTO VIEWER ELEMENTS
// ============================================================

const openPhotoButton =
  document.getElementById("open-photo-button");

const photoViewer =
  document.getElementById("photo-viewer");

const closePhotoViewerButton =
  document.getElementById("close-photo-viewer");

const enlargedPhoto =
  document.getElementById("enlarged-photo");


// ============================================================
// HELPERS
// ============================================================

function setStatus(message) {
  statusElement.textContent = message;
}


// ============================================================
// DAILY SELECTION
// ============================================================


// ============================================================
// DAILY GLIMMER SELECTION
// ============================================================

function getDailyGlimmer(glimmers) {
  const today = new Date();

  const dateKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  const storageKey = "vivvy-daily-glimmer";

  const saved = JSON.parse(
    localStorage.getItem(storageKey) || "null"
  );

  if (saved?.date === dateKey) {
    const existing = glimmers.find(
      (glimmer) => glimmer.id === saved.id
    );

    if (existing) {
      return existing;
    }
  }

  const index = Math.floor(
    Math.random() * glimmers.length
  );

  const selected = glimmers[index];

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      date: dateKey,
      id: selected.id
    })
  );

  return selected;
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

  const selected = getDailyGlimmer(data);

  dailyGlimmer.textContent = selected.content;
}



// ============================================================
// SHOW APP
// ============================================================

async function showApp() {
  loginSection.hidden = true;
  glimmerSection.hidden = false;
  document.getElementById("photo-card").hidden = false;
  signOutButton.hidden = false;

  document.getElementById(
    "add-memories-section"
  ).hidden = false;

  // Temporary development tool
  bulkUploadSection.hidden = true;

  await Promise.all([
    loadGlimmer(),
    loadPhoto()
  ]);
}


// ============================================================
// SIGN OUT (IMPORTANT FOR SHARED / WORK COMPUTERS)
// ============================================================

const signOutButton =
  document.getElementById("sign-out-button");

signOutButton?.addEventListener("click", async () => {
  signOutButton.disabled = true;
  setStatus("Signing out...");

  const { error } = await db.auth.signOut();

  signOutButton.disabled = false;

  if (error) {
    console.error("Sign out error:", error);
    setStatus("Couldn't sign out. Please try again.");
    return;
  }

  // Clear private content from the current page.
  if (photoViewer && !photoViewer.hidden) {
    closePhotoViewer();
  }

  glimmerSection.hidden = true;
  document.getElementById("photo-card").hidden = true;
  signOutButton.hidden = true;
  document.getElementById("add-memories-section").hidden = true;
  bulkUploadSection.hidden = true;
  toggleBulkUploadButton.setAttribute("aria-expanded", "false");
  loginSection.hidden = false;

  loginForm.reset();
  addGlimmerForm.reset();
  addGlimmerForm.hidden = true;
  addGlimmerButton.hidden = false;

  dailyGlimmer.textContent = "";
  dailyPhoto.removeAttribute("src");
  dailyPhoto.hidden = true;
  if (openPhotoButton) openPhotoButton.hidden = true;
  photoMessage.textContent = "";
  nextPhotoButton.hidden = true;
  availablePhotos = [];
  photoQueue = [];
  currentPhotoId = null;

  setStatus("Signed out successfully.");
});


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

    setStatus(`Your glimmer was saved! ♡ "${content}"`);
    }
);


// ============================================================
// VIVVY'S GLIMMERS — PHOTOS
// ============================================================


// ============================================================
// ELEMENTS
// ============================================================

const dailyPhoto =
  document.getElementById("daily-photo");

const photoMessage =
  document.getElementById("photo-message");

const addPhotoButton =
  document.getElementById("add-photo-button");

const photoInput =
  document.getElementById("photo-input");


// ============================================================
// DAILY PHOTO SELECTION
// ============================================================


// ============================================================
// FULLSCREEN PHOTO VIEWER
// ============================================================

let photoViewerPreviouslyFocused = null;

function openPhotoViewer() {
  if (!photoViewer || !enlargedPhoto ||
      !dailyPhoto.src || dailyPhoto.hidden) {
    return;
  }

  photoViewerPreviouslyFocused =
    document.activeElement;

  enlargedPhoto.src = dailyPhoto.src;

  photoViewer.hidden = false;

  document.body.classList.add(
    "photo-viewer-open"
  );

  closePhotoViewerButton.focus();
}


function closePhotoViewer() {
  if (!photoViewer) return;

  photoViewer.hidden = true;

  enlargedPhoto.removeAttribute("src");

  document.body.classList.remove(
    "photo-viewer-open"
  );

  photoViewerPreviouslyFocused?.focus();
}


// The HTML must contain the preview button and viewer.
// Optional chaining prevents an incomplete markup update from
// breaking the rest of the application.
openPhotoButton?.addEventListener("click", openPhotoViewer);
closePhotoViewerButton?.addEventListener("click", closePhotoViewer);

// Tapping the dark backdrop closes the viewer.
// Tapping the photo itself does nothing.
photoViewer?.addEventListener("click", (event) => {
  if (event.target === photoViewer) {
    closePhotoViewer();
  }
});


// Close with Escape on desktop
document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      photoViewer && !photoViewer.hidden
    ) {
      closePhotoViewer();
    }
  }
);


// ============================================================
// PHOTO SELECTION
// ============================================================

let photoQueue = [];
let currentPhotoId = null;

function shufflePhotos(photos, excludeId = null) {
  const ids = photos
    .filter(photo => photo.id !== excludeId)
    .map(photo => photo.id);

  // Fisher-Yates shuffle
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  return ids;
}

function getDailyPhoto(photos, userId) {
  const today = new Date();

  const dateKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  const storageKey =
    `vivvy-daily-photo-${userId}`;

  let saved = null;

  try {
    saved = JSON.parse(
      localStorage.getItem(storageKey) || "null"
    );
  } catch {
    localStorage.removeItem(storageKey);
  }

  if (saved?.date === dateKey) {
    const existing = photos.find(
      photo => photo.id === saved.id
    );

    if (existing) {
      return existing;
    }
  }

  const selected =
    photos[Math.floor(Math.random() * photos.length)];

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      date: dateKey,
      id: selected.id
    })
  );

  return selected;
}


// ============================================================
// LOAD DAILY PHOTO
// ============================================================


// ============================================================
// LOAD PHOTOS
// ============================================================

let availablePhotos = [];

const nextPhotoButton =
  document.getElementById("next-photo-button");

async function displayPhoto(photo) {
  photoMessage.textContent = "Loading your memory...";
  dailyPhoto.hidden = true;
  if (openPhotoButton) openPhotoButton.hidden = true;

  const { data, error } = await db.storage
    .from("vivvy-photos")
    .createSignedUrl(photo.storage_path, 3600);

  if (error) {
    console.error("Photo display error:", error);
    photoMessage.textContent = "Couldn't open this memory.";
    return;
  }

  // Reveal the thumbnail only when the new photo is ready.
  dailyPhoto.onload = () => {
    dailyPhoto.hidden = false;
    if (openPhotoButton) openPhotoButton.hidden = false;
    photoMessage.textContent = "";
  };

  dailyPhoto.onerror = () => {
    dailyPhoto.hidden = true;
    if (openPhotoButton) openPhotoButton.hidden = true;
    photoMessage.textContent = "Couldn't display this memory.";
  };

  dailyPhoto.src = data.signedUrl;
  currentPhotoId = photo.id;
}


async function loadPhoto() {
  const { data: userData, error: userError } =
    await db.auth.getUser();

  if (userError || !userData.user) {
    photoMessage.textContent =
      "Please sign in to see your memories.";
    dailyPhoto.hidden = true;
    if (openPhotoButton) openPhotoButton.hidden = true;
    return;
  }

  const { data: photos, error } = await db
    .from("photos")
    .select("id, storage_path")
    .order("id");

  if (error) {
    console.error("Photo load error:", error);
    photoMessage.textContent =
      "Couldn't load your memories.";
    return;
  }

  availablePhotos = photos || [];

  if (availablePhotos.length === 0) {
    photoMessage.textContent =
      "Your happy memories will appear here ♡";

    dailyPhoto.hidden = true;
    if (openPhotoButton) openPhotoButton.hidden = true;
    nextPhotoButton.hidden = true;
    return;
  }

  const selected = getDailyPhoto(
    availablePhotos,
    userData.user.id
  );

  await displayPhoto(selected);

  photoQueue = shufflePhotos(
    availablePhotos,
    selected.id
  );

  nextPhotoButton.hidden =
    availablePhotos.length < 2;
}


// ============================================================
// SHOW ANOTHER MEMORY
// ============================================================

nextPhotoButton.addEventListener(
  "click",
  async () => {
    if (availablePhotos.length < 2) {
      return;
    }

    nextPhotoButton.disabled = true;

    if (photoQueue.length === 0) {
      photoQueue = shufflePhotos(
        availablePhotos,
        currentPhotoId
      );
    }

    const nextId = photoQueue.shift();

    const nextPhoto = availablePhotos.find(
      photo => photo.id === nextId
    );

    if (nextPhoto) {
      await displayPhoto(nextPhoto);
    }

    nextPhotoButton.disabled = false;
  }
);



// ============================================================
// OPEN PHOTO PICKER
// ============================================================

addPhotoButton.addEventListener(
  "click",
  () => {
    photoInput.click();
  }
);


// ============================================================
// UPLOAD PHOTO
// ============================================================

photoInput.addEventListener(
  "change",
  async () => {
    const file = photoInput.files[0];

    if (!file) {
      return;
    }

    addPhotoButton.disabled = true;

    setStatus("Saving your photo...");

    try {
      const { data: userData, error: userError } =
        await db.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Please sign in again.");
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic"
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Please choose a JPG, PNG, WEBP, or HEIC photo."
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error(
          "This photo is too large. Please choose one under 10 MB."
        );
      }

      const fileExtension =
        file.name.split(".").pop().toLowerCase();

      const storagePath = [
        userData.user.id,
        `${crypto.randomUUID()}.${fileExtension}`
      ].join("/");

      const { error: uploadError } =
        await db.storage
          .from("vivvy-photos")
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false
          });

      if (uploadError) {
        throw uploadError;
      }

      const { error: databaseError } =
        await db
          .from("photos")
          .insert({
            storage_path: storagePath
          });

      if (databaseError) {
        await db.storage
          .from("vivvy-photos")
          .remove([storagePath]);

        throw databaseError;
      }

      setStatus("Your photo was saved! ♡");

      await loadPhoto();

    } catch (error) {
      console.error("Photo upload error:", error);

      setStatus(
        error.message ||
        "Couldn't save your photo. Please try again."
      );

    } finally {
      addPhotoButton.disabled = false;
      photoInput.value = "";
    }
  }
);


// ============================================================
// DEVELOPMENT ONLY — BULK PHOTO PRELOADING
// Remove before Christmas
// ============================================================

const bulkUploadSection =
  document.getElementById("bulk-upload-section");

const bulkPhotoInput =
  document.getElementById("bulk-photo-input");

const bulkUploadButton =
  document.getElementById("bulk-upload-button");

const bulkUploadStatus =
  document.getElementById("bulk-upload-status");

const toggleBulkUploadButton =
  document.getElementById("toggle-bulk-upload-button");

toggleBulkUploadButton.addEventListener("click", () => {
  const opening = bulkUploadSection.hidden;
  bulkUploadSection.hidden = !opening;
  toggleBulkUploadButton.setAttribute(
    "aria-expanded",
    String(opening)
  );

  if (opening) {
    bulkPhotoInput.focus();
  }
});



// ============================================================
// UPLOAD MULTIPLE PHOTOS
// ============================================================

bulkUploadButton.addEventListener(
  "click",
  async () => {
    const files = Array.from(bulkPhotoInput.files);

    if (files.length === 0) {
      bulkUploadStatus.textContent =
        "Choose some photos first.";
      return;
    }

    bulkUploadButton.disabled = true;

    let successful = 0;
    let failed = 0;

    const { data: userData, error: userError } =
      await db.auth.getUser();

    if (userError || !userData.user) {
      bulkUploadStatus.textContent =
        "Please sign in again.";
      bulkUploadButton.disabled = false;
      return;
    }

    const userId = userData.user.id;

    // Upload sequentially to keep things simple.
    for (const [index, file] of files.entries()) {
      bulkUploadStatus.textContent =
        `Uploading ${index + 1} of ${files.length}...`;

      try {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/heic"
        ];

        if (!allowedTypes.includes(file.type)) {
          throw new Error("Unsupported image type");
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Image exceeds 10 MB");
        }

        const extension =
          file.name.split(".").pop().toLowerCase();

        const storagePath =
          `${userId}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } =
          await db.storage
            .from("vivvy-photos")
            .upload(storagePath, file, {
              contentType: file.type,
              upsert: false
            });

        if (uploadError) {
          throw uploadError;
        }

        const { error: databaseError } =
          await db
            .from("photos")
            .insert({
              storage_path: storagePath
            });

        if (databaseError) {
          await db.storage
            .from("vivvy-photos")
            .remove([storagePath]);

          throw databaseError;
        }

        successful++;

      } catch (error) {
        console.error(
          `Failed to upload ${file.name}:`,
          error
        );

        failed++;
      }
    }

    bulkUploadStatus.textContent =
      `${successful} photos added! ` +
      `${failed} failed.`;

    bulkPhotoInput.value = "";
    bulkUploadButton.disabled = false;

    // Keep today's selected photo unchanged.
    await loadPhoto();
  }
);

initialize();
