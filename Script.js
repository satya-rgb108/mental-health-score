/* ==========================================================
   Mental Health Score Predictor — Application Logic
   U.S. Clinical Standard — 5‑Tier Severity Mapping (0–10)
   ========================================================== */

// Backend endpoint
const API_URL = "http://127.0.0.1:8000/predict";

// Countries available in the searchable dropdown
const COUNTRIES = [
  "India", "USA", "Canada", "Australia", "UK",
  "Germany", "Mexico", "Turkey", "France", "Other"
];

// ---------------- DOM references ----------------
const form = document.getElementById("mhForm");
const predictBtn = document.getElementById("predictBtn");
const btnLabel = predictBtn.querySelector(".btn-label");
const scrollToFormBtn = document.getElementById("scrollToFormBtn");

const countryInput = document.getElementById("countryInput");
const countryList = document.getElementById("countryList");
const countryCombo = document.getElementById("countryCombo");

const resultSection = document.getElementById("resultSection");
const resultCard = document.getElementById("resultCard");
const resultScoreEl = document.getElementById("resultScore");
const resultInterpretationEl = document.getElementById("resultInterpretation");
const resultBarFill = document.getElementById("resultBarFill");

// ---------------- Hero button: scroll to form ----------------
scrollToFormBtn.addEventListener("click", () => {
  document.getElementById("predictionForm").scrollIntoView({ behavior: "smooth" });
});

// ==========================================================
// Searchable Country Dropdown
// ==========================================================

function renderCountryList(filterText = "") {
  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(filterText.toLowerCase())
  );

  countryList.innerHTML = "";

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No matching country";
    li.classList.add("no-match");
    countryList.appendChild(li);
    return;
  }

  filtered.forEach((country) => {
    const li = document.createElement("li");
    li.textContent = country;
    li.setAttribute("role", "option");
    li.addEventListener("click", () => {
      countryInput.value = country;
      closeCountryList();
      clearFieldError("country");
    });
    countryList.appendChild(li);
  });
}

function openCountryList() {
  renderCountryList(countryInput.value);
  countryList.classList.add("open");
}

function closeCountryList() {
  countryList.classList.remove("open");
}

countryInput.addEventListener("focus", openCountryList);
countryInput.addEventListener("input", () => {
  renderCountryList(countryInput.value);
  countryList.classList.add("open");
});

document.addEventListener("click", (e) => {
  if (!countryCombo.contains(e.target)) {
    closeCountryList();
  }
});

// ==========================================================
// Validation helpers
// ==========================================================

function setFieldError(fieldKey, message) {
  const errorEl = document.getElementById(`err-${fieldKey}`);
  if (errorEl) errorEl.textContent = message;

  const fieldWrapper =
    document.getElementById(fieldKey)?.closest(".field") ||
    document.getElementById(fieldKey + "Combo");
  if (fieldWrapper) fieldWrapper.classList.add("invalid");

  if (fieldKey === "country") {
    countryCombo.classList.add("invalid");
  }
}

function clearFieldError(fieldKey) {
  const errorEl = document.getElementById(`err-${fieldKey}`);
  if (errorEl) errorEl.textContent = "";

  const fieldWrapper = document.getElementById(fieldKey)?.closest(".field");
  if (fieldWrapper) fieldWrapper.classList.remove("invalid");

  if (fieldKey === "country") {
    countryCombo.classList.remove("invalid");
  }
}

function clearAllErrors() {
  document.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".field.invalid").forEach((el) => el.classList.remove("invalid"));
  countryCombo.classList.remove("invalid");
}

function validateForm() {
  clearAllErrors();
  let isValid = true;

  const fields = {
    age: { value: document.getElementById("age").value, min: 10, max: 100 },
    gender: { value: document.getElementById("gender").value },
    country: { value: countryInput.value.trim() },
    academicLevel: { value: document.getElementById("academicLevel").value },
    platform: { value: document.getElementById("platform").value },
    purpose: { value: document.getElementById("purpose").value },
    avgUsage: { value: document.getElementById("avgUsage").value, min: 0, max: 24 },
    dailyUnlocks: { value: document.getElementById("dailyUnlocks").value, min: 0 },
    studyHours: { value: document.getElementById("studyHours").value, min: 0, max: 24 },
    activityHours: { value: document.getElementById("activityHours").value, min: 0, max: 24 },
    sleepHours: { value: document.getElementById("sleepHours").value, min: 0, max: 24 },
    stressLevel: { value: document.getElementById("stressLevel").value },
  };

  const requiredSelects = [
    ["gender", "Please select your gender."],
    ["country", "Please select your country."],
    ["academicLevel", "Please select your academic level."],
    ["platform", "Please select your most used platform."],
    ["purpose", "Please select your purpose of use."],
    ["stressLevel", "Please select your stress level."],
  ];

  requiredSelects.forEach(([key, message]) => {
    if (!fields[key].value) {
      setFieldError(key, message);
      isValid = false;
    }
  });

  const numericChecks = [
    ["age", "Age", 10, 100],
    ["avgUsage", "Average daily usage hours", 0, 24],
    ["dailyUnlocks", "Daily unlocks", 0, null],
    ["studyHours", "Study hours", 0, 24],
    ["activityHours", "Physical activity hours", 0, 24],
    ["sleepHours", "Sleep hours", 0, 24],
  ];

  numericChecks.forEach(([key, label, min, max]) => {
    const raw = fields[key].value;

    if (raw === "" || raw === null) {
      setFieldError(key, `Please enter your ${label.toLowerCase()}.`);
      isValid = false;
      return;
    }

    const num = Number(raw);

    if (Number.isNaN(num)) {
      setFieldError(key, `${label} must be a valid number.`);
      isValid = false;
      return;
    }

    if (min !== null && num < min) {
      setFieldError(key, `${label} must be at least ${min}.`);
      isValid = false;
      return;
    }

    if (max !== null && num > max) {
      setFieldError(key, `${label} must be at most ${max}.`);
      isValid = false;
    }
  });

  return isValid;
}

// ==========================================================
// Collecting form data
// ==========================================================

function collectFormData() {
  return {
    age: Number(document.getElementById("age").value),
    gender: document.getElementById("gender").value,
    country: countryInput.value.trim(),
    academic_level: document.getElementById("academicLevel").value,
    most_used_platform: document.getElementById("platform").value,
    purpose_of_use: document.getElementById("purpose").value,
    avg_daily_usage_hours: Number(document.getElementById("avgUsage").value),
    daily_unlocks: Number(document.getElementById("dailyUnlocks").value),
    study_hours: Number(document.getElementById("studyHours").value),
    physical_activity_hours: Number(document.getElementById("activityHours").value),
    sleep_hours_per_night: Number(document.getElementById("sleepHours").value),
    stress_level: document.getElementById("stressLevel").value,
  };
}

// ==========================================================
// Loader state
// ==========================================================

function showLoader() {
  predictBtn.disabled = true;
  predictBtn.classList.add("loading");
  btnLabel.textContent = "Predicting...";
}

function hideLoader() {
  predictBtn.disabled = false;
  predictBtn.classList.remove("loading");
  btnLabel.textContent = "Predict Mental Health Score";
}

// ==========================================================
// API call
// ==========================================================

async function predictScore(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = "Something went wrong while predicting your score.";
    try {
      const errorBody = await response.json();
      if (errorBody?.detail) {
        detail = Array.isArray(errorBody.detail)
          ? errorBody.detail.map((d) => d.msg).join(" ")
          : String(errorBody.detail);
      }
    } catch (_) {}
    throw new Error(detail);
  }

  return response.json();
}

// ==========================================================
// Result rendering — 5‑TIER U.S. STANDARD (0–10)
// ==========================================================

/**
 * 🩺 5‑Tier Severity Mapping (PHQ-9 / GAD-7 aligned)
 * 
 * 8.0–10.0 → Minimal Distress     (Excellent)
 * 6.0–7.9  → Mild Distress        (Good)
 * 4.0–5.9  → Moderate Distress    (Moderate)
 * 2.0–3.9  → Moderately Severe    (Low)
 * 0.0–1.9  → Severe Distress      (Very Low)
 */
function getInterpretation(score) {
  if (score >= 8) {
    return { text: "Excellent Mental Well-being", state: "score-green" };
  }
  if (score >= 6) {
    return { text: "Good Mental Well-being", state: "score-blue" };
  }
  if (score >= 4) {
    return { text: "Moderate Mental Well-being", state: "score-orange" };
  }
  if (score >= 2) {
    return { text: "Low Mental Well-being", state: "score-yellow" };
  }
  return { text: "Very Low Mental Well-being", state: "score-red" };
}

function displayResult(score) {
  const { text, state } = getInterpretation(score);

  // Reset classes (include score-yellow now)
  resultCard.classList.remove(
    "score-green", "score-blue", "score-orange", "score-yellow", "score-red", "error"
  );
  resultCard.classList.add(state);

  resultScoreEl.textContent = score.toFixed(2);
  resultScoreEl.classList.remove("animate");
  void resultScoreEl.offsetWidth;
  resultScoreEl.classList.add("animate");

  resultInterpretationEl.textContent = text;

  // Progress bar (0–10 → 0–100%)
  const clamped = Math.max(0, Math.min(10, score));
  const percent = (clamped / 10) * 100;
  requestAnimationFrame(() => {
    resultBarFill.style.width = `${percent}%`;
  });

  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function displayError(message) {
  resultCard.classList.remove(
    "score-green", "score-blue", "score-orange", "score-yellow", "score-red"
  );
  resultCard.classList.add("error");
  resultScoreEl.textContent = "!";
  resultInterpretationEl.textContent = message;
  resultBarFill.style.width = "0%";
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ==========================================================
// Form submission
// ==========================================================

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateForm()) {
    const firstError = form.querySelector(".field.invalid, .combo.invalid");
    if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const payload = collectFormData();
  showLoader();

  try {
    const data = await predictScore(payload);
    displayResult(data.predicted_mental_health_score);
  } catch (error) {
    displayError(
      error.message ||
        "We couldn't reach the prediction service. Please make sure the backend is running and try again."
    );
  } finally {
    hideLoader();
  }
});