"use client";

import { useState } from "react";
import { List, useTable, DeleteButton } from "@refinedev/antd";
import {
  Table,
  Space,
  Typography,
  Button,
  Modal,
  Image,
  Upload,
  Radio,
  Progress,
  Alert,
  Card,
} from "antd";
import { ShoppingCartOutlined, UploadOutlined } from "@ant-design/icons";
import { useApiUrl, useCustomMutation, useInvalidate } from "@refinedev/core";
import { useNotification } from "@refinedev/core";
import type { UploadFile } from "antd";
import Tesseract from "tesseract.js";

const { Text, Title } = Typography;

export default function KeranjangListPage() {
  const apiUrl = useApiUrl();
  const { open } = useNotification();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [metodePembayaran, setMetodePembayaran] = useState("qris");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [isValidating, setIsValidating] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    foundKeywords: string[];
    confidence: number;
    message: string;
  } | null>(null);

  const { tableProps } = useTable({
    resource: "customer/keranjang",
    syncWithLocation: true,
  });

  const { mutate: createCheckout } = useCustomMutation();
  const { mutate: uploadBukti } = useCustomMutation();
  const invalidate = useInvalidate();

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

  const apiData = Array.isArray(tableProps.dataSource) ? tableProps.dataSource : [];
  const safeTableProps = {
    ...tableProps,
    dataSource: Array.isArray(apiData)
      ? apiData.map((item: any) => ({
          id: item.idKeranjang,
          product_name:
            item.tipeProduk === "material"
              ? item.material?.namaMaterial || "-"
              : item.kambing?.namaKambing || "-",
          product_type: item.tipeProduk,
          quantity: item.jumlah,
          price: item.hargaSatuan,
          image:
            item.tipeProduk === "material"
              ? item.material?.image
              : item.kambing?.image,
        }))
      : [],
  };

  const selectedItems = safeTableProps.dataSource.filter((item: any) =>
    selectedRowKeys.includes(item.id)
  );

  const totalAmount = selectedItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleBayar = () => {
    if (selectedRowKeys.length === 0) {
      open?.({
        type: "error",
        message: "Peringatan",
        description: "Pilih minimal satu item untuk dibayar",
      });
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const handleCheckout = () => {
    if (selectedRowKeys.length === 0) {
      open?.({
        type: "error",
        message: "Peringatan",
        description: "Pilih minimal satu item untuk dibayar",
      });
      return;
    }

    if (selectedRowKeys.length === safeTableProps.dataSource.length) {
      performCheckout();
      return;
    }

    Modal.confirm({
      title: "Konfirmasi Checkout",
      content: `Anda akan checkout ${selectedRowKeys.length} item dari ${safeTableProps.dataSource.length} item di keranjang. Item yang tidak dipilih akan tetap berada di keranjang. Lanjutkan?`,
      onOk: () => {
        performCheckout();
      },
    });
  };

  const performCheckout = () => {
    setCheckoutLoading(true);

    createCheckout(
      {
        url: `${apiUrl}/customer/checkout`,
        method: "post",
        values: {
          metode_pembayaran: metodePembayaran,
          keranjang_ids: selectedRowKeys,
        },
      },
      {
        onSuccess: (data: any) => {
          setCheckoutLoading(false);
          setIsCheckoutModalOpen(false);

          if (metodePembayaran === "tunai") {
            setSelectedRowKeys([]);
            invalidate({
              resource: "customer/keranjang",
              invalidates: ["list"],
            });
            open?.({
              type: "success",
              message: "Berhasil",
              description: "Checkout berhasil. Pesanan Anda akan diproses.",
            });
            return;
          }

          const newOrderId =
            data?.data?.data?.order?.idOrder ||
            data?.data?.order?.idOrder ||
            data?.order?.idOrder ||
            data?.data?.idOrder ||
            data?.idOrder ||
            data?.id ||
            null;
          setOrderId(newOrderId);
          setIsUploadModalOpen(true);

          open?.({
            type: "success",
            message: "Berhasil",
            description: "Checkout berhasil, silahkan upload bukti pembayaran",
          });
        },
        onError: (error: any) => {
          setCheckoutLoading(false);

          if (
            error?.statusCode === 409 ||
            error?.response?.data?.error === "KAMBING_ALREADY_BOOKED"
          ) {
            setIsCheckoutModalOpen(false);

            Modal.error({
              title: "Kambing Tidak Tersedia",
              content:
                error?.message ||
                error?.response?.data?.message ||
                "Beberapa kambing sudah di-checkout oleh user lain dan telah dihapus dari keranjang Anda.",
              okText: "Mengerti",
              onOk: () => {
                setSelectedRowKeys([]);
                invalidate({
                  resource: "customer/keranjang",
                  invalidates: ["list"],
                });
              },
            });

            return;
          }

          open?.({
            type: "error",
            message: "Gagal",
            description: error?.message || "Gagal melakukan checkout",
          });
        },
      }
    );
  };

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
          console.log("OCR Result:", text);
          console.log("OCR Confidence:", confidence);

          const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

          const foundKeywords = REQUIRED_KEYWORDS.filter((keyword) =>
            normalizedText.includes(keyword.toLowerCase())
          );

          const hasNumbers = /\d{3,}/.test(normalizedText);

          console.log("Found Keywords:", foundKeywords);
          console.log("Has Numbers:", hasNumbers);

          const minKeywords = 1;
          const isValid =
            (foundKeywords.length >= minKeywords || hasNumbers) &&
            confidence > 30;

          let message = "";
          if (!isValid) {
            if (confidence <= 30) {
              message =
                "Gambar tidak jelas atau tidak bisa dibaca. Silakan admin akan mengecek manual.";
            } else if (foundKeywords.length === 0 && !hasNumbers) {
              message =
                "Bukti pembayaran tidak valid. Tidak ditemukan kata kunci yang sesuai (Berhasil, Selesai, Transfer, Febyan Valentino, atau nominal).";
            }
          } else {
            message = `Bukti pembayaran valid! Ditemukan: ${foundKeywords.join(", ")}${hasNumbers ? ", nominal transfer" : ""}`;
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
                "Gambar bukti pembayaran tidak bisa dibaca dengan jelas. Upload akan tetap dilanjutkan dan akan dicek manual oleh admin.",
              okText: "Lanjutkan Upload",
              onOk: () => resolve(true),
            });
            return;
          }

          if (!isValid) {
            Modal.error({
              title: "Bukti Pembayaran Tidak Valid",
              content: message,
              okText: "Mengerti",
            });
            resolve(false);
            return;
          }

          resolve(true);
        })
        .catch((error) => {
          console.error("OCR Error:", error);
          setIsValidating(false);

          Modal.warning({
            title: "Gagal Memvalidasi Gambar",
            content:
              "Tidak dapat memvalidasi bukti pembayaran. Upload akan tetap dilanjutkan dan akan dicek manual oleh admin.",
            okText: "Lanjutkan Upload",
            onOk: () => resolve(true),
          });
        });
    });
  };

  const handleFileChange = async ({ fileList: newFileList }: any) => {
    if (newFileList.length === 0) {
      setFileList([]);
      setValidationResult(null);
      return;
    }

    const file = newFileList[0].originFileObj as File;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      open?.({
        type: "error",
        message: "Format File Tidak Valid",
        description: "Hanya file JPG, JPEG, dan PNG yang diperbolehkan",
      });
      return;
    }

    setFileList(newFileList);

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

    if (!orderId) {
      open?.({
        type: "error",
        message: "Error",
        description: "ID Order tidak ditemukan. Silakan coba checkout ulang.",
      });
      return;
    }

    if (validationResult && !validationResult.isValid) {
      Modal.error({
        title: "Bukti Pembayaran Tidak Valid",
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
        url: `${apiUrl}/customer/orders/${orderId}/upload-bukti`,
        method: "post",
        values: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      },
      {
        onSuccess: () => {
          setUploadLoading(false);
          setIsUploadModalOpen(false);
          setFileList([]);
          setValidationResult(null);
          setSelectedRowKeys([]);
          invalidate({
            resource: "customer/keranjang",
            invalidates: ["list"],
          });

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
            description: error?.message || "Gagal mengupload bukti pembayaran",
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      open?.({
        type: "error",
        message: "Peringatan",
        description: "Pilih minimal satu item untuk dihapus",
      });
      return;
    }

    Modal.confirm({
      title: "Konfirmasi Hapus",
      content: `Anda yakin ingin menghapus ${selectedRowKeys.length} item dari keranjang?`,
      okText: "Ya, Hapus",
      cancelText: "Batal",
      okButtonProps: {
        danger: true,
        type: "primary",
      },
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map((id) =>
              fetch(`${apiUrl}/customer/keranjang/${id}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              })
            )
          );

          open?.({
            type: "success",
            message: "Berhasil",
            description: "Item yang dipilih berhasil dihapus dari keranjang",
          });

          setSelectedRowKeys([]);
          invalidate({
            resource: "customer/keranjang",
            invalidates: ["list"],
          });
        } catch (error) {
          open?.({
            type: "error",
            message: "Gagal",
            description: "Terjadi kesalahan saat menghapus item",
          });
        }
      },
    });
  };

  return (
    <List>
      {safeTableProps.dataSource.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <ShoppingCartOutlined style={{ fontSize: 48, color: "#ccc" }} />
          <Text style={{ display: "block", marginTop: 16 }}>
            Keranjang Anda Kosong
          </Text>
        </div>
      ) : (
        <>
          <Table
            {...safeTableProps}
            rowKey="id"
            rowSelection={rowSelection}
            footer={() => (
              <div style={{ textAlign: "right" }}>
                <Text strong style={{ fontSize: 16, marginRight: 16 }}>
                  Total: Rp {totalAmount.toLocaleString("id-ID")}
                </Text>
              </div>
            )}
          >
            <Table.Column dataIndex="product_name" title="Nama Produk" />
            <Table.Column
              dataIndex="product_type"
              title="Tipe"
              render={(value: string) => (
                <Text style={{ textTransform: "capitalize" }}>{value}</Text>
              )}
            />
            <Table.Column
              title="Harga Satuan"
              render={(_, record: any) => (
                <Text>Rp {record.price.toLocaleString("id-ID")}</Text>
              )}
            />
            <Table.Column dataIndex="quantity" title="Jumlah" />
            <Table.Column
              title="Subtotal Produk"
              render={(_, record: any) => (
                <Text strong>
                  Rp {(record.price * record.quantity).toLocaleString("id-ID")}
                </Text>
              )}
            />
            <Table.Column
              title="Aksi"
              dataIndex="actions"
              render={(_, record: any) => (
                <Space>
                  <DeleteButton
                    hideText
                    size="small"
                    recordItemId={record.id}
                    onSuccess={() =>
                      invalidate({
                        resource: "customer/keranjang",
                        invalidates: ["list"],
                      })
                    }
                  />
                </Space>
              )}
            />
          </Table>

          <div
            style={{
              marginTop: 16,
              textAlign: "right",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <Button
              danger
              size="large"
              onClick={handleDelete}
              disabled={selectedRowKeys.length === 0}
            >
              Hapus ({selectedRowKeys.length} item)
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={handleBayar}
              disabled={selectedRowKeys.length === 0}
            >
              Bayar ({selectedRowKeys.length} item)
            </Button>
          </div>
        </>
      )}

      {/* Modal Checkout */}
      <Modal
        title={<Title level={4}>Checkout</Title>}
        open={isCheckoutModalOpen}
        onCancel={() => setIsCheckoutModalOpen(false)}
        footer={null}
        width={650}
      >
        <div style={{ marginBottom: 24 }}>
          <Table
            dataSource={selectedItems}
            rowKey="id"
            pagination={false}
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Table.Column dataIndex="product_name" title="Nama Produk" />
            <Table.Column
              title="Harga Satuan"
              render={(_, record: any) => (
                <Text>Rp {record.price.toLocaleString("id-ID")}</Text>
              )}
            />
            <Table.Column dataIndex="quantity" title="Jumlah" />
            <Table.Column
              title="Subtotal Produk"
              render={(_, record: any) => (
                <Text>
                  Rp {(record.price * record.quantity).toLocaleString("id-ID")}
                </Text>
              )}
            />
          </Table>

          <div
            style={{
              textAlign: "right",
              borderTop: "2px solid #f0f0f0",
              paddingTop: 16,
            }}
          >
            <Text strong style={{ fontSize: 18 }}>
              Total: Rp {totalAmount.toLocaleString("id-ID")}
            </Text>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: "block", marginBottom: 12 }}>
            Metode Pembayaran
          </Text>
          <Radio.Group
            value={metodePembayaran}
            onChange={(e) => setMetodePembayaran(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="qris">QRIS</Radio>
              <Radio value="tunai">Tunai</Radio>
            </Space>
          </Radio.Group>
        </div>

        <div style={{ textAlign: "right" }}>
          <Button
            onClick={() => setIsCheckoutModalOpen(false)}
            style={{ marginRight: 8 }}
          >
            Batal
          </Button>
          <Button
            type="primary"
            onClick={handleCheckout}
            loading={checkoutLoading}
          >
            Checkout
          </Button>
        </div>
      </Modal>

      {/* Modal Upload Bukti Pembayaran dengan Detail Order dan OCR Validation */}
<Modal
  title={<Title level={4}>Upload Bukti Pembayaran</Title>}
  open={isUploadModalOpen}
  onCancel={() => {
    setIsUploadModalOpen(false);
    setFileList([]);
    setValidationResult(null);
  }}
  footer={null}
  width={900}
>
  {/* ✅ Detail Order & Total Pembayaran */}
  <div style={{ marginBottom: 24 }}>
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text strong>Nomor Order:</Text>
          <Text>{orderId ? `ORD-${orderId}` : "-"}</Text>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text strong>Metode Pembayaran:</Text>
          <Text style={{ textTransform: "uppercase" }}>{metodePembayaran}</Text>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text strong>Total yang harus dibayar:</Text>
          <Text strong style={{ color: "#1890ff" }}>
            Rp {totalAmount.toLocaleString("id-ID")}
          </Text>
        </div>
      </Space>
    </Card>

    {/* Daftar item yang dipesan */}
    <Table
      dataSource={selectedItems}
      rowKey="id"
      pagination={false}
      size="small"
      style={{ marginBottom: 8 }}
    >
      <Table.Column dataIndex="product_name" title="Nama Produk" />
      <Table.Column
        title="Harga Satuan"
        render={(_, record: any) => (
          <Text>Rp {record.price.toLocaleString("id-ID")}</Text>
        )}
      />
      <Table.Column dataIndex="quantity" title="Jumlah" />
      <Table.Column
        title="Subtotal"
        render={(_, record: any) => (
          <Text strong>
            Rp {(record.price * record.quantity).toLocaleString("id-ID")}
          </Text>
        )}
      />
    </Table>
  </div>

  <div style={{ display: "flex", gap: 24 }}>
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
      }}
    >
      <Text strong style={{ marginBottom: 16, fontSize: 16 }}>
        Scan QRIS untuk Pembayaran
      </Text>
      <Image
        src="/images/qris.png"
        alt="QRIS"
        width={250}
        height={250}
        style={{ objectFit: "contain" }}
        preview={false}
      />
      <Text type="secondary" style={{ marginTop: 16, textAlign: "center" }}>
        Scan kode QR di atas menggunakan aplikasi pembayaran Anda
      </Text>
    </div>

    {/* Sisi Kanan - Upload Form dengan OCR Validation */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Alert
        message="Info Validasi Otomatis"
        description="Bukti pembayaran akan divalidasi otomatis. Pastikan gambar jelas dan mengandung kata kunci: Berhasil, Selesai, Transfer, Febyan Valentino, atau nominal transfer."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Text style={{ display: "block", marginBottom: 16 }}>
        Setelah melakukan pembayaran, silahkan upload bukti pembayaran Anda.
        Tunggu konfirmasi dari admin.
      </Text>

      <Upload
        listType="picture-card"
        fileList={fileList}
        beforeUpload={() => false}
        onChange={handleFileChange}
        maxCount={1}
        accept="image/*"
        disabled={isValidating}
        style={{ marginBottom: 16 }}
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
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Memvalidasi bukti pembayaran...
          </Text>
          <Progress percent={ocrProgress} status="active" />
        </div>
      )}

      {validationResult && !isValidating && (
        <Alert
          message={
            validationResult.isValid
              ? "Bukti Pembayaran Valid"
              : "Bukti Pembayaran Tidak Valid"
          }
          description={
            <div>
              <p>{validationResult.message}</p>
              {validationResult.foundKeywords.length > 0 && (
                <p style={{ marginTop: 8 }}>
                  <strong>Kata kunci ditemukan:</strong>{" "}
                  {validationResult.foundKeywords.join(", ")}
                </p>
              )}
              <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                Confidence: {validationResult.confidence.toFixed(2)}%
              </p>
            </div>
          }
          type={validationResult.isValid ? "success" : "error"}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ marginTop: "auto", textAlign: "right" }}>
        <Button
          onClick={() => {
            setIsUploadModalOpen(false);
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

    </List>
  );
}