"use client";

import { useList, useGo } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Card, Row, Col, Typography, Tag, Space, Statistic, Skeleton, Grid } from "antd";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

type StatusType = "kosong" | "sedang_budidaya" | "siap_panen";

export const LeleList = () => {
  const go = useGo();
  const screens = useBreakpoint();
  const { data, isLoading } = useList({
    resource: "leles",
  });

  const kolams = Array.isArray(data?.data)
    ? data.data
    : Array.isArray((data as any)?.data?.data)
    ? (data as any)?.data?.data
    : [];

  // ✅ FIX: Function untuk mendapatkan status yang benar
  const getDisplayStatus = (kolam: any): StatusType => {
    // Perbaikan: Gunakan properti yang benar dari API (camelCase)
    const hariKe = kolam.hari_ke || kolam.hariKe || 0;
    const status = kolam.status || "kosong";

    if (status === "kosong") {
      return "kosong";
    }

    if (kolam.budidaya && hariKe >= 90) {
      return "siap_panen";
    }

    if (kolam.budidaya && hariKe < 90) {
      return "sedang_budidaya";
    }

    return status as StatusType;
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "kosong":
        return "#d9d9d9";
      case "sedang_budidaya":
        return "#faad14";
      case "siap_panen":
        return "#52c41a";
      default:
        return "#d9d9d9";
    }
  };

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case "kosong":
        return <ExclamationCircleOutlined />;
      case "sedang_budidaya":
        return <ClockCircleOutlined />;
      case "siap_panen":
        return <CheckCircleOutlined />;
      default:
        return <ExclamationCircleOutlined />;
    }
  };

  const getStatusLabel = (status: StatusType) => {
    switch (status) {
      case "kosong":
        return "Kosong";
      case "sedang_budidaya":
        return "Sedang Budidaya";
      case "siap_panen":
        return "Siap Panen";
      default:
        return status;
    }
  };

  const handleCardClick = (kolamId: number) => {
    go({ to: `/leles/show/${kolamId}` });
  };

  // Responsive grid layout dengan 5 kolom per baris di desktop
  const getGridConfig = () => {
    if (screens.xxl) return { span: 4 }; // 6 kolom per baris (24/4=6) -> ubah ke 4.8
    if (screens.xl) return { span: 4.8 }; // 5 kolom per baris (24/4.8=5)
    if (screens.lg) return { span: 6 }; // 4 kolom per baris
    if (screens.md) return { span: 8 }; // 3 kolom per baris
    if (screens.sm) return { span: 12 }; // 2 kolom per baris
    return { span: 24 }; // 1 kolom per baris di mobile
  };

  if (isLoading) {
    return (
      <List
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <AppstoreOutlined style={{ fontSize: 24, marginRight: 12 }} />
            <Text strong style={{ fontSize: 20 }}>
              Loading...
            </Text>
          </div>
        }
      >
        <Row gutter={[16, 16]}>
          {Array.from({ length: 10 }).map((_, index) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={4.8} key={index}>
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </Col>
          ))}
        </Row>
      </List>
    );
  }

  return (
    <List
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <AppstoreOutlined style={{ fontSize: 24, marginRight: 12 }} />
            <Text strong style={{ fontSize: 20 }}>
              Manajemen Kolam Lele ({kolams.length} Kolam)
            </Text>
          </div>
        </div>
      }
      headerButtons={() => null}
    >
      <Row gutter={[16, 16]} justify="start">
        {kolams && kolams.length > 0 ? (
          kolams.map((kolam: any) => {
            const displayStatus = getDisplayStatus(kolam);
            const hariKe = kolam.hari_ke || kolam.hariKe || 0;
            
            return (
              <Col 
                xs={24} 
                sm={12} 
                md={8} 
                lg={6} 
                xl={4.8} // 5 kolom per baris (24/4.8=5)
                key={kolam.id_kolam || kolam.id}
              >
                <Card
                  hoverable
                  onClick={() => handleCardClick(kolam.id_kolam || kolam.id)}
                  variant="outlined"
                  style={{
                    borderLeft: `4px solid ${getStatusColor(displayStatus)}`,
                    cursor: "pointer",
                    transition: "all 0.3s",
                    height: "100%",
                    minHeight: "180px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  styles={{
                    body: { 
                      padding: "16px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    },
                  }}
                >
                  {/* Header dengan Nomor Kolam dan Status */}
                  <div style={{ flex: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <Title 
                        level={4} 
                        style={{ 
                          margin: 0,
                          fontSize: screens.xs ? "16px" : "18px"
                        }}
                      >
                        Kolam {kolam.nomor_kolam}
                      </Title>
                      <Tag
                        color={getStatusColor(displayStatus)}
                        icon={getStatusIcon(displayStatus)}
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          margin: 0,
                          lineHeight: "16px"
                        }}
                      >
                        {getStatusLabel(displayStatus)}
                      </Tag>
                    </div>

                    {/* Info Ukuran dan Kapasitas */}
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                        {kolam.ukuran || "-"}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                        Kapasitas: {(kolam.kapasitas_max || 0).toLocaleString("id-ID")} ekor
                      </Text>
                    </div>
                  </div>

                  {/* Konten Dinamis berdasarkan Status */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    {displayStatus === "kosong" ? (
                      <div style={{ textAlign: "center", padding: "8px 0" }}>
                        <ExclamationCircleOutlined 
                          style={{ 
                            fontSize: "24px", 
                            color: "#bfbfbf",
                            marginBottom: "8px"
                          }} 
                        />
                        <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                          Kolam kosong
                        </Text>
                        <Text type="secondary" style={{ fontSize: "11px" }}>
                          Klik untuk mulai budidaya
                        </Text>
                      </div>
                    ) : (
                      <div>
                        {/* Info Budidaya */}
                        {kolam.budidaya && (
                          <>
                            <Statistic
                              title="Hari Ke-"
                              value={hariKe}
                              suffix="/90"
                              valueStyle={{ 
                                fontSize: screens.xs ? "16px" : "20px",
                                color: hariKe >= 90 ? "#52c41a" : "#1890ff"
                              }}
                              style={{ marginBottom: 8 }}
                            />
                            
                            <div style={{ 
                              display: "flex", 
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "12px"
                            }}>
                              <Text type="secondary">
                                Bibit: {(kolam.budidaya.jumlahBibit || kolam.budidaya.jumlah_bibit || 0).toLocaleString("id-ID")} ekor
                              </Text>
                              {displayStatus === "siap_panen" && (
                                <Tag color="green" style={{ fontSize: "10px", margin: 0 }}>
                                  Panen
                                </Tag>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })
        ) : (
          <Col xs={24}>
            <Card 
              variant="outlined" 
              style={{ 
                textAlign: "center", 
                padding: "40px 20px",
                backgroundColor: "#fafafa"
              }}
            >
              <ExclamationCircleOutlined style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }} />
              <Title level={4} style={{ color: "#bfbfbf" }}>
                Tidak ada data kolam
              </Title>
              <Text type="secondary">
                Belum ada kolam lele yang terdaftar. Tambahkan kolam baru untuk memulai.
              </Text>
            </Card>
          </Col>
        )}
      </Row>
    </List>
  );
};