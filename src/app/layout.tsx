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
// import { accessControlProvider } from "@providers/access-control-provider";

import {
  CalendarFilled,
  ContactsFilled,
  ControlFilled,
  HomeFilled,
  PhoneOutlined,
  ReadFilled,
  TrophyFilled,
  UserOutlined,
} from "@ant-design/icons";
import InstallButton from "@components/installButton";

export const metadata: Metadata = {
  title: "Marcopollo Group",
  description: "Marcopollo Group",
  manifest: "/manifest.json",
  keywords: ["Simbah BK"],
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
    <html lang="en" className="light">
      {/* <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="upgrade-insecure-requests"
        />
      </head> */}
      <body>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#3f7f80", // warna hijau
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
                      },
                      {
                        name: "profile",
                        list: "/profile",
                        meta: {
                          label: "My Profile",

                          hide: true,
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
                          icon: <UserOutlined style={{ fontSize: "1.2em" }} />,
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
                          icon: <ControlFilled style={{ fontSize: "1.2em" }} />,
                        },
                      },
                      {
                        name: "kandangs",
                        list: "/kandangs",
                        create: "/kandangs/create",
                        edit: "/kandangs/edit/:id",
                        show: "/kandangs/show/:id",
                        meta: {
                          canDelete: true,
                          label: "Kandang",
                          icon: <ControlFilled style={{ fontSize: "1.2em" }} />,
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
                    {/* <InstallButton /> */}
                    {children}
                    <RefineKbar />
                  </Refine>
                </DevtoolsProvider>
              </AntdRegistry>
            </RefineKbarProvider>
          </Suspense>
        </ConfigProvider>
      </body>
    </html>
  );
}