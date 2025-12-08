import { DevtoolsProvider } from "@providers/devtools";
import { useNotificationProvider, RefineThemes } from "@refinedev/antd";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { Suspense } from "react";
import "@refinedev/antd/dist/reset.css";
import "./global.css";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import {
  authProviderClient,
  accessControlProvider,
} from "@providers/auth-provider/auth-provider.client";
import { dataProviders } from "@providers/data-provider";

import {
  CalendarFilled,
  ContactsFilled,
  ControlFilled,
  HomeFilled,
  PhoneOutlined,
  ReadFilled,
  TrophyFilled,
  UserOutlined,
  CodeSandboxSquareFilled,
  ThunderboltFilled,
  DockerOutlined,
  ReadOutlined,
  CheckSquareFilled,
  ShoppingCartOutlined,
  FileTextOutlined,
  UsergroupAddOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  TransactionOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import InstallButton from "@components/installButton";
import { ColorModeContextProvider } from "@contexts/color-mode";

export const metadata: Metadata = {
  title: "Marcopollo Group",
  description: "Marcopollo Group",
  manifest: "/manifest.json",
  keywords: ["Marcopollo"],
  icons: {
    icon: "/favicon-32x32.png",
  },
  authors: [{ name: "Bio", url: "https://github.com/paleennnn" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const theme = cookieStore.get("theme");

  return (
    <html lang="en">
      <body>
        <ColorModeContextProvider defaultMode={theme?.value}>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#3f7f80",
              },
            }}
          >
            <Suspense>
              <RefineKbarProvider>
                <AntdRegistry>
                  <DevtoolsProvider>
                    <Refine
                      routerProvider={routerProvider}
                      dataProvider={dataProviders}
                      notificationProvider={useNotificationProvider}
                      authProvider={authProviderClient}
                      accessControlProvider={accessControlProvider}
                      resources={[
                        {
                          name: "homepage",
                          list: "/",
                          meta: {
                            label: "Home",
                            hide: true,
                          },
                        },
                        {
                          name: "profile",
                          list: "/profile",
                          meta: {
                            label: "My Profile",
                            hide: false,
                            icon: (
                              <UserOutlined style={{ fontSize: "1.2em" }} />
                            ),
                          },
                        },
                        {
                          name: "dashboard",
                          list: "/dashboard",
                          meta: {
                            label: "Dashboard",
                            icon: <HomeFilled style={{ fontSize: "1.2em" }} />,
                          },
                        },
                        {
                          name: "users",
                          list: "/users",
                          create: "/users/create",
                          edit: "/users/edit/:id",
                          show: "/users/show/:id",
                          meta: {
                            canDelete: true,
                            label: "Pengguna",
                            icon: (
                              <UsergroupAddOutlined
                                style={{ fontSize: "1.2em" }}
                              />
                            ),
                          },
                        },
                        {
                          name: "materials",
                          list: "/materials",
                          create: "/materials/create",
                          edit: "/materials/edit/:id",
                          show: "/materials/show/:id",
                          meta: {
                            canDelete: true,
                            label: "Material Bangunan",
                            icon: (
                              <CodeSandboxSquareFilled
                                style={{ fontSize: "1.2em" }}
                              />
                            ),
                          },
                        },
                        {
                          name: "kambings",
                          list: "/kambings",
                          create: "/kambings/create",
                          edit: "/kambings/edit/:id",
                          show: "/kambings/show/:id",
                          meta: {
                            canDelete: true,
                            label: "Kambing",
                            icon: (
                              <ThunderboltFilled
                                style={{ fontSize: "1.2em" }}
                              />
                            ),
                          },
                        },
                        // MENU MANAJEMEN LELE (Dropdown)
                        {
                          name: "manajemen-lele",
                          meta: {
                            label: "Manajemen Lele",
                            icon: <DockerOutlined style={{ fontSize: "1.2em" }} />,
                          },
                        },
                        {
                          name: "leles",
                          list: "/leles",
                          show: "/leles/show/:id",
                          create: "/leles/start-budidaya/:id",
                          edit: "/leles/edit/:id",
                          meta: {
                            label: "Kolam Lele",
                            icon: <AppstoreOutlined style={{ fontSize: "1.2em" }} />,
                            parent: "manajemen-lele",
                          },
                        },
                        {
                          name: "leles-riwayat-panen",
                          list: "/leles-riwayat-panen",
                          show: "/leles-riwayat-panen/show/:id",
                          meta: {
                            label: "Riwayat Panen",
                            icon: <HistoryOutlined style={{ fontSize: "1.2em" }} />,
                            parent: "manajemen-lele",
                          },
                        },
                        // MENU TRANSAKSI (Dropdown)
                        {
                          name: "transaksi",
                          meta: {
                            label: "Manajemen Transaksi",
                            icon: <TransactionOutlined style={{ fontSize: "1.2em" }} />,
                          },
                        },
                        {
                          name: "orders",
                          list: "/orders",
                          show: "/orders/show/:id",
                          edit: "/orders/edit/:id",
                          meta: {
                            canDelete: true,
                            label: "Transaksi",
                            icon: <FileTextOutlined style={{ fontSize: "1.2em" }} />,
                            parent: "transaksi",
                          },
                        },
                        {
                          name: "refunds",
                          list: "/refunds",
                          meta: {
                            label: "Pengembalian",
                            icon: <InboxOutlined style={{ fontSize: "1.2em" }} />,
                            parent: "transaksi",
                          },
                        },
                        // MENU CUSTOMER
                        {
                          name: "customer/keranjang",
                          list: "/keranjang",
                          meta: {
                            canDelete: true,
                            label: "Keranjang Belanja",
                            icon: (
                              <ShoppingCartOutlined
                                style={{ fontSize: "1.2em" }}
                              />
                            ),
                            hide: false,
                          },
                        },
                        {
                          name: "customer/orders",
                          list: "/customer-orders",
                          show: "/customer-orders/show/:id",
                          meta: {
                            canDelete: false,
                            label: "Pesanan Saya",
                            icon: (
                              <FileTextOutlined style={{ fontSize: "1.2em" }} />
                            ),
                            hide: false,
                            identifier: "idOrder",
                          },
                        },
                      ]}
                      options={{
                        syncWithLocation: true,
                        warnWhenUnsavedChanges: true,
                        useNewQueryKeys: true,
                        projectId: "PPapVH-nZKuqU-6aYAL4",
                      }}
                    >
                      {children}
                      <RefineKbar />
                    </Refine>
                  </DevtoolsProvider>
                </AntdRegistry>
              </RefineKbarProvider>
            </Suspense>
          </ConfigProvider>
        </ColorModeContextProvider>
      </body>
    </html>
  );
}