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

const getUserInfo = (): UserData | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    const parsed = JSON.parse(userStr);
    const userData = parsed.user || parsed;

    return {
      id: userData.id,
      fullname: userData.fullname || userData.name || "",
      email: userData.email || "",
      phone: userData.phone || userData.telepon || "",
      address: userData.address || userData.alamat || "",
      username: userData.username || userData.nama_pengguna || "",
      role: userData.role || "customer",
      createdAt: userData.createdAt || userData.created_at || "",
      updatedAt: userData.updatedAt || userData.updated_at || "",
      is_verified: Boolean(userData.is_verified),
    };
  } catch {
    return null;
  }
};

const getBadgeColor = (role: string): string => {
  return role === "admin" ? "blue" : "green";
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
};

export const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = () => {
      try {
        const userInfo = getUserInfo();
        if (userInfo) {
          setUser(userInfo);
        } else {
          setError("Tidak dapat memuat data pengguna");
        }
      } catch {
        setError("Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const avatar = useMemo(() => {
    return createAvatar(funEmoji, {
      seed: user?.fullname || user?.username || "User",
      size: 128,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
    }).toDataUri();
  }, [user?.fullname, user?.username]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.padding}>
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
      <div style={styles.padding}>
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
    <div style={styles.padding}>
      <Card
        title={<Title level={3}>Profil Saya</Title>}
        bordered={false}
        style={styles.mainCard}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card bordered={false} style={styles.avatarCard}>
              <div style={styles.avatarContainer}>
                <Avatar
                  size={100}
                  src={avatar}
                  alt={user.username}
                  style={styles.avatar}
                  icon={<UserOutlined />}
                />
                <Title level={3} style={styles.nameTitle}>
                  {user.fullname || user.username}
                </Title>
                <Tag color={getBadgeColor(user.role)} style={styles.roleTag}>
                  {user.role === "admin" ? "Administrator" : "Customer"}
                </Tag>
              </div>

              <Divider style={styles.divider} />

              <Descriptions column={1} size="small">
                <Descriptions.Item label="Username">
                  <Text strong style={styles.text}>
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
                      <CalendarOutlined style={styles.icon} />
                      Dibuat pada
                    </span>
                  }
                >
                  <Text type="secondary" style={styles.smallText}>
                    {formatDate(user.createdAt)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span>
                      <CalendarOutlined style={styles.icon} />
                      Terakhir diperbarui
                    </span>
                  }
                >
                  <Text type="secondary" style={styles.smallText}>
                    {formatDate(user.updatedAt)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={16}>
            <Card
              title="Informasi Pengguna"
              bordered={false}
              style={styles.infoCard}
            >
              <Descriptions
                bordered
                column={1}
                size="middle"
                labelStyle={styles.labelStyle}
              >
                <Descriptions.Item
                  label={
                    <span>
                      <UserOutlined style={styles.icon} />
                      Nama Lengkap
                    </span>
                  }
                >
                  <Text strong style={styles.text}>
                    {user.fullname || "-"}
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <MailOutlined style={styles.icon} />
                      Email
                    </span>
                  }
                >
                  <div>
                    <Text style={styles.text}>{user.email || "-"}</Text>
                    {user.is_verified && (
                      <Tag color="green" style={styles.verifiedTag}>
                        Terverifikasi
                      </Tag>
                    )}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <PhoneOutlined style={styles.icon} />
                      No. Telepon
                    </span>
                  }
                >
                  <Text style={styles.text}>{user.phone || "-"}</Text>
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <HomeOutlined style={styles.icon} />
                      Alamat
                    </span>
                  }
                >
                  <Text style={styles.text}>{user.address || "-"}</Text>
                </Descriptions.Item>
              </Descriptions>

              <div style={styles.infoNote}>
                <Text type="secondary" style={styles.noteText}>
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

const styles = {
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "50vh",
  } as const,
  padding: {
    padding: "24px",
  } as const,
  mainCard: {
    marginBottom: 24,
  } as const,
  avatarCard: {
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    height: "100%",
  } as const,
  avatarContainer: {
    textAlign: "center" as const,
    marginBottom: 24,
  } as const,
  avatar: {
    backgroundColor: "#1890ff",
    marginBottom: 16,
  } as const,
  nameTitle: {
    marginTop: 16,
    marginBottom: 8,
  } as const,
  roleTag: {
    fontSize: "12px",
    padding: "4px 8px",
  } as const,
  divider: {
    margin: "16px 0",
  } as const,
  icon: {
    marginRight: 8,
  } as const,
  text: {
    fontSize: "14px",
  } as const,
  smallText: {
    fontSize: "12px",
  } as const,
  infoCard: {
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    height: "100%",
  } as const,
  labelStyle: {
    fontWeight: 600,
    width: "150px",
    backgroundColor: "#fafafa",
  } as const,
  verifiedTag: {
    marginLeft: 8,
    fontSize: "10px",
  } as const,
  infoNote: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f0f8ff",
    borderRadius: 6,
  } as const,
  noteText: {
    fontSize: "12px",
  } as const,
};