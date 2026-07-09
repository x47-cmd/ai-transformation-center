/* =========================================================
   ATC Notifications Engine
   Enterprise Foundation V2
========================================================= */

(function () {
  "use strict";

  function show(message, type = "info") {
    let box = document.getElementById("atc-notifications");

    if (!box) {
      box = document.createElement("div");
      box.id = "atc-notifications";
      box.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 320px;
      `;
      document.body.appendChild(box);
    }

    const item = document.createElement("div");
    item.style.cssText = `
      padding: 12px 14px;
      border-radius: 14px;
      background: #111827;
      color: white;
      font-size: 13px;
      box-shadow: 0 12px 30px rgba(0,0,0,.18);
      border-right: 5px solid ${color(type)};
    `;
    item.textContent = message;

    box.appendChild(item);

    setTimeout(() => {
      item.style.opacity = "0";
      item.style.transform = "translateY(-6px)";
      item.style.transition = ".3s ease";
      setTimeout(() => item.remove(), 300);
    }, 2800);
  }

  function color(type) {
    return {
      success: "#22c55e",
      error: "#ef4444",
      warning: "#f59e0b",
      info: "#3b82f6"
    }[type] || "#3b82f6";
  }

  window.ATCNotifications = {
    version: "2.0.0",
    show,
    success: (msg) => show(msg, "success"),
    error: (msg) => show(msg, "error"),
    warning: (msg) => show(msg, "warning"),
    info: (msg) => show(msg, "info")
  };
})();