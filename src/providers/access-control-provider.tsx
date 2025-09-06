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
    const user = parsed.user ? parsed.user : parsed; // ✅ FIX disini

    if (resource === "dashboard" || resource === "profile") {
      return { can: true };
    }

    // Admin bisa semua
    if (isAdmin(user)) {
      return { can: true };
    }

    if (resource === "materials") {
      if (action === "create" || action === "edit" || action === "delete") {
        return { can: isAdmin(user) };
      }
      return { can: true };
    }

    if (resource === "kandangs") {
      if (action === "create" || action === "edit" || action === "delete") {
        return { can: isAdmin(user) };
      }
      return { can: true };
    }

    if (resource === "kambings") {
      if (action === "create" || action === "edit" || action === "delete") {
        return { can: isAdmin(user) };
      }
      return { can: true };
    }

    return { can: false };
  },
  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true,
    },
  },
};
