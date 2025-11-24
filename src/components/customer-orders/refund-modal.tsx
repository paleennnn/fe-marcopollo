import React, { useState } from 'react'
import { Modal, Form, Input, Button, message } from 'antd'
import { useCreate } from '@refinedev/core'

interface RefundModalProps {
  visible: boolean
  onCancel: () => void
  orderDetailId: number | null
  onSuccess: () => void
}

export const RefundModal: React.FC<RefundModalProps> = ({
  visible,
  onCancel,
  orderDetailId,
  onSuccess,
}) => {
  const [form] = Form.useForm()
  const { mutate: createRefund, isLoading } = useCreate()

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (!orderDetailId) return

      createRefund(
        {
          resource: 'customer/refunds',
          values: {
            order_detail_id: orderDetailId,
            alasan: values.alasan,
          },
          successNotification: {
            message: 'Pengajuan refund berhasil',
            description: 'Permintaan Anda sedang diproses oleh admin.',
            type: 'success',
          },
          errorNotification: (error: any) => ({
            message: 'Gagal mengajukan refund',
            description: error?.response?.data?.message || 'Terjadi kesalahan',
            type: 'error',
          }),
        },
        {
          onSuccess: () => {
            form.resetFields()
            onSuccess()
            onCancel()
          },
        }
      )
    })
  }

  return (
    <Modal
      title="Ajukan Pengembalian Dana"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={isLoading}
      okText="Ajukan Refund"
      cancelText="Batal"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="alasan"
          label="Alasan Pengembalian"
          rules={[
            { required: true, message: 'Mohon isi alasan pengembalian' },
            { min: 10, message: 'Alasan minimal 10 karakter' },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Jelaskan mengapa Anda ingin mengembalikan kambing ini..."
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
