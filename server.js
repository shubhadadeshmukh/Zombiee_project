const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

let survivors = {};
let survivorIdCounter = 1;
let leaderboard = [];

// ------------------ CREATE SURVIVOR ------------------
app.post("/api/survivors", (req, res) => {
  const id = survivorIdCounter++;

  const survivor = {
    id,
    name: req.body.name || "Unknown",
    hunger: 100,
    health: 100,
    morale: 100,
    shelter: 0,
    allies: 0,
    day: 1,
    score: 0,
    status: "alive",
    createdAt: new Date(),
    decisions: [],
  };

  survivors[id] = survivor;

  console.log("Survivor created successfully");

  res.status(201).json({
    message: "Survivor created successfully",
    survivor,
  });
});

// ------------------ DECISIONS ------------------
app.post("/api/survivors/:id/decisions", (req, res) => {
  const survivor = survivors[req.params.id];

  if (!survivor) {
    return res.status(404).json({ message: "Survivor not found", error: true });
  }

  if (survivor.status !== "alive") {
    return res.status(400).json({
      message: "Survivor died or escaped",
      error: true,
    });
  }

  const decision = req.body.decision;
  let message = "";
  let scoreGain = 0;

  const decisionLog = { day: survivor.day, decision, result: "" };

  switch (decision) {
    case "food":
      if (Math.random() > 0.6) {
        message = "Food found";
        survivor.hunger = 100;
        scoreGain = 20;
      } else {
        message = "Food not found";
        survivor.health -= 25;
        survivor.hunger -= 10;
        scoreGain = -10;
      }
      break;

    case "shelter":
      if (survivor.hunger < 30) {
        message = "Too hungry to build shelter";
        survivor.health -= 20;
        scoreGain = -10;
      } else {
        message = "Built shelter";
        survivor.shelter = Math.min(100, survivor.shelter + 30);
        survivor.hunger -= 10;
        scoreGain = 20;
      }
      break;

    case "allies":
      if (Math.random() > 0.5) {
        message = "Found allies";
        survivor.allies += 1;
        survivor.morale = 100;
        scoreGain = 25;
      } else {
        message = "No allies found";
        survivor.health -= 10;
        survivor.morale -= 10;
        scoreGain = -25;
      }
      break;

    case "rest":
      message = "Rested peacefully";
      survivor.health = Math.min(100, survivor.health + 25);
      scoreGain = 20;
      break;

    default:
      return res.json({ message: "Invalid Choice", error: true });
  }

  // Global daily reductions
  survivor.hunger = Math.max(0, survivor.hunger - 10);
  survivor.health = Math.max(0, survivor.health - 10);
  survivor.morale = Math.max(0, survivor.morale - 10);

  survivor.day += 1;
  survivor.score += scoreGain;

  // Status
  if (survivor.health <= 0) {
    survivor.status = "dead";
  } else if (survivor.day >= 14 && survivor.health > 30) {
    survivor.status = "escaped";
  }

  decisionLog.result = message;
  survivor.decisions.push(decisionLog);

  res.json({
    message,
    scoreGain,
    survivor,
  });
});

// ------------------ LEADERBOARD ------------------
app.get("/api/leaderboard", (req, res) => {
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 10);

  res.json({
    leaderboard: sorted,
    length: leaderboard.length,
  });
});

app.post("/api/leaderboard", (req, res) => {
  const entry = {
    id: Date.now(),
    name: req.body.name,
    score: req.body.score,
    days: req.body.days,
    survived: req.body.survived,
    timeStamp: new Date(),
  };

  leaderboard.push(entry);

  res.json({
    message: "Added entry",
    entry,
  });
});

// ------------------ SERVER ------------------
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
