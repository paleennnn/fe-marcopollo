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
import React, { useContext } from "react";
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

  // Dropdown props - simplified
  const dropdownProps = {
    menu: { items: menuItems },
    placement: "bottomRight" as const,
    arrow: true,
    trigger: ['click'],
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
                style={{ 
                  cursor: "pointer",
                  transition: "color 0.3s",
                  ":hover": {
                    color: token.colorPrimary,
                  }
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
              >
                <Avatar 
                  src={user?.avatar} 
                  alt={user?.name}
                  size="default"
                  style={{ 
                    cursor: "pointer",
                    transition: "all 0.3s",
                    ":hover": {
                      border: `2px solid ${token.colorPrimary}`,
                      boxShadow: `0 0 0 3px ${token.colorPrimaryBg}`,
                    }
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