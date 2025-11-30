"use client";

import { useList, useGo } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Card, Row, Col, Typography, Tag, Space, Statistic, Skeleton } from "antd";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

type StatusType = "kosong" | "sedang_budidaya" | "siap_panen";

export const LeleList = () => {
  const go = useGo();
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
    // Jika kolam kosong, status kosong
    if (kolam.status === "kosong") {
      return "kosong";
    }

    // Jika ada budidaya dan sudah 90 hari atau lebih, siap panen
    if (kolam.budidaya && kolam.hari_ke >= 90) {
      return "siap_panen";
    }

    // Jika ada budidaya tapi belum 90 hari, sedang budidaya
    if (kolam.budidaya && kolam.hari_ke < 90) {
      return "sedang_budidaya";
    }

    // Default ke status dari BE
    return (kolam.status || "kosong") as StatusType;
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
        <Skeleton active paragraph={{ rows: 3 }} />
      </List>
    );
  }

  return (
    <List
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <AppstoreOutlined style={{ fontSize: 24, marginRight: 12 }} />
          <Text strong style={{ fontSize: 20 }}>
            Manajemen Kolam Lele ({kolams.length} Kolam)
          </Text>
        </div>
      }
      headerButtons={() => null}
    >
      <Row gutter={[16, 16]}>
        {kolams && kolams.length > 0 ? (
          kolams.map((kolam: any) => {
            // ✅ Get display status berdasarkan hari_ke
            const displayStatus = getDisplayStatus(kolam);

            return (
              <Col xs={24} sm={12} md={8} lg={6} xl={4} key={kolam.id_kolam}>
                <Card
                  hoverable
                  onClick={() => handleCardClick(kolam.id_kolam)}
                  variant="outlined"
                  style={{
                    borderLeft: `4px solid ${getStatusColor(displayStatus)}`,
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                  styles={{
                    body: { padding: "16px" },
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    {/* Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Title level={4} style={{ margin: 0 }}>
                        Kolam {kolam.nomor_kolam}
                      </Title>
                      <Tag
                        color={getStatusColor(displayStatus)}
                        icon={getStatusIcon(displayStatus)}
                      >
                        {getStatusLabel(displayStatus)}
                      </Tag>
                    </div>

                    {/* Info Kolam */}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {kolam.ukuran}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Max: {kolam.kapasitas_max?.toLocaleString("id-ID")} ekor
                    </Text>

                    {/* Info Budidaya */}
                    {kolam.budidaya && (
                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: "1px solid #f0f0f0",
                        }}
                      >
                        <Statistic
                          title="Hari Ke-"
                          value={kolam.hari_ke}
                          suffix="/ 90"
                          valueStyle={{ fontSize: 16 }}
                        />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Bibit: {kolam.budidaya.jumlah_bibit?.toLocaleString("id-ID")} ekor
                        </Text>
                      </div>
                    )}

                    {/* Kosong */}
                    {kolam.status === "kosong" && (
                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: "1px solid #f0f0f0",
                          textAlign: "center",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Kolam kosong, klik untuk isi
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })
        ) : (
          <Col xs={24}>
            <Card variant="outlined" style={{ textAlign: "center" }}>
              <Text type="secondary">Tidak ada data kolam lele</Text>
            </Card>
          </Col>
        )}
      </Row>
    </List>
  );
};