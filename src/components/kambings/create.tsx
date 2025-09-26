"use client";

import React, { useState, useEffect } from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Upload, Button, Divider, Alert, DatePicker, Select } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/lib";
import { CanAccess, useApiUrl } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";
import dayjs from "dayjs";

export const KambingCreate: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [kandangs, setKandangs] = useState<{ id: number; no_kandang: string }[]>([]);
  const apiUrl = useApiUrl();

  const { formProps, saveButtonProps } = useForm({
    action: "create",
    resource: "kambings", // sekarang CRUD kambing langsung, tidak nested kandang
  });

  // 🔹 Fetch daftar kandang dinamis
  useEffect(() => {
  const token = localStorage.getItem("token"); // ✅ sekarang ada
  fetch(`${apiUrl}/kandangs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("DATA KANDANGS:", data);
      setKandangs(Array.isArray(data) ? data : data.data || []);
    })
    .catch(() => setKandangs([]));
}, [apiUrl]); 

  const handleFileChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
  };

  // 🔹 custom submit pakai FormData
  const onFinish = async (values: any) => {
    const formData = new FormData();

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
    formData.append("kandang_id", values.kandang_id);

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("image", fileList[0].originFileObj);
    }

    return formProps.onFinish?.(formData);
  };

  return (
    <CanAccess resource="kambings" action="create" fallback={<UnauthorizedPage />}>
      <Create saveButtonProps={saveButtonProps}>
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
          {/* Nama kambing */}
          <Form.Item
            name="nama_kambing"
            label="Nama Kambing"
            rules={[{ required: true, message: "Nama kambing wajib diisi" }]}
          >
            <Input placeholder="Masukkan nama kambing" />
          </Form.Item>

          {/* Dropdown kandang */}
          <Form.Item
            name="kandang_id"
            label="Pilih Kandang"
            rules={[{ required: true, message: "Kandang wajib dipilih" }]}
          >
            <Select placeholder="Pilih kandang">
              {kandangs.map((k) => (
                <Select.Option key={k.id} value={k.id}>
                  Kandang {k.no_kandang}
                </Select.Option>
              ))}
            </Select>
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
              accept=".jpg,.jpeg,.png,.webp"
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
            <Input.TextArea rows={3} placeholder="Masukkan catatan tambahan (opsional)" />
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
