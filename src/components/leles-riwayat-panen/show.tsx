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
  Alert,
  Skeleton,
} from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const RiwayatPanenShow = () => {
  const apiUrl = useApiUrl();
  const { query } = useShow({ resource: "leles-riwayat-panen" });
  const { data, isLoading } = query;

  const record = data?.data?.data || data?.data;

  if (!record && !isLoading) {
    return (
      <Show isLoading={false} title={<Title level={3}>Detail Riwayat Panen</Title>}>
        <Alert message="Error" description="Data riwayat panen tidak ditemukan" type="error" showIcon />
      </Show>
    );
  }

  if (isLoading) {
    return (
      <Show isLoading={true} title={<Title level={3}>Detail Riwayat Panen</Title>}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Show>
    );
  }

  const nomorKolam = record?.nomor_kolam || record?.nomorKolam;
  const ukuran = record?.ukuran;
  const jumlahBibit = Number(record?.jumlah_bibit || record?.jumlahBibit) || 0;
  const hargaBeli = Number(record?.harga_beli_total || record?.hargaBeliTotal) || 0;
  const tanggalMulai = record?.tanggal_mulai || record?.tanggalMulai;
  const jumlahPanen = Number(record?.jumlah_panen || record?.jumlahPanen) || 0;
  const totalBerat = Number(record?.total_berat_kg || record?.totalBeratKg) || 0;
  const hargaJual = Number(record?.harga_jual_total || record?.hargaJualTotal) || 0;
  const profit = Number(record?.profit) || 0;
  const tanggalPanen = record?.tanggal_panen || record?.tanggalPanen;
  const image = record?.image;

  const profitPercent = hargaBeli > 0 ? ((profit / hargaBeli) * 100).toFixed(2) : "0";
  const survivalRate = jumlahBibit > 0 ? ((jumlahPanen / jumlahBibit) * 100).toFixed(2) : "0";
  const avgBerat = jumlahPanen > 0 ? (totalBerat / jumlahPanen).toFixed(3) : "0";

  return (
    <Show isLoading={isLoading} title={<Title level={3}>Detail Riwayat Panen</Title>}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Informasi Kolam" variant="outlined" style={{ height: "100%" }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Nomor Kolam">
                <Text strong>Kolam {nomorKolam}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ukuran Kolam">
                {ukuran}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Informasi Budidaya" variant="outlined" style={{ height: "100%" }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Jumlah Bibit Awal">
                {jumlahBibit.toLocaleString("id-ID")} ekor
              </Descriptions.Item>
              <Descriptions.Item label="Harga Beli Total">
                Rp {hargaBeli.toLocaleString("id-ID")}
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Mulai">
                {dayjs(tanggalMulai).format("DD MMMM YYYY")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Informasi Panen" variant="outlined">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Jumlah Ekor Panen" span={1}>
                {jumlahPanen.toLocaleString("id-ID")} ekor
              </Descriptions.Item>
              <Descriptions.Item label="Survival Rate" span={1}>
                {survivalRate}%
              </Descriptions.Item>
              <Descriptions.Item label="Total Berat" span={1}>
                {totalBerat.toLocaleString("id-ID")} kg
              </Descriptions.Item>
              <Descriptions.Item label="Rata-rata Berat/Ekor" span={1}>
                {avgBerat} kg
              </Descriptions.Item>
              <Descriptions.Item label="Harga Jual Total" span={1}>
                <Text strong style={{ color: "#1890ff" }}>
                  Rp {hargaJual.toLocaleString("id-ID")}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Panen" span={1}>
                {dayjs(tanggalPanen).format("DD MMMM YYYY")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Analisis Keuntungan" variant="outlined">
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Modal"
                  value={hargaBeli}
                  precision={0}
                  prefix="Rp"
                  valueStyle={{ color: "#ff4d4f" }}
                  formatter={(value) => `${Number(value || 0).toLocaleString("id-ID")}`}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Omset"
                  value={hargaJual}
                  precision={0}
                  prefix="Rp"
                  valueStyle={{ color: "#1890ff" }}
                  formatter={(value) => `${Number(value || 0).toLocaleString("id-ID")}`}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Profit"
                  value={profit}
                  precision={0}
                  prefix="Rp"
                  suffix={<Tag color={profit >= 0 ? "green" : "red"}>{profitPercent}%</Tag>}
                  valueStyle={{ color: profit >= 0 ? "#52c41a" : "#ff4d4f" }}
                  formatter={(value) => `${Number(value || 0).toLocaleString("id-ID")}`}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {image && (
          <Col xs={24}>
            <Card title="Foto Hasil Panen" variant="outlined">
              <div style={{ textAlign: "center" }}>
                <Image
                  src={`${apiUrl}/storage/uploads/${image}`}
                  alt="Hasil Panen"
                  style={{ maxWidth: "100%", maxHeight: 500, borderRadius: 8 }}
                  preview={{ mask: "Preview" }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6ZAAABRklEQVR4nO3BMQEAAADCoPVPbQhfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4NehrGQFIYXoZAAAAAElFTkSuQmCC"
                />
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </Show>
  );
};