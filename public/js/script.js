// public/script.js

class BabysitterCalculatorUI {
  constructor(opts = {}) {
    this.ids = {
      hours: opts.hoursId || "hours",
      rate: opts.rateId || "cost",
      travel: opts.travelId || "travel",
      result: opts.resultId || "result",
      button: opts.buttonSelector || 'button[type="button"], button#calcBtn',
    };
    this.defaultSteps = Number.isFinite(opts.steps) ? opts.steps : 5;

    this.cacheDom();
    this.bindEvents();
  }

  // --- DOM helpers ---
  $(id) {
    return document.getElementById(id);
  }
  cacheDom() {
    this.$hours = this.$(this.ids.hours);
    this.$rate = this.$(this.ids.rate);
    this.$travel = this.$(this.ids.travel);
    this.$result = this.$(this.ids.result);
    this.$button = document.querySelector(this.ids.button);
  }

  bindEvents() {
    // תומך גם ב-onclick אינליין וגם מאזין מודרני
    if (this.$button)
      this.$button.addEventListener("click", () => this.handleClick());
    // חושף API גלובלי אם בכל זאת יש onclick="calcPayment()"
    window.calcPayment = () => this.handleClick();
  }

  // --- utils ---
  toNumber(v) {
    const n = Number.parseFloat(String(v ?? "").trim());
    return Number.isFinite(n) ? n : NaN;
  }

  setResult(text, ok = false) {
    if (!this.$result) return;
    this.$result.textContent = text;
    this.$result.style.color = ok ? "green" : "crimson";
  }

  validateInputs() {
    const hours = this.toNumber(this.$hours?.value);
    const rate = this.toNumber(this.$rate?.value);
    const travel = this.toNumber(this.$travel?.value);

    if ([hours, rate, travel].some(Number.isNaN)) {
      throw new Error("Please enter valid numbers.");
    }
    return { hours, rate, travel };
  }

  buildUrl({ hours, rate, travel, steps }) {
    const p = new URLSearchParams({
      hours: String(hours),
      rate: String(rate),
      travel: String(travel),
      steps: String(steps),
    });
    return `/api/init?${p.toString()}`;
  }

  async fetchTrace(url) {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${body || "request failed"}`);
    }
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.frames)) {
      throw new Error("Unexpected server response.");
    }
    return data;
  }

  // --- flow ---
  async handleClick() {
    try {
      const { hours, rate, travel } = this.validateInputs();
      this.setResult("Calculating…", true);

      const url = this.buildUrl({
        hours,
        rate,
        travel,
        steps: this.defaultSteps,
      });
      const data = await this.fetchTrace(url);

      const last = data.frames[data.frames.length - 1];
      const value = last?.view?.value;

      if (!Number.isFinite(value)) throw new Error("Invalid result frame.");

      this.setResult(`Pay ${value}`, true);
    } catch (err) {
      console.error(err);
      this.setResult(err.message || "Error calculating payment.");
    }
  }
}

// אתחול אוטומטי כשהדף נטען
document.addEventListener("DOMContentLoaded", () => {
  window.babysitterUI = new BabysitterCalculatorUI();
});
