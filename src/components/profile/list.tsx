"use client";

import React, { useMemo, useState, useEffect } from "react";
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
  Alert,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { createAvatar } from "@dicebear/core";
import { funEmoji } from "@dicebear/collection";

const { Title, Text } = Typography;

interface UserData {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  username: string;
  role: "admin" | "customer";
  createdAt: string;
  updatedAt: string;
  is_verified?: boolean;
}

export const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FUNCTION UNTUK GET USER INFO DARI LOCALSTORAGE (SAMA SEPERTI SEBELUMNYA)
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem("user");
      console.log("📝 Raw user data from localStorage:", userStr);

      if (!userStr) {
        console.log("❌ No user data found in localStorage");
        return null;
      }

      const parsed = JSON.parse(userStr);
      console.log("📝 Parsed user data:", parsed);

      // Handle berbagai format response
      const userData = parsed.user ? parsed.user : parsed;

      const userInfo: UserData = {
        id: userData.id,
        fullname: userData.fullname || userData.name || "",
        email: userData.email || "",
        phone: userData.phone || userData.telepon || "",
        address: userData.address || userData.alamat || "",
        username: userData.username || userData.nama_pengguna || "",
        role: userData.role || "customer",
        createdAt:
          userData.createdAt || userData.created_at || userData.createAut || "",
        updatedAt: userData.updatedAt || userData.updated_at || "",
        is_verified: userData.is_verified || false,
      };

      console.log("👤 Extracted user info:", userInfo);
      return userInfo;
    } catch (error) {
      console.error("❌ Error parsing user data:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadUserData = () => {
      try {
        setLoading(true);
        const userInfo = getUserInfo();

        if (userInfo) {
          setUser(userInfo);
        } else {
          setError("Tidak dapat memuat data pengguna");
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "24px" }}>
        <Card>
          <Alert
            message="Data Tidak Ditemukan"
            description="Tidak dapat menemukan data pengguna. Silakan login kembali."
            type="warning"
            showIcon
          />
        </Card>
      </div>
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
            <Card
              bordered={false}
              style={{
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                height: "100%",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Avatar
                  size={100}
                  src={avatar}
                  alt={user.username}
                  style={{
                    backgroundColor: getBadgeColor(user.role),
                    marginBottom: 16,
                  }}
                  icon={<UserOutlined />}
                />
                <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
                  {user.fullname || user.username}
                </Title>
                <Tag
                  color={getBadgeColor(user.role)}
                  style={{ fontSize: "12px", padding: "4px 8px" }}
                >
                  {user.role === "admin" ? "Administrator" : "Customer"}
                </Tag>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              <Descriptions column={1} size="small">
                <Descriptions.Item label="Username">
                  <Text strong style={{ fontSize: "14px" }}>
                    @{user.username}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={user.is_verified ? "green" : "orange"}>
                    {user.is_verified ? "Terverifikasi" : "Belum Verifikasi"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      Dibuat pada
                    </span>
                  }
                >
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {formatDate(user.createdAt)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      Terakhir diperbarui
                    </span>
                  }
                >
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {formatDate(user.updatedAt)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Bagian Kanan: Detail User */}
          <Col xs={24} md={16}>
            <Card
              title="Informasi Pengguna"
              bordered={false}
              style={{
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                height: "100%",
              }}
            >
              <Descriptions
                bordered
                column={1}
                size="middle"
                labelStyle={{
                  fontWeight: 600,
                  width: "150px",
                  backgroundColor: "#fafafa",
                }}
              >
                <Descriptions.Item
                  label={
                    <span>
                      <UserOutlined style={{ marginRight: 8 }} />
                      Nama Lengkap
                    </span>
                  }
                >
                  <Text strong style={{ fontSize: "14px" }}>
                    {user.fullname || "-"}
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <MailOutlined style={{ marginRight: 8 }} />
                      Email
                    </span>
                  }
                >
                  <div>
                    <Text style={{ fontSize: "14px" }}>
                      {user.email || "-"}
                    </Text>
                    {user.is_verified && (
                      <Tag
                        color="green"
                        style={{ marginLeft: 8, fontSize: "10px" }}
                      >
                        Terverifikasi
                      </Tag>
                    )}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <PhoneOutlined style={{ marginRight: 8 }} />
                      No. Telepon
                    </span>
                  }
                >
                  <Text style={{ fontSize: "14px" }}>{user.phone || "-"}</Text>
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <HomeOutlined style={{ marginRight: 8 }} />
                      Alamat
                    </span>
                  }
                >
                  <Text style={{ fontSize: "14px" }}>
                    {user.address || "-"}
                  </Text>
                </Descriptions.Item>
              </Descriptions>

              {/* Additional Info */}
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  backgroundColor: "#f0f8ff",
                  borderRadius: 6,
                }}
              >
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  💡 Untuk mengubah informasi profil, silakan hubungi
                  administrator.
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
