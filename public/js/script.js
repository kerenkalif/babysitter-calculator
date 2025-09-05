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
    this.steps = Number.isFinite(opts.steps) ? opts.steps : 50; // כמה מצבים ב-trace
    this.frames = [];
    this.idx = -1; // אינדקס הפריים הנוכחי ב-trace
    this.lastInputs = null;

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
    // כפתור
    if (this.$button)
      this.$button.addEventListener("click", () => this.onButton());
    // שינוי קלטים → מסמנים שה-trace הישן לא רלוונטי
    [this.$hours, this.$rate, this.$travel].forEach((el) => {
      el?.addEventListener("input", () => this.onInputsChanged());
    });
    // תומך גם ב-onclick="calcPayment()"
    window.calcPayment = () => this.onButton();
  }

  onInputsChanged() {
    this.frames = [];
    this.idx = -1;
    this.lastInputs = null;
    this.setResult("Ready to calculate.");
    this.setButtonText("Calculate Payment!");
    if (this.$button) this.$button.disabled = false;
  }

  setButtonText(txt) {
    if (this.$button) this.$button.textContent = txt;
  }

  // --- utils ---
  toNumber(v) {
    const n = Number.parseFloat(String(v ?? "").trim());
    return Number.isFinite(n) ? n : NaN;
  }

  readInputs() {
    const hours = this.toNumber(this.$hours?.value);
    const rate = this.toNumber(this.$rate?.value);
    const travel = this.toNumber(this.$travel?.value);
    if (
      [hours, rate, travel].some(Number.isNaN) ||
      [hours, rate, travel].some((x) => x < 0)
    ) {
      throw new Error("Please enter valid non-negative numbers.");
    }
    return { hours, rate, travel };
  }

  sameInputs(a, b) {
    if (!a || !b) return false;
    return a.hours === b.hours && a.rate === b.rate && a.travel === b.travel;
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

  renderFrame() {
    const f = this.frames[this.idx];
    if (!f) return;
    const value = f?.view?.value;
    if (!Number.isFinite(value)) {
      this.setResult("Error: invalid frame.");
      return;
    }
    this.setResult(`Pay ${value}`, true);

    // אם זה הפריים האחרון, נשאיר את אותו ערך ונציין שהגענו לסוף
    if (this.idx >= this.frames.length - 1) {
      this.setButtonText("End (click recalculates after changes)");
      if (this.$button) this.$button.disabled = true;
    } else {
      this.setButtonText("Next step");
      if (this.$button) this.$button.disabled = false;
    }
  }

  async initTrace(inputs) {
    const params = new URLSearchParams({
      hours: String(inputs.hours),
      rate: String(inputs.rate),
      travel: String(inputs.travel),
      steps: String(this.steps),
    });
    const url = `/api/init?${params.toString()}`;

    this.setResult("Calculating…");
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${txt || "request failed"}`);
    }
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.frames)) {
      throw new Error("Unexpected server response.");
    }

    this.frames = data.frames;
    this.idx = 0;
    this.lastInputs = inputs;
    if (this.$button) this.$button.disabled = false;
    this.renderFrame();
  }

  nextStep() {
    if (this.idx < this.frames.length - 1) {
      this.idx += 1;
    }
    this.renderFrame();
  }

  async onButton() {
    try {
      const inputs = this.readInputs();
      // אם אין טרייס טעון או שהקלטים השתנו → נאתחל טרייס חדש
      if (
        !this.lastInputs ||
        !this.sameInputs(inputs, this.lastInputs) ||
        this.frames.length === 0
      ) {
        await this.initTrace(inputs);
      } else {
        // אחרת רק מתקדם צעד בתוך ה-trace המקומי
        this.nextStep();
      }
    } catch (err) {
      console.error(err);
      this.setResult(err.message || "Error calculating payment.");
      this.setButtonText("Calculate Payment!");
    }
  }
}

// אתחול אוטומטי כשהדף נטען
document.addEventListener("DOMContentLoaded", () => {
  window.babysitterUI = new BabysitterCalculatorUI({ steps: 10 });
});
