"use client";

import React, { useMemo } from "react";
import { useGetIdentity } from "@refinedev/core";
import {
  Typography,
  Descriptions,
  Card,
  Divider,
  Avatar,
  Row,
  Col,
  Tag,
  Spin,
} from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from "@ant-design/icons";
import { DateField } from "@refinedev/antd";
import { createAvatar } from "@dicebear/core";
import { funEmoji } from "@dicebear/collection";

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { data: user, isLoading } = useGetIdentity<{
    id: number;
    fullname: string;
    email: string;
    phone: string;
    address: string;
    username: string;
    role: "admin" | "customer";
    createdAt: string;
    updatedAt: string;
  }>();

   // Debug logs
  console.log("User data dari useGetIdentity:", user);
  console.log("localStorage user:", localStorage.getItem("user"));

  // Avatar generator
  const avatar = useMemo(() => {
    return createAvatar(funEmoji, {
      seed: user?.fullname || user?.username || "User",
      size: 128,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
    }).toDataUri();
  }, [user?.fullname, user?.username]);

  const getBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "blue";
      case "customer":
        return "green";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <Text>Tidak ada data pengguna.</Text>
      </Card>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={<Title level={3}>Profil Saya</Title>}
        bordered={false}
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[24, 24]}>
          {/* Bagian Kiri: Avatar & Info Akun */}
          <Col xs={24} md={8}>
            <Card bordered={false} className="user-info-card">
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Avatar
                  size={100}
                  src={avatar}
                  alt={user?.username}
                  style={{ backgroundColor: getBadgeColor(user.role) }}
                  icon={<UserOutlined />}
                />
                <Title level={3} style={{ marginTop: 16, marginBottom: 0 }}>
                  {user.fullname || user.username}
                </Title>
              </div>

              <Divider style={{ margin: "12px 0" }} />

              <Descriptions column={1}>
                <Descriptions.Item label="Username">
                  <Text strong>{user.username}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Role">
                  <Tag color={getBadgeColor(user.role)}>
                    {user.role === "admin" ? "Admin" : "Customer"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Dibuat pada">
                  <DateField value={user.createdAt} format="DD MMM YYYY" />
                </Descriptions.Item>
                <Descriptions.Item label="Terakhir diperbarui">
                  <DateField value={user.updatedAt} format="DD MMM YYYY" />
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Bagian Kanan: Detail User */}
          <Col xs={24} md={16}>
            <Card
              title="Informasi Pengguna"
              bordered={false}
              className="custom-card"
            >
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Nama Lengkap">
                  {user.fullname || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <MailOutlined /> {user.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="No. Telepon">
                  <PhoneOutlined /> {user.phone || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Alamat">
                  <HomeOutlined /> {user.address || "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};