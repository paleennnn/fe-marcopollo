"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button } from "antd";

interface Kambing {
  id: number;
  nama_kambing: string;
  harga: number;
  image?: string;
}

interface Material {
  id: number;
  nama_material: string;
  harga_satuan: number;
  image?: string;
}

export default function LandingPage() {
  const [kambings, setKambings] = useState<Kambing[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
  fetch("http://localhost:3333/api/public/kambings")
    .then((res) => res.json())
    .then((data) => {
      console.log("Kambing data:", data); // DEBUG: cek data yang diterima
      setKambings(Array.isArray(data) ? data : data.data || []);
    })
    .catch(() => setKambings([]));

  fetch("http://localhost:3333/api/public/materials")
    .then((res) => res.json())
    .then((data) => {
      console.log("Material data:", data); // DEBUG: cek data yang diterima
      setMaterials(Array.isArray(data) ? data : data.data || []);
    })
    .catch(() => setMaterials([]));
}, []);

  const handleCardClick = (id: number, type: "kambing" | "material") => {
    if (!token) {
      window.location.href = "/login"; // redirect ke login kalau belum login
    } else {
      window.location.href = `/${type}/${id}`; // redirect ke detail
    }
  };

  return (
    <div className="p-6">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">🛒 Marcopollo Group</h1>
        <div>
          {!token ? (
            <>
              <Link href="/login">
                <Button type="primary" className="mr-2">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          ) : (
            <Link href="/profile">
              <Button type="primary">Profil Saya</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Produk Kambing */}
      <h2 className="text-xl font-semibold mb-4">🐐 Kambing</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kambings.map((item) => (
          <Card
            key={item.id}
            hoverable
            cover={
              <img
                alt={item.nama_kambing}
                src={item.image || "/placeholder.png"}
                className="h-40 object-cover"
              />
            }
            onClick={() => handleCardClick(item.id, "kambing")}
          >
            <Card.Meta
              title={item.nama_kambing}
              description={`Rp ${item.harga.toLocaleString("id-ID")}`}
            />
          </Card>
        ))}
      </div>

      {/* Produk Material */}
      <h2 className="text-xl font-semibold mb-4">🧱 Material</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {materials.map((item) => (
          <Card
            key={item.id}
            hoverable
            cover={
              <img
                alt={item.nama_material}
                src={item.image || "/placeholder.png"}
                className="h-40 object-cover"
              />
            }
            onClick={() => handleCardClick(item.id, "material")}
          >
            <Card.Meta
              title={item.nama_material}
              description={`Rp ${Number(item.harga_satuan || 0).toLocaleString(
                "id-ID"
              )}`}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
