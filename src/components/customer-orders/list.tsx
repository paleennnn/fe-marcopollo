"use client";

import { useState } from "react";
import { List, useTable, ShowButton } from "@refinedev/antd";
import {
  Table,
  Space,
  Tag,
  Typography,
  Button,
  Modal,
  Image,
  Upload,
  Card,
  Progress,
  Alert,
} from "antd";
import { CreditCardOutlined, UploadOutlined } from "@ant-design/icons";
import { useApiUrl, useCustomMutation, useInvalidate } from "@refinedev/core";
import { useNotification } from "@refinedev/core";
import dayjs from "dayjs";
import Tesseract from "tesseract.js";
import type { UploadFile } from "antd";

const { Text, Title } = Typography;

export default function CustomerOrdersList() {
  const apiUrl = useApiUrl();
  const { open } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  // ✅ OCR states
  const [isValidating, setIsValidating] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    foundKeywords: string[];
    confidence: number;
    message: string;
  } | null>(null);

  const REQUIRED_KEYWORDS = [
    "berhasil",
    "selesai",
    "sukses",
    "success",
    "febyan valentino",
    "febyan",
    "valentino",
    "transfer",
    "pembayaran",
  ];

  const { tableProps } = useTable({
    resource: "customer/orders",
    syncWithLocation: true,
    queryOptions: { refetchOnWindowFocus: true },
  });

  const { mutate: uploadBukti } = useCustomMutation();
  const invalidate = useInvalidate();

  // 🔹 Helper untuk warna status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "selesai":
        return "green";
      case "menunggu_verifikasi":
        return "orange";
      case "ditolak":
        return "red";
      default:
        return "blue";
    }
  };

  const getStatusLabel = (
    status: string,
    metodePembayaran: string,
    buktiPembayaran: string | null
  ) => {
    if (metodePembayaran === "qris" && !buktiPembayaran) return "Belum Bayar";
    switch (status) {
      case "selesai":
        return "Selesai";
      case "menunggu_verifikasi":
        return "Menunggu Verifikasi";
      case "ditolak":
        return "Ditolak";
      default:
        return status;
    }
  };

  const handleBayar = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  /**
   * ✅ OCR Validation Function
   */
  const validatePaymentProof = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      setIsValidating(true);
      setOcrProgress(0);
      setValidationResult(null);

      const imageUrl = URL.createObjectURL(file);

      Tesseract.recognize(imageUrl, "ind+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      })
        .then(({ data: { text, confidence } }) => {
          const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
          const foundKeywords = REQUIRED_KEYWORDS.filter((kw) =>
            normalized.includes(kw.toLowerCase())
          );
          const hasNumbers = /\d{3,}/.test(normalized);

          const isValid =
            (foundKeywords.length >= 1 || hasNumbers) && confidence > 30;

          let message = "";
          if (!isValid) {
            if (confidence <= 30)
              message =
                "Gambar tidak jelas, akan diperiksa manual oleh admin.";
            else if (foundKeywords.length === 0 && !hasNumbers)
              message =
                "Tidak ditemukan kata kunci pembayaran valid (Berhasil, Transfer, Febyan, atau nominal).";
          } else {
            message = `Bukti pembayaran valid. Ditemukan: ${foundKeywords.join(", ")}${hasNumbers ? ", nominal transfer" : ""}`;
          }

          setValidationResult({
            isValid: isValid || confidence <= 30,
            foundKeywords,
            confidence,
            message,
          });

          setIsValidating(false);
          URL.revokeObjectURL(imageUrl);

          if (confidence <= 30) {
            Modal.warning({
              title: "Gambar Kurang Jelas",
              content:
                "OCR tidak bisa membaca dengan baik. Upload tetap dilanjutkan, admin akan cek manual.",
              okText: "Lanjutkan Upload",
              onOk: () => resolve(true),
            });
            return;
          }

          if (!isValid) {
            Modal.error({
              title: "Bukti Tidak Valid",
              content: message,
              okText: "Mengerti",
            });
            resolve(false);
            return;
          }

          resolve(true);
        })
        .catch(() => {
          setIsValidating(false);
          Modal.warning({
            title: "Gagal Membaca Gambar",
            content:
              "Tidak dapat melakukan validasi otomatis. Upload akan diteruskan untuk dicek manual.",
            okText: "Lanjutkan Upload",
            onOk: () => resolve(true),
          });
        });
    });
  };

  /**
   * ✅ Handle File Change with OCR validation
   */
  const handleFileChange = async ({ fileList: newList }: any) => {
    if (newList.length === 0) {
      setFileList([]);
      setValidationResult(null);
      return;
    }

    const file = newList[0].originFileObj as File;
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      open?.({
        type: "error",
        message: "Format Tidak Valid",
        description: "Hanya JPG, JPEG, dan PNG diperbolehkan.",
      });
      return;
    }

    setFileList(newList);
    const isValid = await validatePaymentProof(file);

    if (!isValid) {
      setFileList([]);
      setValidationResult(null);
    }
  };

  const handleUploadBukti = () => {
    if (fileList.length === 0) {
      open?.({
        type: "error",
        message: "Peringatan",
        description: "Pilih file bukti pembayaran terlebih dahulu",
      });
      return;
    }

    // 🚫 Stop jika OCR tidak valid
    if (validationResult && !validationResult.isValid) {
      Modal.error({
        title: "Bukti Tidak Valid",
        content: validationResult.message,
        okText: "Mengerti",
      });
      return;
    }

    const formData = new FormData();
    formData.append("bukti_pembayaran", fileList[0].originFileObj as Blob);

    setUploadLoading(true);
    uploadBukti(
      {
        url: `${apiUrl}/customer/orders/${selectedOrder.idOrder}/upload-bukti`,
        method: "post",
        values: formData,
        config: { headers: { "Content-Type": "multipart/form-data" } },
      },
      {
        onSuccess: () => {
          setUploadLoading(false);
          setIsModalOpen(false);
          setFileList([]);
          setValidationResult(null);
          setSelectedOrder(null);
          invalidate({ resource: "customer/orders", invalidates: ["list"] });

          open?.({
            type: "success",
            message: "Berhasil",
            description:
              "Bukti pembayaran berhasil diupload. Tunggu konfirmasi admin.",
          });
        },
        onError: (error) => {
          setUploadLoading(false);
          open?.({
            type: "error",
            message: "Gagal",
            description: error?.message || "Upload gagal",
          });
        },
      }
    );
  };

  const apiData = (tableProps.dataSource as any)?.data || [];
  const safeTableProps = {
    ...tableProps,
    dataSource: Array.isArray(apiData)
      ? apiData.map((item: any) => ({
          idOrder: item.idOrder,
          nomorOrder: item.nomorOrder,
          tanggalOrder: item.tanggalOrder,
          totalHarga: item.totalHarga,
          metodePembayaran: item.metodePembayaran,
          statusPembayaran: item.statusPembayaran,
          buktiPembayaran: item.buktiPembayaran,
          orderDetails: item.orderDetails,
        }))
      : [],
  };

  return (
    <>
      <List>
        <Table {...safeTableProps} rowKey="idOrder">
          <Table.Column
            dataIndex="nomorOrder"
            title="Nomor Order"
            sorter
            render={(v) => <Text strong>{v}</Text>}
          />
          <Table.Column
            dataIndex="tanggalOrder"
            title="Tanggal Order"
            sorter
            render={(v) => dayjs(v).format("DD MMM YYYY HH:mm")}
          />
          <Table.Column
            dataIndex="totalHarga"
            title="Total"
            align="right"
            render={(v) =>
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(parseFloat(v))
            }
          />
          <Table.Column
            dataIndex="metodePembayaran"
            title="Metode"
            render={(v) => <Tag color="blue">{v?.toUpperCase()}</Tag>}
          />
          <Table.Column
            title="Status"
            render={(_, record: any) => {
              const status = getStatusLabel(
                record.statusPembayaran,
                record.metodePembayaran,
                record.buktiPembayaran
              );
              const color =
                record.metodePembayaran === "qris" && !record.buktiPembayaran
                  ? "red"
                  : getStatusColor(record.statusPembayaran);
              return <Tag color={color}>{status}</Tag>;
            }}
          />
          <Table.Column
            dataIndex="orderDetails"
            title="Item"
            render={(details: any[]) => (
              <Text type="secondary">{details?.length || 0} item</Text>
            )}
          />
          <Table.Column
            title="Aksi"
            render={(_, record: any) => (
              <Space>
                <ShowButton hideText size="small" recordItemId={record.idOrder} />
                {record.metodePembayaran === "qris" &&
                  !record.buktiPembayaran && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<CreditCardOutlined />}
                      onClick={() => handleBayar(record)}
                    >
                      Bayar
                    </Button>
                  )}
              </Space>
            )}
          />
        </Table>
      </List>

      {/* Modal Upload Bukti + OCR */}
      <Modal
  title={<Title level={4}>Upload Bukti Pembayaran</Title>}
  open={isModalOpen}
  onCancel={() => {
    setIsModalOpen(false);
    setFileList([]);
    setValidationResult(null);
  }}
  footer={null}
  width={900}
>
  {selectedOrder && (
    <>
      {/* 🔹 Ringkasan Order */}
      <Card
        size="small"
        style={{ marginBottom: 24, background: "#fafafa" }}
        title={`Detail Order - ${selectedOrder.nomorOrder}`}
      >
        <p>
          <Text strong>Tanggal:</Text>{" "}
          {dayjs(selectedOrder.tanggalOrder).format("DD MMM YYYY HH:mm")}
        </p>
        <p>
          <Text strong>Metode Pembayaran:</Text>{" "}
          {selectedOrder.metodePembayaran?.toUpperCase()}
        </p>
        <p>
          <Text strong>Total:</Text>{" "}
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(selectedOrder.totalHarga)}
        </p>

        <Table
          dataSource={selectedOrder.orderDetails || []}
          size="small"
          pagination={false}
          rowKey={(item) => item.id}
          style={{ marginTop: 16 }}
        >
          <Table.Column
            title="produk"
            dataIndex={["namaProduk"]}
            render={(v: string) => v || "-"}
          />
          <Table.Column
            title="Jumlah"
            dataIndex="jumlah"
            align="center"
            render={(v: number) => v || 0}
          />
          <Table.Column
            title="Harga Satuan"
            dataIndex={["hargaSatuan"]}
            align="right"
            render={(v: number) =>
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(v)
            }
          />
          <Table.Column
            title="Subtotal"
            dataIndex="subtotal"
            align="right"
            render={(v: number) =>
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(v)
            }
          />
        </Table>
      </Card>
    </>
  )}

  <div style={{ display: "flex", gap: 24 }}>
    {/* QRIS Side */}
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        padding: 24,
      }}
    >
      <Text strong style={{ marginBottom: 12 }}>
        Scan QRIS untuk Pembayaran
      </Text>
      <Image
        src="/images/qris.png"
        alt="QRIS"
        width={220}
        height={220}
        style={{ objectFit: "contain" }}
        preview={false}
      />
      <Text type="secondary" style={{ marginTop: 12, textAlign: "center" }}>
        Gunakan aplikasi pembayaran Anda untuk scan kode QR di atas.
      </Text>
    </div>

    {/* Upload + OCR Validation Side */}
    <div style={{ flex: 1 }}>
      <Alert
        type="info"
        showIcon
        message="Validasi Otomatis"
        description="Gambar bukti akan diperiksa otomatis (kata kunci: Berhasil, Transfer, Febyan, dll). Pastikan gambar jelas."
        style={{ marginBottom: 16 }}
      />
      <Upload
        listType="picture-card"
        fileList={fileList}
        beforeUpload={() => false}
        onChange={handleFileChange}
        maxCount={1}
        accept="image/*"
        disabled={isValidating}
      >
        {fileList.length < 1 && !isValidating && (
          <div>
            <UploadOutlined />
            <div style={{ marginTop: 8 }}>Upload Bukti</div>
          </div>
        )}
      </Upload>

      {isValidating && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>Memvalidasi bukti pembayaran...</Text>
          <Progress percent={ocrProgress} status="active" />
        </div>
      )}

      {validationResult && !isValidating && (
        <Alert
          showIcon
          type={validationResult.isValid ? "success" : "error"}
          message={
            validationResult.isValid
              ? "Bukti Pembayaran Valid"
              : "Bukti Tidak Valid"
          }
          description={
            <>
              <p>{validationResult.message}</p>
              {validationResult.foundKeywords.length > 0 && (
                <p>
                  <strong>Kata kunci:</strong>{" "}
                  {validationResult.foundKeywords.join(", ")}
                </p>
              )}
              <p style={{ fontSize: 12, color: "#666" }}>
                Confidence: {validationResult.confidence.toFixed(2)}%
              </p>
            </>
          }
        />
      )}

      <div style={{ textAlign: "right", marginTop: 24 }}>
        <Button
          onClick={() => {
            setIsModalOpen(false);
            setFileList([]);
            setValidationResult(null);
          }}
          style={{ marginRight: 8 }}
          disabled={isValidating || uploadLoading}
        >
          Batal
        </Button>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={handleUploadBukti}
          loading={uploadLoading}
          disabled={
            fileList.length === 0 ||
            isValidating ||
            Boolean(validationResult && !validationResult.isValid)
          }
        >
          Upload
        </Button>
      </div>
    </div>
  </div>
</Modal>

    </>
  );
}
