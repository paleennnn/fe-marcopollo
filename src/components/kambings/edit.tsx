"use client";

import React, { useState, useEffect } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Upload, Button, DatePicker, Select } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/lib";
import { CanAccess, useApiUrl } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";
import dayjs from "dayjs";

export const KambingEdit = () => {
  const apiUrl = useApiUrl();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [kandangs, setKandangs] = useState<{ id: number; no_kandang: string }[]>([]);

  const { formProps, saveButtonProps, query } = useForm({
    action: "edit",
    resource: "kambings",
    meta: {
      fields: [
        "id",
        "nama_kambing",
        "harga_beli",
        "umur",
        "harga",
        "keterangan",
        "catatan",
        "tanggal_ditambahkan",
        "image",
        "kandang_id",
      ],
    },
  });

  const data = query?.data?.data;

  useEffect(() => {
    fetch(`${apiUrl}/kandangs`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => setKandangs(Array.isArray(data) ? data : data.data || []))
      .catch(() => setKandangs([]));
  }, [apiUrl]);

  useEffect(() => {
    if (data && formProps.form) {
      formProps.form.setFieldsValue({
        nama_kambing: data.namaKambing,
        harga_beli: data.hargaBeli,
        umur: data.umur,
        harga: data.harga,
        keterangan: data.keterangan,
        catatan: data.catatan,
        tanggal_ditambahkan: data.tanggalDitambahkan
          ? dayjs(data.tanggalDitambahkan)
          : null,
        kandang_id: data.kandangId,
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
    if (fileList.length === 0) {
      setRemoveImage(true);
    } else {
      setRemoveImage(false);
    }
  };

  const onFinish = async (values: any) => {
    const formData = new FormData();

    formData.append("nama_kambing", values.nama_kambing);
    formData.append("harga_beli", values.harga_beli);
    formData.append("umur", values.umur);
    formData.append("harga", values.harga);
    formData.append("keterangan", values.keterangan || "");
    formData.append("catatan", values.catatan || "");
    formData.append("tanggal_ditambahkan", values.tanggal_ditambahkan.format("YYYY-MM-DD"));
    formData.append("kandang_id", values.kandang_id);

    if (removeImage) {
      formData.append("remove_image", "true");
    } else if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("image", fileList[0].originFileObj);
    }

    formData.append("_method", "PUT");

    return formProps.onFinish?.(formData);
  };

  return (
    <CanAccess resource="kambings" action="edit" fallback={<UnauthorizedPage />}>
      <Edit saveButtonProps={saveButtonProps} mutationMode="pessimistic">
        <Form {...formProps} onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Nama Kambing"
            name="nama_kambing"
            rules={[{ required: true, message: "Nama kambing wajib diisi" }]}
          >
            <Input placeholder="Masukkan nama kambing" />
          </Form.Item>

          <Form.Item
            label="Kandang"
            name="kandang_id"
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

          <Form.Item
            label="Umur (bulan)"
            name="umur"
            rules={[{ required: true, message: "Umur wajib diisi" }]}
          >
            <Input type="number" placeholder="Contoh: 12" min={0} />
          </Form.Item>

          <Form.Item
            label="Keterangan"
            name="keterangan"
            rules={[{ required: true, message: "Keterangan wajib diisi" }]}
          >
            <Input placeholder="Contoh: Kambing Jawa, warna putih" />
          </Form.Item>

          <Form.Item label="Catatan" name="catatan">
            <Input.TextArea rows={3} placeholder="Masukkan catatan tambahan (opsional)" />
          </Form.Item>

          <Form.Item
            label="Harga Beli (Rp)"
            name="harga_beli"
            rules={[
              { required: true, message: "Harga beli wajib diisi" },
              { pattern: /^\d+$/, message: "Harga beli harus berupa angka" },
            ]}
          >
            <Input type="number" placeholder="Contoh: 2000000" min={0} />
          </Form.Item>

          <Form.Item
            label="Harga Jual (Rp)"
            name="harga"
            rules={[
              { required: true, message: "Harga jual wajib diisi" },
              { pattern: /^\d+$/, message: "Harga jual harus berupa angka" },
            ]}
          >
            <Input type="number" placeholder="Contoh: 2500000" min={0} />
          </Form.Item>

          <Form.Item
            label="Tanggal Ditambahkan"
            name="tanggal_ditambahkan"
            rules={[{ required: true, message: "Tanggal wajib diisi" }]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="image"
            label="Foto Kambing"
            getValueProps={() => ({
              fileList: fileList.length ? fileList : [],
            })}
          >
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={() => false}
              onChange={handleFileChange}
              onRemove={() => setRemoveImage(true)}
              fileList={fileList}
              accept=".jpg,.jpeg,.png,.webp"
            >
              <Button icon={<UploadOutlined />}>
                {fileList.length > 0 ? "Ganti Foto" : "Upload Foto"}
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Edit>
    </CanAccess>
  );
};
