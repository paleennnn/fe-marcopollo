import { DevtoolsProvider } from "@providers/devtools";
import { useNotificationProvider, RefineThemes } from "@refinedev/antd";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { Suspense } from "react";
import "./global.css";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import {
  authProviderClient,
  accessControlProvider,
} from "@providers/auth-provider/auth-provider.client";
import { dataProviders } from "@providers/data-provider";
// import { accessControlProvider } from "@providers/access-control-provider";
import "@refinedev/antd/dist/reset.css";
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
  authors: [{ name: "Jun", url: "https://juned-setiawan.vercel.app" }],
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
                        name: "regulations",
                        list: "/regulations",
                        create: "/regulations/create",
                        edit: "/regulations/edit/:id",
                        show: "/regulations/show/:id",
                        meta: {
                          canDelete: true,
                          label: "Peraturan Ketertiban",
                          icon: <ControlFilled style={{ fontSize: "1.2em" }} />,
                        },
                      },
                      {
                        name: "violations",
                        list: "/violations",
                        create: "/violations/create",
                        edit: "/violations/edit/:id",
                        show: "/violations/show/:id",
                        meta: {
                          canDelete: true,
                          label: "Pelanggaran Ketertiban",
                          icon: <ReadFilled style={{ fontSize: "1.2em" }} />,
                        },
                      },
                      {
                        name: "awards",
                        list: "/awards",
                        create: "/awards/create",
                        edit: "/awards/edit/:id",
                        show: "/awards/show/:id",
                        meta: {
                          canDelete: true,
                          label: "Prestasi Ketertiban",
                          icon: <TrophyFilled style={{ fontSize: "1.2em" }} />,
                        },
                      },
                      {
                        name: "management-violations",
                        meta: {
                          label: "Rekap Pelanggaran & Penghargaan",
                          icon: <ControlFilled style={{ fontSize: "1.2em" }} />,
                        },
                      },
                      {
                        name: "student-violations",
                        show: "/student-violations/show/:id",
                        meta: {
                          parent: "cms",
                        },
                      },
                      {
                        name: "counselings",
                        list: "/counselings",
                        create: "/counselings/create",
                        edit: "/counselings/edit/:id",
                        show: "/counselings/show/:id",
                        meta: {
                          canDelete: true,
                          label: "Bimbingan Konseling",
                          icon: (
                            <ContactsFilled style={{ fontSize: "1.2em" }} />
                          ),
                        },
                      },
                      {
                        name: "home-visits",
                        list: "/home-visits",
                        create: "/home-visits/create",
                        edit: "/home-visits/edit/:id",
                        show: "/home-visits/show/:id",
                        meta: {
                          canDelete: true,
                          label: "Kunjungan Rumah",
                          icon: (
                            <CalendarFilled style={{ fontSize: "1.2em" }} />
                          ),
                        },
                      },
                      {
                        name: "parent-approval",
                        list: "/parent-approval",
                      },
                      {
                        name: "violation-summary/class",
                        list: "/violation-summary/classes",
                        meta: {
                          parent: "management-violations",
                          label: "Rekap per Kelas",
                          icon: <ReadFilled style={{ fontSize: "1.2em" }} />,
                        },
                      }, // {
                      //   name: "violation-summary/yearly",
                      //   list: "/violation-summary/yearlies",
                      //   meta: {
                      //     parent: "management-violations",
                      //     label: "Rekap Pelanggaran Siswa per Tahun Ajaran",
                      //     icon: <ReadFilled style={{ fontSize: "1.2em" }} />,
                      //   },
                      // },
                      {
                        name: "violation-summary/semester",
                        list: "/violation-summary/semesters",
                        meta: {
                          parent: "management-violations",
                          label: "Rekap per Semester",
                          icon: <ReadFilled style={{ fontSize: "1.2em" }} />,
                        },
                      },
                      {
                        name: "student-calls",
                        list: "/student-calls",
                        create: "/student-calls/create",
                        edit: "/student-calls/edit/:id",
                        show: "/student-calls/show/:id",

                        meta: {
                          canDelete: true,
                          label: "Panggilan Siswa",
                          icon: <PhoneOutlined style={{ fontSize: "1.2em" }} />,
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