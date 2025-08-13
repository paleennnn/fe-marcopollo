"use client";

import React, { useState } from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Upload, Button, Divider, Alert } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { CanAccess } from "@refinedev/core";
import type { UploadFile } from "antd/lib";
import UnauthorizedPage from "@app/unauthorized";

export const MaterialCreate = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const { formProps, saveButtonProps } = useForm({
    action: "create",
    resource: "materials", // sesuai route di backend
  });

  const handleFileChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
  };

  const onFinish = async (values: any) => {
    const formData = new FormData();

    formData.append("nama_material", values.nama_material);
    formData.append("harga_satuan", values.harga_satuan);

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("image", fileList[0].originFileObj);
    }

    return formProps.onFinish?.(formData);
  };

  return (
    <CanAccess
      resource="materials"
      action="create"
      fallback={<UnauthorizedPage />}
    >
      <Create saveButtonProps={saveButtonProps}>
        <Alert
          message={<strong>Perhatian</strong>}
          description={
            <span>
              Pastikan data material yang Anda input sudah benar.
              <br />
              File gambar hanya boleh berformat <strong>JPG, JPEG, PNG</strong>.
            </span>
          }
          type="warning"
          showIcon
        />

        <Divider />

        <Form {...formProps} onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Nama Material"
            name="nama_material"
            rules={[
              { required: true, message: "Nama material wajib diisi" },
            ]}
          >
            <Input placeholder="Masukkan nama material" />
          </Form.Item>

          <Form.Item
            label="Harga Satuan"
            name="harga_satuan"
            rules={[
              { required: true, message: "Harga satuan wajib diisi" },
            ]}
          >
            <Input type="number" placeholder="Masukkan harga satuan" />
          </Form.Item>

          <Form.Item
            name="image"
            label="Foto Material"
            rules={[
              { required: true, message: "Foto material wajib diunggah" },
            ]}
            getValueProps={() => ({
              fileList: fileList.length ? fileList : [],
            })}
          >
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={() => false} // tidak auto upload
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>Upload Foto</Button>
            </Upload>
          </Form.Item>

          <div
            style={{
              color: "#8c8c8c",
              fontSize: "12px",
              marginTop: "-20px",
            }}
          >
            Format: JPG, JPEG, PNG. Ukuran max: 2MB
          </div>
        </Form>
      </Create>
    </CanAccess>
  );
};
