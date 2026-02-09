import express from "express";

const app = express();
app.use(express.json({ limit: "50mb" }));

// التخزين الأعمى: counter → value
const store = new Map();

app.post("/push", (req, res) => {
  const { counter, value } = req.body;
  store.set(counter, value);
  res.sendStatus(200);
});

app.get("/dump", (req, res) => {
  const data = [...store.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([counter, value]) => ({ counter, value }));
  res.json(data);
});

app.listen(3000, () =>
  console.log("Blind server running on http://localhost:3000")
);
