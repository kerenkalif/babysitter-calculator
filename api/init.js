// CommonJS export — יציב ב-Vercel
module.exports = (req, res) => {
  console.log("API called with:", req.query);

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // קריאת פרמטרים כטקסטים
    const q = req.query || {};
    const hoursStr = q.hours ?? "0";
    const rateStr = q.rate ?? "0";
    const travelStr = q.travel ?? "0";
    const stepsStr = q.steps ?? "50";

    // המרות מאובטחות
    const hours = Number.parseFloat(hoursStr);
    const rate = Number.parseFloat(rateStr);
    const travel = Number.parseFloat(travelStr);
    let steps = Number.parseInt(stepsStr, 10);

    // ולידציה בסיסית
    if (!Number.isFinite(hours) || hours < 0)
      return res.status(400).json({ ok: false, error: "invalid hours" });
    if (!Number.isFinite(rate) || rate < 0)
      return res.status(400).json({ ok: false, error: "invalid rate" });
    if (!Number.isFinite(travel) || travel < 0)
      return res.status(400).json({ ok: false, error: "invalid travel" });
    if (!Number.isFinite(steps)) steps = 50;
    steps = Math.max(1, Math.min(200, steps));

    // חישוב בסיסי (מדמה את המערכת)
    const base = hours * rate + travel;

    // Full Trace: בכל צעד הערך גדל ב-1
    const frames = Array.from({ length: steps }, (_, i) => ({
      step: i,
      view: {
        value: base + 2 * i,
        explain: i === 0 ? "Initial calculation" : "Increment by 1",
      },
      consoleDelta:
        i === 0
          ? [
              {
                level: "info",
                text: `Base = hours * rate + travel = ${hours} * ${rate} + ${travel}`,
              },
            ]
          : [{ level: "debug", text: `value := value + 1 → ${base + i}` }],
    }));

    return res.status(200).json({
      ok: true,
      apiVersion: "1.0",
      algo: "babysitter_demo",
      algoVersion: "1.0",
      input: { hours, rate, travel, steps },
      metadata: { generatedAt: new Date().toISOString(), totalFrames: steps },
      frames,
    });
  } catch (err) {
    console.error("init error:", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
};
