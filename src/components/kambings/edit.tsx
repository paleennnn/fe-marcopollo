"use client";

import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, DatePicker, Upload } from "antd";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

export const KambingEdit: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kandangId = searchParams.get("kandangId");
  const id = searchParams.get("id");

  const { formProps, saveButtonProps } = useForm({
    action: "edit",
    resource: kandangId ? `kandangs/${kandangId}/kambings` : "kambings",
    id: id ?? undefined, // kasih id kambing yang diedit
    redirect: false, // biar bisa custom redirect
    onMutationSuccess: () => {
      router.push(`/kandangs/show/${kandangId}`);
    },
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Foto" name="image">
          <Upload
            beforeUpload={() => false}
            listType="picture-card"
            maxCount={1}
          >
            <div>Upload</div>
          </Upload>
        </Form.Item>

        <Form.Item
          label="Tanggal Ditambahkan"
          name="tanggal_ditambahkan"
          rules={[{ required: true }]}
          getValueProps={(value) => ({
            value: value ? dayjs(value) : undefined,
          })}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Umur (bulan)" name="umur" rules={[{ required: true }]}>
          <Input type="number" />
        </Form.Item>

        <Form.Item label="Keterangan" name="keterangan" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Catatan" name="catatan">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item label="Harga Kambing" name="harga">
          <Input type="number" />
        </Form.Item>
      </Form>
    </Edit>
  );
};
