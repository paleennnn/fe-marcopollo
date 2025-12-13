'use client'

import React, { useState, useEffect } from 'react'
import {
  BaseRecord,
  CanAccess,
  useApiUrl,
  useCustomMutation,
  useGetIdentity,
  useCustom,
} from '@refinedev/core'
import { List, ShowButton, EditButton, DeleteButton, useTable } from '@refinedev/antd'
import { Card, Row, Col, Typography, Image, Button, Space, Spin, Tag, Table } from 'antd'
import {
  ThunderboltFilled,
  ShoppingCartOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useNotification } from '@refinedev/core'
import UnauthorizedPage from '@app/unauthorized'

const { Text, Title } = Typography

export const KambingList = () => {
  const apiUrl = useApiUrl()
  const { open } = useNotification()
  const { data: identity } = useGetIdentity<any>()
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({})
  const [cartKambingIds, setCartKambingIds] = useState<number[]>([])

  const { tableProps } = useTable({
    syncWithLocation: true,
    resource: 'kambings',
  })

  // Fetch data keranjang untuk mendapatkan kambing yang sudah ada di keranjang user ini
  const { data: cartData, refetch: refetchCart } = useCustom({
    url: `${apiUrl}/customer/keranjang`,
    method: 'get',
  })

  // Update cartKambingIds setiap kali cartData berubah
  useEffect(() => {
    if (cartData?.data?.data) {
      const apiData = cartData.data.data
      const kambingIdsInCart = apiData
        .filter((item: any) => item.tipeProduk === 'kambing')
        .map((item: any) => item.kambing?.idKambing || item.idProduk)

      setCartKambingIds(kambingIdsInCart)
    }
  }, [cartData])

  const { mutate: addToCart } = useCustomMutation()

  const handleAddToCart = (kambingId: number) => {
    // Cek apakah kambing sudah ada di keranjang user ini
    if (cartKambingIds.includes(kambingId)) {
      open?.({
        type: 'error',
        message: 'Peringatan',
        description: 'Kambing ini sudah ada di keranjang Anda',
      })
      return
    }

    setLoadingStates((prev) => ({ ...prev, [kambingId]: true }))

    addToCart(
      {
        url: `${apiUrl}/customer/keranjang`,
        method: 'post',
        values: {
          tipe_produk: 'kambing',
          id_produk: kambingId,
          jumlah: 1, // Selalu 1 untuk kambing
        },
      },
      {
        onSuccess: () => {
          open?.({
            type: 'success',
            message: 'Berhasil',
            description: 'Kambing berhasil ditambahkan ke keranjang',
          })
          setLoadingStates((prev) => ({ ...prev, [kambingId]: false }))
          // Refetch cart untuk update cartKambingIds
          refetchCart()
        },
        onError: (error) => {
          open?.({
            type: 'error',
            message: 'Gagal',
            description: error?.message || 'Gagal menambahkan kambing ke keranjang',
          })
          setLoadingStates((prev) => ({ ...prev, [kambingId]: false }))
        },
      }
    )
  }

  const kambings = tableProps?.dataSource || []

  const getUserRole = () => {
    if (typeof window === "undefined") return null
    const userStr = localStorage.getItem('user')
    if (!userStr) return null

    try {
      const parsed = JSON.parse(userStr)
      const user = parsed.user ? parsed.user : parsed
      return user.role
    } catch {
      return null
    }
  }

  const isAdmin = getUserRole() === 'admin'

  // Kolom untuk tabel admin
  const adminColumns = [
    {
      title: 'Foto',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (image: string, record: BaseRecord) =>
        image ? (
          <Image
            src={`${apiUrl}/${image}`}
            alt={record.namaKambing}
            width={60}
            height={60}
            style={{
              objectFit: 'cover',
              borderRadius: 4,
              filter: record.sudah_dibooking ? 'grayscale(50%)' : 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              backgroundColor: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: record.sudah_dibooking ? 'grayscale(50%)' : 'none',
            }}
          >
            <Text type="secondary" style={{ fontSize: 10 }}>
              img
            </Text>
          </div>
        ),
    },
    {
      title: 'Nama Kambing',
      dataIndex: 'namaKambing',
      key: 'namaKambing',
      render: (text: string, record: BaseRecord) => (
        <Text strong style={{ color: record.sudah_dibooking ? '#999' : 'inherit' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Umur',
      dataIndex: 'umur',
      key: 'umur',
      render: (umur: number) => <Tag color="blue">{umur} bulan</Tag>,
    },
    {
      title: 'Harga Beli',
      dataIndex: 'hargaBeli',
      key: 'hargaBeli',
      render: (price: number, record: BaseRecord) => (
        <Text
          type="danger"
          style={{
            color: record.sudah_dibooking ? '#999' : '#f5222d',
          }}
        >
          Rp {price?.toLocaleString('id-ID')}
        </Text>
      ),
    },
    {
      title: 'Harga Jual',
      dataIndex: 'harga',
      key: 'harga',
      render: (price: number, record: BaseRecord) => (
        <Text
          type="success"
          style={{
            color: record.sudah_dibooking ? '#999' : '#52c41a',
          }}
        >
          Rp {price?.toLocaleString('id-ID')}
        </Text>
      ),
    },
    {
      title: 'Margin',
      dataIndex: 'harga',
      key: 'margin',
      render: (hargaJual: number, record: any) => {
        if (!record.hargaBeli || !hargaJual) return '-'
        const margin = (((hargaJual - record.hargaBeli) / record.hargaBeli) * 100).toFixed(2)
        return <Tag color={parseFloat(margin) > 20 ? 'green' : 'orange'}>{margin}%</Tag>
      },
    },
    {
      title: 'Status',
      dataIndex: 'sudah_dibooking',
      key: 'sudah_dibooking',
      render: (sudah_dibooking: boolean) =>
        sudah_dibooking ? (
          <Tag color="red" icon={<CheckCircleOutlined />}>
            Sudah Dibooking
          </Tag>
        ) : (
          <Tag color="green">Tersedia</Tag>
        ),
    },
    {
      title: 'Aksi',
      key: 'actions',
      render: (_: any, record: BaseRecord) => (
        <Space>
          <ShowButton
            hideText
            size="small"
            recordItemId={record.id}
            icon={<EyeOutlined />}
            title="Detail"
          />
          <EditButton hideText size="small" recordItemId={record.id} title="Edit kambing" />
          <DeleteButton hideText size="small" recordItemId={record.id} title="Hapus kambing" />
        </Space>
      ),
    },
  ]

  return (
    <CanAccess resource="kambings" action="list" fallback={<UnauthorizedPage />}>
      <List
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ThunderboltFilled style={{ fontSize: 24, marginRight: 12 }} />
            <Text strong style={{ fontSize: 20 }}>
              Manajemen Kambing
            </Text>
          </div>
        }
        headerButtons={({ defaultButtons }) => <>{defaultButtons}</>}
      >
        <Spin spinning={!!tableProps?.loading}>
          {isAdmin ? (
            // Tampilan Tabel untuk Admin
            <Table
              dataSource={kambings}
              columns={adminColumns}
              rowKey="id"
              pagination={{
                ...tableProps?.pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} kambing`,
              }}
            />
          ) : (
            // Tampilan Card untuk Customer
            <Row gutter={[16, 16]}>
              {kambings.map((kambing: BaseRecord) => {
                const isInCart = cartKambingIds.includes(kambing.id as number)

                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={kambing.id}>
                    <Card
                      hoverable
                      cover={
                        <div style={{ position: 'relative' }}>
                          {kambing.image ? (
                            <div
                              style={{
                                height: 200,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f0f0f0',
                              }}
                            >
                              <Image
                                src={`${apiUrl}/${kambing.image}`}
                                alt={kambing.namaKambing}
                                preview={true}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  filter: kambing.sudah_dibooking ? 'grayscale(50%)' : 'none',
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                height: 200,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f0f0f0',
                                filter: kambing.sudah_dibooking ? 'grayscale(50%)' : 'none',
                              }}
                            >
                              <Text type="secondary">Tidak ada foto</Text>
                            </div>
                          )}

                          {/* Status Badge untuk kambing yang sudah dibooking */}
                          {kambing.sudah_dibooking && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                              }}
                            >
                              SUDAH DIBOOKING
                            </div>
                          )}

                          {/* Badge untuk kambing yang sudah ada di keranjang */}
                          {isInCart && !kambing.sudah_dibooking && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                backgroundColor: 'rgba(24, 144, 255, 0.9)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                              }}
                            >
                              DI KERANJANG
                            </div>
                          )}
                        </div>
                      }
                      actions={[
                        <EditButton
                          key="edit"
                          hideText
                          size="small"
                          recordItemId={kambing.id}
                          title="Edit kambing"
                        />,
                        <DeleteButton
                          key="delete"
                          hideText
                          size="small"
                          recordItemId={kambing.id}
                          title="Hapus kambing"
                        />,
                      ]}
                    >
                      <Card.Meta
                        title={
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Title
                              level={5}
                              ellipsis={{ rows: 2 }}
                              style={{
                                marginBottom: 0,
                                flex: 1,
                                color: kambing.sudah_dibooking ? '#999' : 'inherit',
                              }}
                            >
                              {kambing.namaKambing}
                            </Title>
                            <ShowButton
                              hideText
                              size="small"
                              recordItemId={kambing.id}
                              icon={<EyeOutlined />}
                              title="Detail"
                              style={{ marginLeft: 8 }}
                            />
                          </div>
                        }
                        description={
                          <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Tag color="blue">{kambing.umur} bulan</Tag>
                              {kambing.sudah_dibooking && (
                                <Tag color="red" icon={<CheckCircleOutlined />}>
                                  Sudah Dibooking
                                </Tag>
                              )}
                            </div>

                            <Text
                              strong
                              style={{
                                fontSize: 16,
                                color: kambing.sudah_dibooking ? '#999' : '#1890ff',
                              }}
                            >
                              Rp {kambing.harga?.toLocaleString('id-ID')}
                            </Text>

                            {/* Conditional rendering untuk tombol keranjang */}
                            {!kambing.sudah_dibooking ? (
                              <Button
                                type={isInCart ? 'default' : 'primary'}
                                icon={<ShoppingCartOutlined />}
                                onClick={() => handleAddToCart(kambing.id as number)}
                                loading={loadingStates[kambing.id as number]}
                                style={{
                                  width: '100%',
                                  marginTop: 8,
                                }}
                                disabled={isInCart}
                              >
                                {isInCart ? 'Sudah di Keranjang' : 'Tambah ke Keranjang'}
                              </Button>
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  marginTop: 8,
                                  textAlign: 'center',
                                  padding: '8px',
                                  backgroundColor: '#f5f5f5',
                                  borderRadius: '4px',
                                  border: '1px dashed #d9d9d9',
                                }}
                              >
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  Kambing tidak tersedia
                                </Text>
                              </div>
                            )}
                          </Space>
                        }
                      />
                    </Card>
                  </Col>
                )
              })}
            </Row>
          )}
        </Spin>
      </List>
    </CanAccess>
  )
}
