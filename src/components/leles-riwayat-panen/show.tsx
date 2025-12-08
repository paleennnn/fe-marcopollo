"use client";

import { useShow, useApiUrl } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import {
  Card,
  Descriptions,
  Typography,
  Row,
  Col,
  Image,
  Tag,
  Statistic,
  Skeleton,
  Divider,
} from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const RiwayatPanenShow = () => {
  const apiUrl = useApiUrl();
  const { query } = useShow({ resource: "leles-riwayat-panen" });
  const { data, isLoading } = query;

  const record = data?.data?.data || data?.data;

  // ✅ Extract data
  const nomorKolam = record?.nomorKolam;
  const ukuran = record?.ukuran;
  const jumlahBibit = Number(record?.jumlahBibit) || 0;
  const tanggalMulai = record?.tanggalMulai;
  const jumlahPanen = Number(record?.jumlahPanen) || 0;
  const totalBerat = Number(record?.totalBeratKg) || 0;
  const tanggalPanen = record?.tanggalPanen;
  const image = record?.image;

  const hargaBeli = Number(record?.hargaBeliTotal) || 0;
  const omset = Number(record?.hargaJualTotal) || 0;
  const potongPakan = Number(record?.potongPakan) || 0;

  const modal = hargaBeli + potongPakan;
  const profit = omset - modal;
  const profitPercent = modal > 0 ? ((profit / modal) * 100).toFixed(2) : "0";

  if (isLoading) {
    return (
      <Show isLoading={true} title={<Title level={3}>Detail Riwayat Panen</Title>}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Show>
    );
  }

  if (!record) {
    return (
      <Show isLoading={false} title={<Title level={3}>Detail Riwayat Panen</Title>}>
        <Card>
          <Text type="danger">Data tidak ditemukan</Text>
        </Card>
      </Show>
    );
  }

  return (
    <Show isLoading={false} title={<Title level={3}>Detail Riwayat Panen Lele - Kolam {nomorKolam}</Title>}>
      <Row gutter={[24, 24]}>
        {/* ========== ROW 1: Kolam & Budidaya (Bersandingan) ========== */}
        <Col xs={24} sm={12}>
          <Card 
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🏊</span>
                <span>Informasi Kolam</span>
              </div>
            }
            variant="outlined"
            style={{ height: "100%" }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Nomor Kolam">
                <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
                  Kolam {nomorKolam}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ukuran">
                <Text>{ukuran}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} sm={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🌱</span>
                <span>Informasi Budidaya</span>
              </div>
            }
            variant="outlined"
            style={{ height: "100%" }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Bibit Awal">
                <Text strong>{jumlahBibit.toLocaleString("id-ID")} ekor</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Modal (Harga Beli)">
                <Text strong style={{ color: "#ff4d4f" }}>
                  Rp {hargaBeli.toLocaleString("id-ID")}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Mulai">
                <Text>{dayjs(tanggalMulai).format("DD MMMM YYYY")}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* ========== ROW 2: Informasi Panen ========== */}
        <Col xs={24}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🐟</span>
                <span>Informasi Panen</span>
              </div>
            }
            variant="outlined"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ padding: "12px", backgroundColor: "#f6f8fb", borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Jumlah Ekor Panen</Text>
                  <Title level={5} style={{ margin: "8px 0 0 0", color: "#1890ff" }}>
                    {jumlahPanen > 0 ? `${jumlahPanen.toLocaleString("id-ID")} ekor` : "-"}
                  </Title>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ padding: "12px", backgroundColor: "#f6f8fb", borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Total Berat</Text>
                  <Title level={5} style={{ margin: "8px 0 0 0", color: "#1890ff" }}>
                    {totalBerat.toLocaleString("id-ID")} kg
                  </Title>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ padding: "12px", backgroundColor: "#f6f8fb", borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Tanggal Panen</Text>
                  <Title level={5} style={{ margin: "8px 0 0 0", color: "#1890ff" }}>
                    {dayjs(tanggalPanen).format("DD MMM YYYY")}
                  </Title>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* ========== ROW 3: Analisis Keuangan ========== */}
        <Col xs={24}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>💰</span>
                <span>Analisis Keuangan</span>
              </div>
            }
            variant="outlined"
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {/* Omset Card */}
              <Col xs={24} sm={8}>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#e6f7ff",
                    border: "1px solid #91d5ff",
                    borderRadius: 8,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                    📊 Omset (Pendapatan)
                  </Text>
                  <Title level={4} style={{ margin: "8px 0 0 0", color: "#0050b3" }}>
                    Rp {omset.toLocaleString("id-ID")}
                  </Title>
                </div>
              </Col>

              {/* Modal Card */}
              <Col xs={24} sm={8}>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#fff1f0",
                    border: "1px solid #ffccc7",
                    borderRadius: 8,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                    💳 Modal (Biaya Total)
                  </Text>
                  <Title level={4} style={{ margin: "8px 0 0 0", color: "#cf1322" }}>
                    Rp {modal.toLocaleString("id-ID")}
                  </Title>
                  <Divider style={{ margin: "8px 0" }} />
                  <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                    Harga Beli: <strong>Rp {hargaBeli.toLocaleString("id-ID")}</strong>
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                    Potong Pakan: <strong>Rp {potongPakan.toLocaleString("id-ID")}</strong>
                  </Text>
                </div>
              </Col>

              {/* Profit Card */}
              <Col xs={24} sm={8}>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: profit >= 0 ? "#f6ffed" : "#fff1f0",
                    border: `1px solid ${profit >= 0 ? "#b7eb8f" : "#ffccc7"}`,
                    borderRadius: 8,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                    🎯 Profit Bersih
                  </Text>
                  <Title
                    level={4}
                    style={{
                      margin: "8px 0 0 0",
                      color: profit >= 0 ? "#274e0e" : "#cf1322",
                    }}
                  >
                    Rp {profit.toLocaleString("id-ID")}
                  </Title>
                  <Tag
                    color={profit >= 0 ? "green" : "red"}
                    style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}
                  >
                    {profit >= 0 ? "📈" : "📉"} {profitPercent}%
                  </Tag>
                </div>
              </Col>
            </Row>

            {/* Formula Explanation */}
            <Card
              type="inner"
              style={{
                backgroundColor: "#fafafa",
                border: "1px dashed #d9d9d9",
              }}
            >
              <Title level={5} style={{ marginTop: 0 }}>
                📐 Rumus Perhitungan
              </Title>
              <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.8 }}>
                <Text type="secondary">
                  <strong>Omset</strong> = Rp {omset.toLocaleString("id-ID")}
                </Text>
                <br />
                <Text type="secondary">
                  <strong>Modal</strong> = Rp {hargaBeli.toLocaleString("id-ID")} + Rp{" "}
                  {potongPakan.toLocaleString("id-ID")} = Rp {modal.toLocaleString("id-ID")}
                </Text>
                <br />
                <Divider style={{ margin: "8px 0" }} />
                <Text strong style={{ color: profit >= 0 ? "#274e0e" : "#cf1322", fontSize: 13 }}>
                  Profit = Omset - Modal = Rp {profit.toLocaleString("id-ID")}
                </Text>
              </div>
            </Card>
          </Card>
        </Col>

        {/* ========== ROW 4: Foto Panen (Jika Ada) ========== */}
        {image && (
          <Col xs={24}>
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📸</span>
                  <span>Foto Hasil Panen</span>
                </div>
              }
              variant="outlined"
            >
              <div style={{ textAlign: "center" }}>
                <Image
                  src={`${apiUrl}/storage/uploads/${image}`}
                  alt="Hasil Panen"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 500,
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                  preview={{
                    mask: "Preview",
                    transitionName: "zoom",
                  }}
                />
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </Show>
  );
};