/* =========================================================
   ATC Export Engine
   Enterprise Foundation V2
========================================================= */

(function () {
  "use strict";

  window.ATCExport = {
    version: "2.0.0",

    exportJSON(name = "atc-export") {
      const data = window.ATCStore?.getState?.() || {};
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
      });

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.json`;
      a.click();

      URL.revokeObjectURL(a.href);
      window.ATCNotifications?.success?.("تم تصدير البيانات بنجاح");
    },

    printPage() {
      window.print();
    },

    exportPDF() {
      window.print();
      window.ATCNotifications?.info?.("استخدم خيار Save as PDF من نافذة الطباعة");
    }
  };
})();