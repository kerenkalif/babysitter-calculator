class BabysitterCalculator {
  constructor() {
    // קישור לכפתור
    const btn = document.getElementById("calcBtn");
    btn.addEventListener("click", () => this.calcPayment());
  }

  calcPayment() {
    // שליפת ערכים עם parseInt
    const hours = parseInt(document.getElementById("hours").value, 10) || 0;
    const costPerHour =
      parseInt(document.getElementById("cost").value, 10) || 0;
    const travelFee =
      parseInt(document.getElementById("travel").value, 10) || 0;

    const result = hours * costPerHour + travelFee;

    // הצגת התוצאה
    document.getElementById("result").innerHTML = "Pay " + result;
  }
}

// יצירת אובייקט של המחלקה כשהדף נטען
window.addEventListener("DOMContentLoaded", () => {
  new BabysitterCalculator();
});
