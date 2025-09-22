"use client";

import React, { use, useState } from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Upload, Button, Divider, Alert, DatePicker } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/lib";
import { CanAccess } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";

export const KambingCreate: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const searchParams = useSearchParams();
  const kandangId = searchParams.get("kandangId");

  const { formProps, saveButtonProps } = useForm({
    action: "create",
    resource: kandangId ? `kandangs/${kandangId}/kambings` : undefined,
  });

  // handle upload file
  const handleFileChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
  };

  // custom submit untuk kirim FormData
  const onFinish = async (values: any) => {
    const formData = new FormData();

    // format tanggal ke "YYYY-MM-DD" agar cocok dengan vine.date()
    if (values.tanggal_ditambahkan) {
      formData.append(
        "tanggal_ditambahkan",
        dayjs(values.tanggal_ditambahkan).format("YYYY-MM-DD")
      );
    }

    formData.append("nama_kambing", values.nama_kambing);
    formData.append("umur", values.umur);
    formData.append("keterangan", values.keterangan || "");
    formData.append("catatan", values.catatan || "");
    formData.append("harga", values.harga);

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("image", fileList[0].originFileObj);
    }

    return formProps.onFinish?.(formData);
  };

  return (
    <CanAccess resource="kambings" action="create" fallback={<UnauthorizedPage />}>
      <Create saveButtonProps={saveButtonProps}>
        {/* Alert warning */}
        <Alert
          message={<strong>Perhatian</strong>}
          description={
            <span>
              Pastikan data kambing yang Anda input sudah benar.
              <br />
              File gambar hanya boleh berformat <strong>JPG, JPEG, PNG</strong>{" "}
              dan ukuran max <strong>2MB</strong>.
            </span>
          }
          type="warning"
          showIcon
        />

        <Divider />

        <Form {...formProps} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="nama_kambing"
            label="Nama Kambing"
            rules={[{ required: true, message: "Nama kambing wajib diisi" }]}
          >
            <Input placeholder="Masukkan nama kambing" />
          </Form.Item>

          {/* Upload foto */}
          <Form.Item
            name="image"
            label="Foto Kambing"
            rules={[{ required: true, message: "Foto kambing wajib diunggah" }]}
            getValueProps={() => ({ fileList: fileList.length ? fileList : [] })}
          >
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={() => false}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>Upload Foto</Button>
            </Upload>
          </Form.Item>
          <div style={{ fontSize: "12px", marginTop: "-20px", color: "#8c8c8c" }}>
            Format: JPG, JPEG, PNG. Ukuran max: 2MB
          </div>

          {/* Tanggal ditambahkan */}
          <Form.Item
            label="Tanggal Ditambahkan"
            name="tanggal_ditambahkan"
            rules={[{ required: true, message: "Tanggal wajib diisi" }]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          {/* Umur */}
          <Form.Item
            label="Umur saat Ditambahkan (bulan)"
            name="umur"
            rules={[{ required: true, message: "Umur wajib diisi" }]}
          >
            <Input type="number" placeholder="Masukkan umur kambing (bulan)" />
          </Form.Item>

          {/* Keterangan */}
          <Form.Item
            label="Keterangan"
            name="keterangan"
            rules={[{ required: true, message: "Keterangan wajib diisi" }]}
          >
            <Input placeholder="Masukkan keterangan" />
          </Form.Item>

          {/* Catatan */}
          <Form.Item label="Catatan" name="catatan">
            <Input.TextArea rows={4} placeholder="Masukkan catatan tambahan (opsional)" />
          </Form.Item>

          {/* Harga */}
          <Form.Item
            label="Harga"
            name="harga"
            rules={[{ required: true, message: "Harga wajib diisi" }]}
          >
            <Input type="number" placeholder="Masukkan harga kambing" />
          </Form.Item>
        </Form>
      </Create>
    </CanAccess>
  );
};
