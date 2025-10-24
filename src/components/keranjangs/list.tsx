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
} from "antd";
import { ShoppingCartOutlined, UploadOutlined } from "@ant-design/icons";
import { useApiUrl, useCustomMutation, useInvalidate } from "@refinedev/core";
import { useNotification } from "@refinedev/core";
import type { UploadFile } from "antd";

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

  const { tableProps } = useTable({
    resource: "customer/keranjang",
    syncWithLocation: true,
  });

  const { mutate: createCheckout } = useCustomMutation();
  const { mutate: uploadBukti } = useCustomMutation();
  const invalidate = useInvalidate();

  // Ensure dataSource is always an array and map API response to expected structure
  const apiData = (tableProps.dataSource as any)?.data || [];
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

    // Jika semua item dipilih, langsung checkout
    if (selectedRowKeys.length === safeTableProps.dataSource.length) {
      performCheckout();
      return;
    }

    // Jika hanya sebagian item dipilih, tanya user terlebih dahulu
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

    console.log("Selected items for checkout:", selectedRowKeys);

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

          // Jika metode pembayaran tunai, langsung tampilkan toast sukses
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

          // Jika QRIS, tampilkan modal upload bukti
          console.log("Checkout response:", data);
          const newOrderId =
            data?.data?.data?.order?.idOrder ||
            data?.data?.order?.idOrder ||
            data?.order?.idOrder ||
            data?.data?.idOrder ||
            data?.idOrder ||
            data?.id ||
            null;
          console.log("Extracted Order ID:", newOrderId);
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

          // ✅ Handle error khusus untuk kambing yang sudah dibooking
          if (
            error?.statusCode === 409 ||
            error?.response?.data?.error === "KAMBING_ALREADY_BOOKED"
          ) {
            setIsCheckoutModalOpen(false);

            // Tampilkan modal konfirmasi dengan info lengkap
            Modal.error({
              title: "Kambing Tidak Tersedia",
              content:
                error?.message ||
                error?.response?.data?.message ||
                "Beberapa kambing sudah di-checkout oleh user lain dan telah dihapus dari keranjang Anda.",
              okText: "Mengerti",
              onOk: () => {
                // Reset selection dan refresh data
                setSelectedRowKeys([]);
                invalidate({
                  resource: "customer/keranjang",
                  invalidates: ["list"],
                });
              },
            });

            return;
          }

          // Handle error lainnya
          open?.({
            type: "error",
            message: "Gagal",
            description: error?.message || "Gagal melakukan checkout",
          });
        },
      }
    );
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

    console.log("Uploading bukti for order ID:", orderId);
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
          // Hapus satu per satu menggunakan Promise.all
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
            {/* <Table.Column
              dataIndex="image"
              title="Gambar"
              width={80}
              render={(value: string) =>
                value ? (
                  <Image
                    src={`${apiUrl}/${value}`}
                    alt="Product"
                    width={50}
                    height={50}
                    style={{ objectFit: "cover", borderRadius: 4 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      img
                    </Text>
                  </div>
                )
              }
            /> */}
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
            {/* <Table.Column
              dataIndex="image"
              title="Gambar"
              width={60}
              render={(value: string) =>
                value ? (
                  <Image
                    src={`${apiUrl}/${value}`}
                    alt="Product"
                    width={40}
                    height={40}
                    style={{ objectFit: "cover", borderRadius: 4 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      img
                    </Text>
                  </div>
                )
              }
            /> */}
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

      {/* Modal Upload Bukti Pembayaran */}
      <Modal
        title={<Title level={4}>Upload Bukti Pembayaran</Title>}
        open={isUploadModalOpen}
        onCancel={() => {
          setIsUploadModalOpen(false);
          setFileList([]);
        }}
        footer={null}
        width={800}
      >
        <div style={{ display: "flex", gap: 24 }}>
          {/* Sisi Kiri - QR Code */}
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
            <Text
              type="secondary"
              style={{ marginTop: 16, textAlign: "center" }}
            >
              Scan kode QR di atas menggunakan aplikasi pembayaran Anda
            </Text>
          </div>

          {/* Sisi Kanan - Upload Form */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Text style={{ display: "block", marginBottom: 16 }}>
              Setelah melakukan pembayaran, silahkan upload bukti pembayaran
              Anda. Tunggu konfirmasi dari admin.
            </Text>

            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              maxCount={1}
              accept="image/*"
              style={{ marginBottom: 24 }}
            >
              {fileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload Bukti</div>
                </div>
              )}
            </Upload>

            <div style={{ marginTop: "auto", textAlign: "right" }}>
              <Button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setFileList([]);
                }}
                style={{ marginRight: 8 }}
              >
                Batal
              </Button>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleUploadBukti}
                loading={uploadLoading}
                disabled={fileList.length === 0}
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
