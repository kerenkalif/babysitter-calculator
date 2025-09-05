// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// כדי לקרוא JSON מהלקוח
app.use(express.json());

// הגשת הקבצים הסטטיים מהתיקייה public
app.use(express.static(path.join(__dirname, "public")));

// API לחישוב התשלום
app.post("/api/calc", (req, res) => {
  try {
    // שליפה ובקרה בסיסית
    const { hours, costPerHour, travelFee } = req.body ?? {};

    // המרה למספרים (נשאיר parseInt כדי לשמר את דרישות התרגיל)
    const h = parseInt(hours, 10) || 0;
    const c = parseInt(costPerHour, 10) || 0;
    const t = parseInt(travelFee, 10) || 0;

    // חישוב בצד השרת (זה ה"מנוע" הסגור)
    const result = h * c + t;

    // מחזירים גם פירוק לצורך UI (לא חובה)
    return res.json({
      ok: true,
      result,
      breakdown: { hours: h, costPerHour: c, travelFee: t },
    });
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Bad request" });
  }
});

// הפעלת השרת
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
