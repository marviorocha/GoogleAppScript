const Utils = {
  todayDateString: function() {
    const date = new Date();
    const month = this.getMonthName(String(date.getMonth() + 1).padStart(2, "0"));
    const year = date.getFullYear();
    return `${month}/${year}`;
  },

  getMonthName: function(monthNumber) {
    const date = new Date();
    date.setMonth(parseInt(monthNumber, 10) - 1);
    const data_month = date.toLocaleString("pt-BR", { month: "long" });
    return String(data_month).charAt(0).toUpperCase() + String(data_month).slice(1);
  },

  sanitizeDriveFolderName: function(name) {
    if (!name || typeof name !== "string") return "Cliente";
    const trimmed = name.trim();
    return trimmed ? trimmed.replace(/[\\/:*?"<>|#%]+/g, "").replace(/\s+/g, " ").trim() : "Cliente";
  },

  formatCurrencyBR: function(input) {
    if (input === null || input === undefined) return "";
    let s = String(input).trim().replace(/\s/g, "").replace(/[^\d.,-]/g, "");
    if (!s) return "";

    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    let normalized = s;

    if (lastDot > -1 && lastComma > -1) {
      normalized = (lastComma > lastDot) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    } else if (lastComma > -1) {
      const countComma = (s.match(/,/g) || []).length;
      normalized = (countComma === 1 && s.length - lastComma - 1 <= 2) ? s.replace(",", ".") : s.replace(/,/g, "");
    }

    normalized = normalized.replace(/[^\d.-]/g, "");
    const num = parseFloat(normalized);
    return isNaN(num) ? input : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  }
};