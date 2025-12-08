"use client";

import { useGo, useCustom, useCustomMutation, useInvalidate, useApiUrl } from "@refinedev/core";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Upload,
  Skeleton,
  Empty,
  Alert,
  Progress,
  Divider,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useParams } from "next/navigation";

dayjs.extend(duration);

const { Title, Text } = Typography;

type StatusType = "kosong" | "sedang_budidaya" | "siap_panen";

const getDisplayStatus = (kolam: any): StatusType => {
  if (kolam.status === "kosong") return "kosong";
  if (kolam.budidaya && kolam.hari_ke >= 90) return "siap_panen";
  if (kolam.budidaya && kolam.hari_ke < 90) return "sedang_budidaya";
  return "kosong";
};

const getStatusConfig = (status: StatusType) => {
  const configs = {
    kosong: { color: "#d9d9d9", icon: <ExclamationCircleOutlined /> },
    sedang_budidaya: { color: "#faad14", icon: <ClockCircleOutlined /> },
    siap_panen: { color: "#52c41a", icon: <CheckCircleOutlined /> },
  };
  return configs[status];
};

const getStatusLabel = (status: StatusType): string => {
  const labels = { kosong: "Kosong", sedang_budidaya: "Sedang Budidaya", siap_panen: "Siap Panen" };
  return labels[status];
};

export const LeleShow = () => {
  const params = useParams();
  const go = useGo();
  const apiUrl = useApiUrl();
  const invalidate = useInvalidate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const kolamId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id || (Array.isArray(params?.[0]) ? params[0][0] : params?.[0]);

  const { data: kolamData, isLoading: isLoadingKolam } = useCustom({
    url: `${apiUrl}/leles/${kolamId}`,
    method: "get",
    config: { query: {} },
  });

  const kolam = kolamData?.data?.data;
  const { mutate: handlePanen, isLoading: isSubmitting } = useCustomMutation();

  if (!kolamId) {
    return (
      <Card variant="outlined">
        <Alert message="Error" description="Kolam ID tidak ditemukan" type="error" showIcon />
      </Card>
    );
  }

  if (isLoadingKolam) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (!kolam) {
    return (
      <Card variant="outlined">
        <Empty description="Kolam tidak ditemukan" />
      </Card>
    );
  }

  const displayStatus = getDisplayStatus(kolam);
  const hariKe = kolam.hari_ke || 0;
  const siapPanen = displayStatus === "siap_panen" || hariKe >= 90;
  const progressPercent = Math.min((hariKe / 90) * 100, 100);
  const statusConfig = getStatusConfig(displayStatus);

  const handlePanenClick = () => {
    if (hariKe < 90) {
      message.warning(`Umur lele baru ${hariKe} hari. Belum siap panen.`);
      return;
    }
    setIsModalVisible(true);
  };

  const onSubmitPanen = async (values: any) => {
    try {
      const formData = new FormData();
      // ✅ REMOVE: jumlah_panen
      formData.append("total_berat_kg", values.total_berat_kg);
      formData.append("harga_jual_total", values.harga_jual_total);
      formData.append("potong_pakan", values.potong_pakan); // ✅ ADD
      formData.append("tanggal_panen", dayjs(values.tanggal_panen).format("YYYY-MM-DD"));

      if (values.image?.[0]) {
        formData.append("image", values.image[0].originFileObj);
      }

      handlePanen(
        {
          url: `${apiUrl}/leles/${kolamId}/panen`,
          method: "post",
          values: formData,
          config: { headers: { "Content-Type": "multipart/form-data" } },
        },
        {
          onSuccess: () => {
            message.success("Panen berhasil!");
            setIsModalVisible(false);
            form.resetFields();
            invalidate({ resource: "leles", invalidates: ["list", "detail"] });
            go({ to: "/leles-riwayat-panen" });
          },
          onError: (error: any) => {
            message.error(error?.response?.data?.message || "Gagal panen");
          },
        }
      );
    } catch (error) {
      message.error("Error submit panen");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col span={24}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => go({ to: "/leles" })}>
            Kembali ke Daftar Kolam
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }} variant="outlined">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title="Nomor Kolam" value={kolam.nomor_kolam} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title="Ukuran" value={kolam.ukuran} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Kapasitas Max"
              value={kolam.kapasitas_max}
              suffix="ekor"
              formatter={(value: any) => `${(value as number).toLocaleString("id-ID")}`}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ paddingTop: "8px" }}>
              <Text type="secondary" style={{ display: "block", marginBottom: "8px" }}>
                Status
              </Text>
              <Tag color={statusConfig.color} icon={statusConfig.icon}>
                {getStatusLabel(displayStatus)}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {kolam.budidaya && (
        <Card title={<Title level={4}>📊 Informasi Budidaya</Title>} style={{ marginBottom: 24 }} variant="outlined">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title="Hari Ke" value={`${hariKe} / 90`} valueStyle={{ fontSize: 24 }} />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Jumlah Bibit"
                value={kolam.budidaya.jumlahBibit}
                suffix="ekor"
                formatter={(value: any) => `${(value as number).toLocaleString("id-ID")}`}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Harga Beli Total"
                value={kolam.budidaya.hargaBeliTotal}
                prefix="Rp "
                formatter={(value: any) => `${(value as number).toLocaleString("id-ID")}`}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title="Tanggal Mulai" value={dayjs(kolam.budidaya.tanggalMulai).format("DD MMM YYYY")} />
            </Col>
          </Row>

          <Divider />
          <div style={{ marginTop: 24 }}>
            <Text strong>Progress Budidaya:</Text>
            <Progress
              percent={progressPercent}
              status={siapPanen ? "success" : "active"}
              strokeColor={siapPanen ? "#52c41a" : "#faad14"}
            />
            <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
              {siapPanen ? "✅ Siap untuk dipanen" : `⏳ Tinggal ${90 - hariKe} hari lagi`}
            </Text>
          </div>

          <Divider />
          <Space>
            <Button
              type={siapPanen ? "primary" : "default"}
              danger={siapPanen}
              disabled={!siapPanen}
              onClick={handlePanenClick}
              loading={isSubmitting}
            >
              {siapPanen ? "🎣 PANEN" : "⏳ Belum Siap Panen"}
            </Button>
            <Button onClick={() => go({ to: `/leles/edit/${kolamId}` })}>✏️ Edit Budidaya</Button>
          </Space>
        </Card>
      )}

      {kolam.status === "kosong" && (
        <Card style={{ marginBottom: 24 }} variant="outlined">
          <Empty description="Kolam kosong">
            <Button type="primary" onClick={() => go({ to: `/leles/start-budidaya/${kolamId}` })}>
              Mulai Budidaya Baru
            </Button>
          </Empty>
        </Card>
      )}

      <Modal title="Form Panen Lele" open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null} width={700}>
        <Form form={form} layout="vertical" onFinish={onSubmitPanen} style={{ marginTop: 24 }}>
          {/* ✅ REMOVE: Jumlah Panen field */}

          <Form.Item
            name="total_berat_kg"
            label="Total Berat (kg)"
            rules={[
              { required: true, message: "Masukkan total berat" },
              { pattern: /^[0-9.]+$/, message: "Hanya boleh angka dan titik" },
            ]}
          >
            <Input type="number" placeholder="Contoh: 1500" min="0" step="0.1" />
          </Form.Item>

          <Form.Item
            name="harga_jual_total"
            label="Harga Jual Total (Rp)"
            rules={[
              { required: true, message: "Masukkan harga jual" },
              { pattern: /^[0-9]+$/, message: "Hanya boleh angka" },
            ]}
          >
            <Input type="number" placeholder="Contoh: 2300000" min="0" />
          </Form.Item>

          {/* ✅ ADD: Potong Pakan field */}
          <Form.Item
            name="potong_pakan"
            label="Potong Pakan (Rp)"
            rules={[
              { required: true, message: "Masukkan potong pakan" },
              { pattern: /^[0-9]+$/, message: "Hanya boleh angka" },
            ]}
          >
            <Input type="number" placeholder="Contoh: 300000" min="0" />
          </Form.Item>

          <Form.Item
            name="tanggal_panen"
            label="Tanggal Panen"
            rules={[{ required: true, message: "Pilih tanggal panen" }]}
          >
            <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="image"
            label="Foto Hasil Panen (optional)"
            valuePropName="fileList"
            getValueFromEvent={(e) => e?.fileList}
          >
            <Upload maxCount={1} accept="image/*">
              <Button>Upload Foto</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSubmitting} block>
              Submit Panen
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};