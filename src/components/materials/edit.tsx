"use client";

import React, { useState, useEffect } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Upload, Button, notification } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/lib";
import { CanAccess, useApiUrl } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";

export const MaterialEdit = () => {
  const apiUrl = useApiUrl();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const { formProps, saveButtonProps, query } = useForm({
    action: "edit",
    resource: "materials",
    meta: {
      fields: ["id_material", "nama_material", "harga_satuan", "image"],
    },
  });

  const data = query?.data?.data;

  // Set initial form values & image preview
  useEffect(() => {
    if (data && formProps.form) {
      formProps.form.setFieldsValue({
        nama_material: data.nama_material,
        harga_satuan: data.harga_satuan,
      });

      if (data.image) {
        const imageUrl = `${apiUrl}/${data.image}`;
        setCurrentImageUrl(imageUrl);
        setFileList([
          {
            uid: "-1",
            name: "Gambar Saat ini",
            status: "done",
            url: imageUrl,
          },
        ]);
      }
    }
  }, [data, formProps.form, apiUrl]);

  const handleFileChange = ({ fileList }: any) => {
    setFileList(fileList);
  };

  const onFinish = async (values: any) => {
    const formData = new FormData();

    formData.append("nama_material", values.nama_material);
    formData.append("harga_satuan", values.harga_satuan);

    // Jika ada file baru
    if (fileList.length > 0) {
      if (fileList[0].originFileObj) {
        formData.append("image", fileList[0].originFileObj);
      } else if (currentImageUrl) {
        // re-upload file lama jika tidak ada perubahan
        try {
          const response = await fetch(currentImageUrl);
          const blob = await response.blob();
          const file = new File([blob], "current-image.jpg", {
            type: blob.type || "image/jpeg",
          });
          formData.append("image", file);
        } catch (error) {
          notification.error({
            message: "Error",
            description: "Gagal memproses file gambar saat ini",
          });
          return;
        }
      }
    }

    // Method override untuk PUT
    formData.append("_method", "PUT");

    return formProps.onFinish?.(formData);
  };

  return (
    <CanAccess resource="materials" action="edit" fallback={<UnauthorizedPage />}>
      <Edit saveButtonProps={saveButtonProps} mutationMode="pessimistic">
        <Form {...formProps} onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Nama Material"
            name="nama_material"
            rules={[{ required: true, message: "Nama material wajib diisi" }]}
          >
            <Input placeholder="Masukkan nama material" />
          </Form.Item>

          <Form.Item
            label="Harga Satuan"
            name="harga_satuan"
            rules={[{ required: true, message: "Harga satuan wajib diisi" }]}
          >
            <Input placeholder="Masukkan harga satuan" type="number" />
          </Form.Item>

          <Form.Item
            name="image"
            label="Gambar Material"
            getValueProps={() => ({
              fileList: fileList.length ? fileList : [],
            })}
          >
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={() => false}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>
                {fileList.length > 0 ? "Ganti Gambar" : "Upload Gambar"}
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Edit>
    </CanAccess>
  );
};
