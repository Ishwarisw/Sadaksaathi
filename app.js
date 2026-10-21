const $ = (id) => document.getElementById(id);

let place = null;      // { lat, lng }
let photoData = null;  // small JPEG stored as text
let reports = JSON.parse(localStorage.getItem("reports") || "[]");

// ---------- helpers ----------
function escapeHTML(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function save() {
  try {
    localStorage.setItem("reports", JSON.stringify(reports));
  } catch (e) {
    alert("Storage is full. Delete old reports or use a smaller photo.");
  }
}

// ---------- location ----------
$("gps").addEventListener("click", () => {
  $("loc").textContent = "Finding you...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      place = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      $("loc").textContent =
        `Location set: ${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`;
      updateComplaint();
    },
    () => { $("loc").textContent = "Could not get location. Please allow access."; }
  );
});

// ---------- photo preview + shrink ----------
// Phone photos are 3-5 MB; browser storage is about 5 MB in total,
// so each photo is shrunk to 400px wide before saving.
$("photo").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 400 / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      photoData = canvas.toDataURL("image/jpeg", 0.6);
      $("preview").src = photoData;
      $("preview").hidden = false;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

// ---------- complaint ----------
function buildComplaint(type, note, p, date) {
  const where = p
    ? `https://www.google.com/maps?q=${p.lat},${p.lng}`
    : "(location not set yet)";
  return [
    "To,",
    "The Road Maintenance Department / Municipal Corporation",
    "",
    `Subject: Complaint regarding ${type.toLowerCase()}`,
    "",
    `Sir/Madam, I am reporting a ${type.toLowerCase()} that is dangerous to commuters.`,
    `Location: ${where}`,
    `Date reported: ${date}`,
    note ? `Details: ${note}` : "",
    "",
    "Please inspect and repair this at the earliest. Photo attached.",
    "",
    "Thank you."
  ].filter((line, i, arr) => line !== "" || arr[i - 1] !== "").join("\n");
}

function updateComplaint() {
  $("complaint").value = buildComplaint(
    $("type").value, $("note").value.trim(), place,
    new Date().toLocaleDateString("en-IN")
  );
}

$("type").addEventListener("change", updateComplaint);
$("note").addEventListener("input", updateComplaint);

$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("complaint").value);
  } catch {
    $("complaint").select();
    document.execCommand("copy");
  }
  $("copy").textContent = "Copied!";
  setTimeout(() => ($("copy").textContent = "Copy complaint"), 1500);
});

// ---------- submit, list, vote ----------
$("submit").addEventListener("click", () => {
  if (!place) { alert("Tap 'Use my location' first"); return; }
  if (!photoData) { alert("Please add a photo first"); return; }

  reports.unshift({
    id: Date.now(),
    type: $("type").value,
    note: $("note").value.trim(),
    place,
    photo: photoData,
    date: new Date().toLocaleDateString("en-IN"),
    broken: 1,
    fixed: 0
  });
  save();
  render();

  // reset the form
  $("note").value = "";
  $("photo").value = "";
  $("preview").hidden = true;
  photoData = null;
  updateComplaint();
});

function render() {
  const list = $("list");
  if (reports.length === 0) {
    list.innerHTML = "<p>No reports yet. Submit the first one.</p>";
    return;
  }
  list.innerHTML = reports.map((r) => `
    <div class="card">
      <img src="${r.photo}" alt="${escapeHTML(r.type)}">
      <h3>${escapeHTML(r.type)} <small>${r.date}</small></h3>
      <p>${escapeHTML(r.note || "No note")}</p>
      <small>${r.place.lat.toFixed(4)}, ${r.place.lng.toFixed(4)}</small>
      <div class="row">
        <button data-id="${r.id}" data-vote="broken">Still broken (${r.broken})</button>
        <button class="fixed" data-id="${r.id}" data-vote="fixed">Fixed (${r.fixed})</button>
      </div>
    </div>`).join("");
}

$("list").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-vote]");
  if (!btn) return;
  const r = reports.find((x) => x.id === Number(btn.dataset.id));
  if (r) { r[btn.dataset.vote]++; save(); render(); }
});

// ---------- start ----------
updateComplaint();
render();