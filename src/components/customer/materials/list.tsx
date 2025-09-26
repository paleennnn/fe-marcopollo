"use client";

import React from "react";
import { Card, Button } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

interface MaterialListProps {
  items: any[];
  apiUrl: string;
}

const MaterialList: React.FC<MaterialListProps> = ({ items, apiUrl }) => {
  const router = useRouter();

  const handleDetail = (id: number) => {
    router.push(`/customer/materials/${id}`);
  };

  const handleAddToCart = (item: any) => {
    // 🚀 sementara simpan di localStorage, nanti bisa dihubungkan ke backend
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({ ...item, qty: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${item.nama_material} ditambahkan ke keranjang`);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {items.map((item) => {
        const imageUrl = item.image
          ? `${apiUrl}/${item.image}`
          : "/placeholder.png";

        return (
          <Card
            key={item.id}
            hoverable
            cover={
              <img
                alt={item.nama_material}
                src={imageUrl}
                className="h-40 object-cover"
              />
            }
            actions={[
              <ShoppingCartOutlined
                key="cart"
                onClick={() => handleAddToCart(item)}
              />,
            ]}
            onClick={() => handleDetail(item.id)}
          >
            <Card.Meta
              title={item.nama_material}
              description={`Rp ${Number(
                item.harga_satuan || 0
              ).toLocaleString("id-ID")}`}
            />
          </Card>
        );
      })}
    </div>
  );
};

export default MaterialList;
