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
} from "antd";
import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { useToken } = theme;

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
  
  const [isNameHovered, setIsNameHovered] = useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
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
      <Space>
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={setMode}
          defaultChecked={mode === "dark"}
        />
        {(user?.name || user?.avatar) && (
          <Space style={{ marginLeft: "8px" }} size="middle">
            {user?.name && (
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
                {user.name}
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
                  src={user?.avatar} 
                  alt={user?.name}
                  size="default"
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