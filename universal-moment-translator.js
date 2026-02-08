import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4XkZaqv7_c-uiUFc2NvZEFyQUapirz-Y",
  databaseURL: "https://setouchi-it-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "setouchi-it"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const momentRef = ref(db, "temporal/moment");

// فضاء التفسير (محلي فقط)
const MAP = {
  1: () => renderImage("assets/a.png"),
  2: () => renderImage("assets/b.png"),
  3: () => renderText("ف"),
  4: () => renderText("🙂")
};

onValue(momentRef, s => {
  if (!s.exists()) return;
  const m = s.val();
  const key = Math.abs(m) % 5;
  if (MAP[key]) MAP[key]();
});

function renderImage(src) {
  const img = document.createElement("img");
  img.src = src;
  img.style.maxWidth = "300px";
  document.body.appendChild(img);
}

function renderText(t) {
  const d = document.createElement("div");
  d.textContent = t;
  d.style.fontSize = "48px";
  document.body.appendChild(d);
}
