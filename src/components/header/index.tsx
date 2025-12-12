"use client";

import { ColorModeContext } from "@contexts/color-mode";
import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/antd";
import { useGetIdentity, useLogout } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Space,
  Switch,
  theme,
  Typography,
  Dropdown,
  MenuProps,
  Button,
} from "antd";
import React, { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserOutlined, LogoutOutlined, MenuOutlined, RightOutlined, LeftOutlined } from "@ant-design/icons";
import { useThemedLayoutContext } from "@refinedev/antd";

const { Text } = Typography;
const { useToken } = theme;

const AppTitle: React.FC = () => (
  <Text strong style={{ fontSize: "18px" }}>
    Marcopollo
  </Text>
);

type IUser = {
  id: number;
  name: string;
  avatar: string;
  email?: string;
};

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);
  const router = useRouter();
  const { mutate: logout } = useLogout();
  const { siderCollapsed, setSiderCollapsed } = useThemedLayoutContext();
  
  const [isNameHovered, setIsNameHovered] = useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [displayUser, setDisplayUser] = useState<IUser | null>(null);

  // Fallback dari localStorage jika useGetIdentity belum tersinkronisasi
  useEffect(() => {
    if (user) {
      setDisplayUser(user);
    } else {
      // Ambil dari localStorage sebagai fallback
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const parsed = JSON.parse(userStr);
          const displayData: IUser = {
            id: parsed.id || 0,
            name: parsed.name || parsed.fullname || "User",
            avatar: parsed.avatar || "",
            email: parsed.email || "",
          };
          setDisplayUser(displayData);
        }
      } catch {
        // ignore
      }
    }
  }, [user]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "space-between", // Diubah untuk memberikan ruang di kiri dan kanan
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1000;
  }

  // Dropdown menu items
  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined />
          <span>Profile</span>
        </div>
      ),
      onClick: () => router.push("/profile"),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogoutOutlined />
          <span>Logout</span>
        </div>
      ),
      onClick: () => logout(),
    },
  ];

  // Dropdown props - fixed typing
  const dropdownProps = {
    menu: { items: menuItems },
    placement: "bottomRight" as const,
    arrow: true,
    trigger: ['click'] as ('click' | 'hover' | 'contextMenu')[],
  };

  return (
    <AntdLayout.Header style={headerStyles}>
      {/* Left section - Sidebar toggle button */}
      <div>
        {isMobile ? (
          <AppTitle />
        ) : (
          <Button
            size="large"
            onClick={() => setSiderCollapsed(!siderCollapsed)}
            icon={siderCollapsed ? <RightOutlined /> : <LeftOutlined />}
          />
        )}
      </div>

      {/* Right section - Theme toggle and user info */}
      <Space>
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={setMode}
          defaultChecked={mode === "dark"}
        />
        {(displayUser?.name || displayUser?.avatar) && (
          <Space style={{ marginLeft: "8px" }} size="middle">
            {displayUser?.name && (
              <Text 
                strong 
                onClick={() => router.push("/profile")}
                onMouseEnter={() => setIsNameHovered(true)}
                onMouseLeave={() => setIsNameHovered(false)}
                style={{ 
                  cursor: "pointer",
                  transition: "color 0.3s",
                  color: isNameHovered ? token.colorPrimary : undefined,
                }}
              >
                {displayUser.name}
              </Text>
            )}
            <Dropdown {...dropdownProps}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "50%",
                  transition: "all 0.3s",
                }}
                onMouseEnter={() => setIsAvatarHovered(true)}
                onMouseLeave={() => setIsAvatarHovered(false)}
              >
                <Avatar 
                  src={displayUser?.avatar} 
                  alt={displayUser?.name}
                  size="default"
                  icon={!displayUser?.avatar ? <UserOutlined /> : undefined}
                  style={{ 
                    cursor: "pointer",
                    transition: "all 0.3s",
                    border: isAvatarHovered ? `2px solid ${token.colorPrimary}` : undefined,
                    boxShadow: isAvatarHovered ? `0 0 0 3px ${token.colorPrimaryBg}` : undefined,
                  }}
                />
              </div>
            </Dropdown>
          </Space>
        )}
      </Space>
    </AntdLayout.Header>
  );
};