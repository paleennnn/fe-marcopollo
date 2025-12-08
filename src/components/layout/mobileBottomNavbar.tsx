import React, { useState } from "react";
import {
  useMenu,
  useLink,
  useLogout,
  useRouterType,
  useWarnAboutChange,
  useTranslate,
  CanAccess,
} from "@refinedev/core";
import { Popover } from "antd";
import {
  HomeFilled,
  MoreOutlined,
  UserOutlined,
  ThunderboltFilled,
  CodeSandboxSquareFilled,
  LogoutOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  UsergroupAddOutlined,
  DockerOutlined,
} from "@ant-design/icons";

export const MobileBottomNavbar: React.FC = () => {
  const Link = useLink();
  const { mutate: mutateLogout } = useLogout();
  const [popoverVisible, setPopoverVisible] = useState(false);

  const handleMenuItemClick = () => {
    setPopoverVisible(false);
  };

  // More menu untuk ADMIN
  const adminMoreMenuContent = (
    <div className="flex flex-col gap-3 py-2">
      {/* Profil */}
      <Link
        to="/profile"
        className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md"
        onClick={handleMenuItemClick}
      >
        <UserOutlined
          style={{ fontSize: "1.2em", color: "rgba(44, 89, 90, 1)" }}
          className="mr-2"
        />
        <span style={{ color: "rgba(44, 89, 90, 1)" }}>Profil</span>
      </Link>

      {/* Pengguna */}
      <CanAccess resource="users" action="list">
        <Link
          to="/users"
          className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md"
          onClick={handleMenuItemClick}
        >
          <UsergroupAddOutlined
            style={{ fontSize: "1.2em", color: "rgba(44, 89, 90, 1)" }}
            className="mr-2"
          />
          <span style={{ color: "rgba(44, 89, 90, 1)" }}>Pengguna</span>
        </Link>
      </CanAccess>

      {/* Riwayat Panen */}
      <CanAccess resource="leles-riwayat-panen" action="list">
        <Link
          to="/leles-riwayat-panen"
          className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md"
          onClick={handleMenuItemClick}
        >
          <HistoryOutlined
            style={{ fontSize: "1.2em", color: "rgba(44, 89, 90, 1)" }}
            className="mr-2"
          />
          <span style={{ color: "rgba(44, 89, 90, 1)" }}>Riwayat Panen</span>
        </Link>
      </CanAccess>

      {/* Refunds */}
      <CanAccess resource="refunds" action="list">
        <Link
          to="/refunds"
          className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md"
          onClick={handleMenuItemClick}
        >
          <FileTextOutlined
            style={{ fontSize: "1.2em", color: "rgba(44, 89, 90, 1)" }}
            className="mr-2"
          />
          <span style={{ color: "rgba(44, 89, 90, 1)" }}>Pengembalian</span>
        </Link>
      </CanAccess>

      {/* Logout */}
      <div
        className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
        onClick={() => {
          mutateLogout();
          handleMenuItemClick();
        }}
      >
        <LogoutOutlined
          style={{ fontSize: "1.2em", color: "rgba(44, 89, 90, 1)" }}
          className="mr-2"
        />
        <span style={{ color: "rgba(44, 89, 90, 1)" }}>Logout</span>
      </div>
    </div>
  );

  // More menu untuk CUSTOMER
  const customerMoreMenuContent = (
    <div className="flex flex-col gap-3 py-2">
      {/* Profil */}
      <Link
        to="/profile"
        className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md"
        onClick={handleMenuItemClick}
      >
        <UserOutlined
          style={{ fontSize: "1.2em", color: "rgba(44, 89, 90, 1)" }}
          className="mr-2"
        />
        <span style={{ color: "rgba(44, 89, 90, 1)" }}>Profil</span>
      </Link>

      {/* Logout */}
      <div
        className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
        onClick={() => {
          mutateLogout();
          handleMenuItemClick();
        }}
      >
        <LogoutOutlined
          style={{ fontSize: "1.2em", color: "rgba(44, 89, 90, 1)" }}
          className="mr-2"
        />
        <span style={{ color: "rgba(44, 89, 90, 1)" }}>Logout</span>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 h-16">
      <div className="flex justify-around items-center h-full px-1">
        {/* Material Bangunan */}
        <CanAccess resource="materials" action="list">
          <Link
            to="/materials"
            className="flex flex-col items-center justify-center w-1/5"
          >
            <CodeSandboxSquareFilled
              style={{ fontSize: "1.5em", color: "rgba(44, 89, 90, 1)" }}
            />
            <span
              className="text-xs mt-1 text-center"
              style={{ color: "rgba(44, 89, 90, 1)" }}
            >
              Material
            </span>
          </Link>
        </CanAccess>

        {/* Kambing */}
        <CanAccess resource="kambings" action="list">
          <Link
            to="/kambings"
            className="flex flex-col items-center justify-center w-1/5"
          >
            <ThunderboltFilled
              style={{ fontSize: "1.5em", color: "rgba(44, 89, 90, 1)" }}
            />
            <span
              className="text-xs mt-1 text-center"
              style={{ color: "rgba(44, 89, 90, 1)" }}
            >
              Kambing
            </span>
          </Link>
        </CanAccess>

        {/* Dashboard (Center - Prominent) */}
        <Link
          to="/dashboard"
          className="flex flex-col items-center justify-center w-1/5"
        >
          <div className="flex items-center justify-center bg-primary rounded-full w-12 h-12 -mt-5">
            <HomeFilled style={{ fontSize: "1.8em", color: "white" }} />
          </div>
          <span
            className="text-xs mt-1 text-center"
            style={{ color: "rgba(44, 89, 90, 1)" }}
          >
            Dashboard
          </span>
        </Link>

        {/* Kolam Lele (Admin Only) */}
        <CanAccess resource="leles" action="list">
          <Link
            to="/leles"
            className="flex flex-col items-center justify-center w-1/5"
          >
            <AppstoreOutlined
              style={{ fontSize: "1.5em", color: "rgba(44, 89, 90, 1)" }}
            />
            <span
              className="text-xs mt-1 text-center"
              style={{ color: "rgba(44, 89, 90, 1)" }}
            >
              Kolam Lele
            </span>
          </Link>
        </CanAccess>

        {/* Keranjang Belanja (Customer Only) */}
        <CanAccess resource="customer/keranjang" action="list">
          <Link
            to="/keranjang"
            className="flex flex-col items-center justify-center w-1/5"
          >
            <ShoppingCartOutlined
              style={{ fontSize: "1.5em", color: "rgba(44, 89, 90, 1)" }}
            />
            <span
              className="text-xs mt-1 text-center"
              style={{ color: "rgba(44, 89, 90, 1)" }}
            >
              Keranjang
            </span>
          </Link>
        </CanAccess>

        {/* Transaksi (Admin) / Pesanan Saya (Customer) */}
        <CanAccess resource="orders" action="list">
          <Link
            to="/orders"
            className="flex flex-col items-center justify-center w-1/5"
          >
            <FileTextOutlined
              style={{ fontSize: "1.5em", color: "rgba(44, 89, 90, 1)" }}
            />
            <span
              className="text-xs mt-1 text-center"
              style={{ color: "rgba(44, 89, 90, 1)" }}
            >
              Transaksi
            </span>
          </Link>
        </CanAccess>

        <CanAccess resource="customer/orders" action="list">
          <Link
            to="/customer-orders"
            className="flex flex-col items-center justify-center w-1/5"
          >
            <FileTextOutlined
              style={{ fontSize: "1.5em", color: "rgba(44, 89, 90, 1)" }}
            />
            <span
              className="text-xs mt-1 text-center"
              style={{ color: "rgba(44, 89, 90, 1)" }}
            >
              Pesanan Saya
            </span>
          </Link>
        </CanAccess>
      </div>

      {/* More button (Floating) - ADMIN */}
      <CanAccess resource="users" action="list">
        <Popover
          content={adminMoreMenuContent}
          trigger="click"
          placement="topRight"
          open={popoverVisible}
          onOpenChange={setPopoverVisible}
          overlayClassName="bottom-nav-popover"
        >
          <button
            className="absolute right-4 -top-10 bg-primary text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => setPopoverVisible(!popoverVisible)}
          >
            <MoreOutlined style={{ fontSize: "1.5em" }} />
          </button>
        </Popover>
      </CanAccess>

      {/* More button - CUSTOMER */}
      <CanAccess resource="customer/orders" action="list">
        <Popover
          content={customerMoreMenuContent}
          trigger="click"
          placement="topRight"
          open={popoverVisible}
          onOpenChange={setPopoverVisible}
          overlayClassName="bottom-nav-popover"
        >
          <button
            className="absolute right-4 -top-10 bg-primary text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => setPopoverVisible(!popoverVisible)}
          >
            <MoreOutlined style={{ fontSize: "1.5em" }} />
          </button>
        </Popover>
      </CanAccess>
    </div>
  );
};
