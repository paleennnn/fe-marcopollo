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

    const user = JSON.parse(userStr) as User;

    // Admin bisa semua
    if (isAdmin(user)) {
      return { can: true };
    }

    if (resource === "materials") {
      if (action === "create" || action === "edit" || action === "delete") {
        return { can: isAdmin(user) };
      }
      return {
        can: true, // Everyone can view regulations
      };
    }

    // // Customer
    // if (isCustomer(user)) {
    //   // Boleh lihat list & detail materials dan kambing
    //   if (["materials", "kambing"].includes(resource)) {
    //     if (["list", "show"].includes(action)) {
    //       return { can: true };
    //     }
    //     // Boleh create order untuk pembelian
    //     if (["create"].includes(action)) {
    //       return { can: true };
    //     }
    //   }

    //   // Boleh akses orders (transaksi)
    //   if (resource === "orders" && ["list", "show", "create"].includes(action)) {
    //     return { can: true };
    //   }

    //   return { can: false };
    // }

    return { can: false };
  },
  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true,
    },
  },
};
