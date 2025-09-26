"use client";

import InstallButton from "@components/installButton";
import { useList, Link } from "@refinedev/core";
import { Card, Button, FloatButton } from "antd";
import { WhatsAppOutlined } from "@ant-design/icons";
import Cookies from "js-cookie";

export default function LandingPage() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Ambil data user dari localStorage
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  // Atau bisa juga cek cookie auth
  const authCookie = typeof window !== "undefined" ? Cookies.get("auth") : null;

  // Ambil data Kambing dari resource refine
  const { data: kambingsData, isLoading: kambingsLoading } = useList({
    resource: "public/kambings",
    pagination: { pageSize: 4 }, // tampilkan 4 unggulan
  });

  // Ambil data Material dari resource refine
  const { data: materialsData, isLoading: materialsLoading } = useList({
    resource: "public/materials",
    pagination: { pageSize: 4 }, // tampilkan 4 unggulan
  });

  const kambings = kambingsData?.data ?? [];
  const materials = materialsData?.data ?? [];

  const handleCardClick = (id: number, type: "kambing" | "material") => {
    if (!token) {
      window.location.href = "/login"; // redirect ke login kalau belum login
    } else {
      window.location.href = `/${type}/${id}`; // redirect ke detail
    }
  };
  
  const handleWhatsAppClick = () => {
    window.open("https://wa.me/+6281805793869", "_blank");
  };
  
  const isAuthenticated = !!(user && authCookie);

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* 🔹 Navbar */}
      <nav className="flex justify-between items-center bg-white shadow p-4 sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-[#2C595A]">🛒Marcopollo</h1>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="/"
            className="text-gray-700 hover:text-green-700 font-medium"
          >
            Home
          </a>
          <a
            href="/materials"
            className="text-gray-700 hover:text-green-700 font-medium"
          >
            Produk
          </a>
          <a
            href="/about"
            className="text-gray-700 hover:text-green-700 font-medium"
          >
            Tentang Kami
          </a>
          <a
            href="/contact"
            className="text-gray-700 hover:text-green-700 font-medium"
          >
            Kontak
          </a>
        </div>

        <div className="flex gap-2">
          <Link to="/login">
            <Button type="primary">Login</Button>
          </Link>
          <Link to="/register">
            <Button>Register</Button>
          </Link>
        </div>
      </nav>

      {/* 🔹 Hero Section */}
      <section className="bg-[#2C595A] text-white text-center pt-28 pb-20 px-6">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Marketplace Kambing & Material Berkualitas
        </h1>
        <p className="text-lg md:text-xl mb-6">
          Temukan kambing terbaik dan material bangunan terpercaya hanya di
          Marcopollo Group.
        </p>
        <div className="flex justify-center gap-4">
          <Button
            size="large"
            type="primary"
            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black"
            href="/kambing"
          >
            Lihat Kambing
          </Button>
          <Button
            size="large"
            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black"
            href="/material"
          >
            Lihat Material
          </Button>
        </div>
      </section>

      {/* 🔹 Kategori */}
      <section className="py-12 px-6 text-center bg-white">
        <h2 className="text-2xl font-semibold mb-8">Kategori Produk</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-6 bg-green-100 rounded-xl shadow hover:shadow-lg cursor-pointer">
            <span className="text-4xl">🐐</span>
            <h3 className="mt-2 font-bold">Kambing</h3>
          </div>
          <div className="p-6 bg-orange-100 rounded-xl shadow hover:shadow-lg cursor-pointer">
            <span className="text-4xl">🧱</span>
            <h3 className="mt-2 font-bold">Material</h3>
          </div>
        </div>
      </section>

      {/* 🔹 Produk Unggulan - Kambing */}
      <section id="kambing" className="py-12 px-6 bg-gray-50">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          🐐 Kambing Unggulan
        </h2>
        {kambingsLoading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kambings.map((item: any) => (
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
                  description={`Rp ${Number(item.harga || 0).toLocaleString(
                    "id-ID"
                  )}`}
                />
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 🔹 Produk Unggulan - Material */}
      <section id="material" className="py-12 px-6 bg-white">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          🧱 Material Unggulan
        </h2>
        {materialsLoading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {materials.map((item: any) => (
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
                  description={`Rp ${Number(
                    item.harga_satuan || 0
                  ).toLocaleString("id-ID")}`}
                />
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 🔹 CTA Section */}
      <section className="bg-[#2C595A] text-white text-center pt-28 pb-20 px-6">
        <h2 className="text-3xl font-bold mb-4">Siap Belanja Sekarang?</h2>
        <p className="mb-6">
          Dapatkan kambing pilihan dan material bangunan terbaik hanya di satu
          tempat.
        </p>
        <Button
          size="large"
          type="primary"
          className="bg-white text-gray-900 font-semibold"
          href="/register"
        >
          Mulai Sekarang
        </Button>
      </section>

      {/* 🔹 Footer */}
      <footer className="bg-gray-900 text-gray-300 p-6 text-center text-sm">
        © {new Date().getFullYear()} Marcopollo Group. All rights reserved.
      </footer>

      {/* Floating WhatsApp Button - Kanan Bawah */}
      <div
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
        onClick={handleWhatsAppClick}
      >
        {/* Desktop version - with text */}
        <div className="hidden md:flex items-center bg-[#25D366] hover:bg-[#20b954] text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl">
          <WhatsAppOutlined className="text-xl mr-2" />
          <span className="text-sm font-medium whitespace-nowrap">
            Pertanyaan atau Masalah? Bisa klik disini
          </span>
        </div>

        {/* Mobile version - icon only */}
        <div className="flex md:hidden items-center justify-center bg-[#25D366] hover:bg-[#20b954] text-white w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl">
          <WhatsAppOutlined className="text-xl" />
        </div>
      </div>

      {/* Install Button Component - Kiri Bawah */}
      <InstallButton />
    </main>
  );
}