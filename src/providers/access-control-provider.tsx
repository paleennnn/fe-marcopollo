import { AccessControlProvider } from "@refinedev/core";

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      return { can: false };
    }

    const user = JSON.parse(userStr) as { role: string };

    // Admin bebas akses semua
    if (user.role === "admin") {
      return { can: true };
    }

    // Customer punya akses terbatas
    if (user.role === "customer") {
      // Contoh: customer hanya boleh melihat dashboard & list material
      if (
        resource === "dashboard" ||
        (resource === "materials" && (action === "list" || action === "show"))
      ) {
        return { can: true };
      }
      return { can: false };
    }

    // Default: tidak boleh
    return { can: false };
  },
  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true,
    },
  },
};
