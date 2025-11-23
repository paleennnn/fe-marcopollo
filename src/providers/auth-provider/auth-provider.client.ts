"use client";

import type { AuthProvider } from "@refinedev/core";
import Cookies from "js-cookie";
import { SignJWT, jwtVerify } from "jose";
import { dataProviders } from "../data-provider";
import { accessControlProvider } from "../access-control-provider";
import { act } from "react";

const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

export const authProviderClient: AuthProvider = {
  // LOGIN
  login: async ({ username, password }) => {
    try {
      const response = await fetch(dataProviders.getApiUrl() + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Login failed");

      const data = await response.json();
      const actualToken = data.token.token;

      // Encrypt token
      const encryptedToken = await new SignJWT({ token: actualToken })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(secret);

      Cookies.set("auth", encryptedToken, {
        expires: 30,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      localStorage.setItem("token", actualToken);

      // SIMPAN USER DENGAN FORMAT BENAR
      const u = data.user;

      const formattedUser = {
        id: u.id,
        name: u.fullname ?? u.username,
        fullname: u.fullname,
        username: u.username,
        avatar: `https://ui-avatars.com/api/?name=${u.fullname}`,
        role: u.role,
        email: u.email,
        phone: u.phone,
        address: u.address,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };

      localStorage.setItem("user", JSON.stringify(formattedUser));

      return { success: true, redirectTo: "/dashboard" };
    } catch {
      return {
        success: false,
        error: { name: "LoginError", message: "Invalid username or password" },
      };
    }
  },

  // REGISTER
  register: async ({
    fullname,
    email,
    phone,
    address,
    username,
    password,
    role,
  }) => {
    try {
      const response = await fetch(dataProviders.getApiUrl() + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname,
          email,
          phone,
          address,
          username,
          password,
          role: role || "customer",
        }),
      });

      const data = await response.json();
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(data.message || "Register failed");
      }

      return { success: true, redirectTo: "/login" };
    } catch {
      return {
        success: false,
        error: { name: "RegisterError", message: "Failed to register account" },
      };
    }
  },

  // LOGOUT
  logout: async () => {
    Cookies.remove("auth", { path: "/" });
    localStorage.removeItem("user");
    return { success: true, redirectTo: "/" };
  },

  // CHECK AUTH
  check: async () => {
    const auth = Cookies.get("auth");
    if (auth) {
      try {
        await jwtVerify(auth, secret);
        return { authenticated: true };
      } catch {
        return { authenticated: false, logout: true, redirectTo: "/login" };
      }
    }
    return { authenticated: false, logout: true, redirectTo: "/login" };
  },

  // GET PERMISSIONS
  getPermissions: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      return parsedUser.role;
    }
    return null;
  },

  // GET IDENTITY
  // src\providers\auth-provider\auth-provider client ts
  getIdentity: async () => {
    const auth = localStorage.getItem("user"); // FIXED KEY
    if (!auth) return null;
    try {
      const user = JSON.parse(auth);
      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        email: user.email,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch {
      return null;
    }
  },

  // ERROR HANDLING
  onError: async (error) => {
    if (error.response?.status === 401) return { logout: true };
    return { error };
  },
};

export { accessControlProvider };
