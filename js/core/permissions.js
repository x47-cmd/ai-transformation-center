/* =========================================================
   ATC Permissions Engine
   Enterprise Foundation V2
========================================================= */

(function () {
  "use strict";

  const DEFAULT_ROLE = "executive";

  const ROLES = {
    admin: ["view", "edit", "delete", "export", "approve", "settings"],
    executive: ["view", "export", "approve"],
    manager: ["view", "edit", "export"],
    viewer: ["view"]
  };

  function getRole() {
    return localStorage.getItem("atcRole") || DEFAULT_ROLE;
  }

  function setRole(role) {
    if (!ROLES[role]) return false;
    localStorage.setItem("atcRole", role);
    document.dispatchEvent(new CustomEvent("atc:permissionsChanged", {
      detail: { role }
    }));
    return true;
  }

  function can(action) {
    const role = getRole();
    return ROLES[role]?.includes(action) || false;
  }

  window.ATCPermissions = {
    version: "2.0.0",
    roles: ROLES,
    getRole,
    setRole,
    can
  };
})();