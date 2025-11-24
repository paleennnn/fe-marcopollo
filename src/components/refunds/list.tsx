'use client'

import { List, useTable } from '@refinedev/antd'
import { Table, Tag, Space, Button, Modal, Form, Input, message } from 'antd'
import { useUpdate } from '@refinedev/core'
import dayjs from 'dayjs'
import { useState } from 'react'

export const RefundsList = () => {
  const { tableProps } = useTable({
    resource: 'refunds',
    syncWithLocation: true,
  })

  const { mutate: updateStatus, isLoading } = useUpdate()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedRefundId, setSelectedRefundId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<'disetujui' | 'ditolak'>('disetujui')
  const [form] = Form.useForm()

  const handleAction = (id: number, type: 'disetujui' | 'ditolak') => {
    setSelectedRefundId(id)
    setActionType(type)
    setIsModalVisible(true)
    form.resetFields()
  }

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (!selectedRefundId) return

      updateStatus(
        {
          resource: 'refunds',
          id: selectedRefundId,
          values: {
            status: actionType,
            catatan_admin: values.catatan_admin,
          },
          successNotification: {
            message: `Refund berhasil ${actionType === 'disetujui' ? 'disetujui' : 'ditolak'}`,
            type: 'success',
          },
        },
        {
          onSuccess: () => {
            setIsModalVisible(false)
            form.resetFields()
          },
        }
      )
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disetujui':
        return 'green'
      case 'ditolak':
        return 'red'
      case 'menunggu':
        return 'orange'
      default:
        return 'default'
    }
  }

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column title="ID" dataIndex="id" width={80} />
        <Table.Column
          title="Customer"
          dataIndex={['user', 'fullname']}
          render={(value, record: any) => (
            <Space direction="vertical" size={0}>
              <span style={{ fontWeight: 500 }}>{value}</span>
              <span style={{ fontSize: 12, color: '#888' }}>{record.user?.email}</span>
            </Space>
          )}
        />
        <Table.Column
          title="Order & Produk"
          dataIndex={['orderDetail', 'order', 'nomorOrder']}
          render={(value, record: any) => (
            <Space direction="vertical" size={0}>
              <span style={{ fontWeight: 500 }}>{value}</span>
              <span style={{ fontSize: 12 }}>{record.orderDetail?.namaProduk}</span>
            </Space>
          )}
        />
        <Table.Column
          title="Total Harga"
          dataIndex="totalHarga"
          render={(value) =>
            new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(parseFloat(value || 0))
          }
        />
        <Table.Column
          title="Tanggal"
          dataIndex="createdAt"
          render={(value) => dayjs(value).format('DD/MM/YYYY HH:mm')}
        />
        <Table.Column title="Alasan Customer" dataIndex="alasan" width={200} />
        <Table.Column
          title="Status"
          dataIndex="status"
          render={(value) => <Tag color={getStatusColor(value)}>{value.toUpperCase()}</Tag>}
        />
        <Table.Column
          title="Aksi"
          key="action"
          render={(_, record: any) => {
            if (record.status !== 'menunggu') return null

            return (
              <Space>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleAction(record.id, 'disetujui')}
                >
                  Setujui
                </Button>
                <Button size="small" danger onClick={() => handleAction(record.id, 'ditolak')}>
                  Tolak
                </Button>
              </Space>
            )
          }}
        />
      </Table>

      <Modal
        title={actionType === 'disetujui' ? 'Setujui Refund' : 'Tolak Refund'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={isLoading}
        okText="Simpan"
        cancelText="Batal"
        okButtonProps={{ danger: actionType === 'ditolak' }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="catatan_admin"
            label="Catatan Admin"
            rules={[{ required: true, message: 'Mohon isi catatan' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Contoh: Barang sudah diterima kembali / Alasan tidak valid"
            />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  )
}
