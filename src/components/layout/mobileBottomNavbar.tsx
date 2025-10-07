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
import { Popover, Badge } from "antd";
import {
  HomeFilled,
  ControlFilled,
  ReadFilled,
  ContactsFilled,
  CalendarFilled,
  MoreOutlined,
  PhoneOutlined,
  TrophyFilled,
  PhoneFilled,
  UserOutlined,
  ThunderboltFilled,
  DockerOutlined,
  CodeSandboxSquareFilled,
  LogoutOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

export const MobileBottomNavbar: React.FC = () => {
  const { menuItems } = useMenu();
  const Link = useLink();
  const routerType = useRouterType();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const translate = useTranslate();
  const { mutate: mutateLogout } = useLogout();
  const [popoverVisible, setPopoverVisible] = useState(false);

  // Function to handle popover visibility
  const handlePopoverVisibleChange = (visible: boolean) => {
    setPopoverVisible(visible);
  };

  // Function to close popover after menu item click
  const handleMenuItemClick = () => {
    setPopoverVisible(false);
  };

  // More menu content
  const moreMenuContent = (
    <div className="flex flex-col gap-3 py-2">
      {/* Users */}
      <CanAccess resource="users" action="list">
        <Link
          to="/users"
          className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md"
        >
          <UsergroupAddOutlined
            style={{ fontSize: "1.2em", color: "rgba(44, 89, 90, 1)" }}
            className="mr-2"
          />
          <span style={{ color: "rgba(44, 89, 90, 1)" }}>Pengguna</span>
        </Link>
      </CanAccess>

      {/* Rekap Menu Items */}
      {/*
      <CanAccess resource="violation-summary/class" action="list">
        <Link
          to="/violation-summary/classes"
          className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md"
          onClick={handleMenuItemClick}
        >
          <ReadFilled
            style={{ fontSize: "1.2em", color: "rgba(44, 89, 90, 1)" }}
            className="mr-2"
          />
          <span style={{ color: "rgba(44, 89, 90, 1)" }}>Rekap per Kelas</span>
        </Link>
      </CanAccess>

      <CanAccess resource="violation-summary/semester" action="list">
        <Link
          to="/violation-summary/semesters"
          className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md"
          onClick={handleMenuItemClick}
        >
          <ReadFilled
            style={{ fontSize: "1.2em", color: "rgba(44, 89, 90, 1)" }}
            className="mr-2"
          />
          <span style={{ color: "rgba(44, 89, 90, 1)" }}>
            Rekap per Semester
          </span>
        </Link>
      </CanAccess>
      */}

      {/* Logout */}
      <div
        className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
        onClick={() => {
          mutateLogout();
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
        {/* Material */}
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

        {/* Dashboard (Center) */}
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

        {/* Lele */}
        <CanAccess resource="lele" action="list">
          <Link
            to="/lele"
            className="flex flex-col items-center justify-center w-1/5"
          >
            <DockerOutlined
              style={{ fontSize: "1.5em", color: "rgba(44, 89, 90, 1)" }}
            />
            <span
              className="text-xs mt-1 text-center"
              style={{ color: "rgba(44, 89, 90, 1)" }}
            >
              Lele
            </span>
          </Link>
        </CanAccess>

        {/* Profile */}
        <CanAccess resource="profile" action="list">
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center w-1/5"
          >
            <UserOutlined
              style={{ fontSize: "1.5em", color: "rgba(44, 89, 90, 1)" }}
            />
            <span
              className="text-xs mt-1 text-center"
              style={{ color: "rgba(44, 89, 90, 1)" }}
            >
              Profil
            </span>
          </Link>
        </CanAccess>
      </div>

      {/* More button (floating) */}
      <Popover
        content={moreMenuContent}
        trigger="click"
        placement="topRight"
        open={popoverVisible}
        onOpenChange={handlePopoverVisibleChange}
        overlayClassName="bottom-nav-popover"
      >
        <button
          className="absolute right-4 -top-10 bg-primary text-white rounded-full p-3 shadow-lg"
          onClick={() => setPopoverVisible(!popoverVisible)}
        >
          <MoreOutlined style={{ fontSize: "1.5em" }} />
        </button>
      </Popover>
    </div>
  );
};