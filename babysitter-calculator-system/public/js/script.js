class BabysitterCalculator {
  constructor() {
    const btn = document.getElementById("calcBtn");
    btn.addEventListener("click", () => this.calcPayment());
  }

  async calcPayment() {
    const hours = document.getElementById("hours").value;
    const costPerHour = document.getElementById("cost").value;
    const travelFee = document.getElementById("travel").value;

    // שליחת בקשה לשרת (אותו דומיין, אין צורך ב-CORS)
    try {
      const res = await fetch("/api/calc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours, costPerHour, travelFee }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Server error");

      const { result, breakdown } = data;
      document.getElementById("result").innerHTML =
        `Pay ${result}` +
        ` ( ${breakdown.hours} × ${breakdown.costPerHour} + ${breakdown.travelFee} )`;
    } catch (err) {
      document.getElementById("result").innerHTML =
        "Error calculating payment.";
      console.error(err);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new BabysitterCalculator();
});
