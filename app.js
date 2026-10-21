let place = null;

document.getElementById("gps").addEventListener("click", () => {
  const out = document.getElementById("loc");
  out.textContent = "Finding you...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      place = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      out.textContent = `Location set: ${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`;
    },
    () => {
      out.textContent = "Could not get location. Please allow access.";
    }
  );
});

document.getElementById("submit").addEventListener("click", () => {
  if (!place) {
    alert("Tap 'Use my location' first");
    return;
  }
  console.log({
    type: document.getElementById("type").value,
    note: document.getElementById("note").value,
    place: place
  });
});