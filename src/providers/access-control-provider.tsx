import { AccessControlProvider } from "@refinedev/core";
import { User } from "@providers/auth-provider/types";

const isAdmin = (user?: User) => user?.role === "admin";
const isCustomer = (user?: User) => user?.role === "customer";

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      return { can: false };
    }

    const parsed = JSON.parse(userStr);
    const user = parsed.user ? parsed.user : parsed;

    // ✅ Resources yang bisa diakses semua user yang login
    if (resource === "dashboard" || resource === "profile") {
      return { can: true };
    }

    // 👑 Admin bisa akses semua kecuali customer-specific resources
    if (isAdmin(user)) {
      // Admin TIDAK bisa akses keranjang dan customer orders
      if (resource === "customer/keranjang" || resource === "customer/orders") {
        return { can: false };
      }
      return { can: true };
    }

    // 🛒 KERANJANG - Customer Only
    if (resource === "customer/keranjang") {
      return { can: isCustomer(user) };
    }

    // 🧾 CUSTOMER ORDERS - Customer Only
    if (resource === "customer/orders") {
      // Customer bisa list dan show saja
      if (action === "list" || action === "show") {
        return { can: isCustomer(user) };
      }
      return { can: false };
    }

    // ✅ ADMIN ORDERS - Admin Only (Verifikasi)
    if (resource === "orders") {
      return { can: isAdmin(user) };
    }

    // 📦 MATERIALS
    if (resource === "materials") {
      if (action === "create" || action === "edit" || action === "delete") {
        return { can: isAdmin(user) };
      }
      if (action === "list" || action === "show") {
        return { can: isCustomer(user) || isAdmin(user) };
      }
      return { can: true };
    }

    // 🏠 KANDANGS
    if (resource === "kandangs") {
      if (action === "create" || action === "edit" || action === "delete") {
        return { can: isAdmin(user) };
      }
      if (action === "list" || action === "show") {
        return { can: true };
      }
      return { can: true };
    }

    // 🐐 KAMBINGS
    if (resource === "kambings") {
      if (action === "create" || action === "edit" || action === "delete") {
        return { can: isAdmin(user) };
      }
      if (action === "list" || action === "show") {
        return { can: true };
      }
      return { can: true };
    }

    // 🐟 LELES
    if (resource === "leles") {
      if (action === "create" || action === "edit" || action === "delete") {
        return { can: isAdmin(user) };
      }
      if (action === "list" || action === "show") {
        return { can: true };
      }
      return { can: true };
    }

    // 👥 USERS - Admin Only
    if (resource === "users") {
      return { can: isAdmin(user) };
    }

    // Default: deny
    return { can: false };
  },
  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true,
    },
  },
};
