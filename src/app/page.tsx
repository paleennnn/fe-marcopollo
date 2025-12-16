"use client";

import InstallButton from "@components/installButton";
import { useList, Link, useApiUrl } from "@refinedev/core";
import { Card, Button, FloatButton } from "antd";
import { WhatsAppOutlined } from "@ant-design/icons";
import Cookies from "js-cookie";
import React from "react";
import Image from "next/image";
import LogoImage from "@/public/logo/logo-marcopollo-hitam.png";

export default function LandingPage() {
  const apiUrl = useApiUrl();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Ambil data user dari localStorage
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  // Atau bisa juga cek cookie auth
  const authCookie = typeof window !== "undefined" ? Cookies.get("auth") : null;

  // Enable smooth scrolling on mount
  React.useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  // Helper function untuk get image URL
  const getImageUrl = (image: string | null) => {
    if (!image) return "/images/placeholder.png";
    // Jika sudah full URL (http/https), gunakan langsung
    if (image.startsWith("http")) {
      // Fix double folder: /kambings/kambings/ → /kambings/
      return image.replace(/\/kambings\/kambings\//g, "/kambings/");
    }
    // Jika relative path, prepend apiUrl
    return `${apiUrl}/${image}`;
  };

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
        <div className="flex items-center gap-4">
          <Image
            src={LogoImage}
            alt="Logo"
            style={{ height: "36px", width: "auto" }}
          />
          <h1 className="text-black text-lg font-semibold m-0 px-0 py-0 rounded">
            MARCOPOLLO
          </h1>
        </div>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="/#material"
            className="text-gray-700 hover:text-green-700 font-medium"
          >
            Material
          </a>
          <a
            href="/#kambing"
            className="text-gray-700 hover:text-green-700 font-medium"
          >
            Kambing
          </a>
          <a
            href="/#about"
            className="text-gray-700 hover:text-green-700 font-medium"
          >
            Tentang Kami
          </a>
          <a
            href="/#contact"
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

      {/* 🔹 Produk - Material */}
      <section id="material" className="py-12 px-6 bg-white">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          🧱 Material
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
                    alt={item.namaMaterial}
                    src={getImageUrl(item.image)}
                    className="h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder.png";
                    }}
                  />
                }
                onClick={() => handleCardClick(item.id, "material")}
              >
                <Card.Meta
                  title={item.namaMaterial}
                  description={`Rp ${Number(
                    item.hargaSatuan || 0
                  ).toLocaleString("id-ID")}`}
                />
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 🔹 Produk - Kambing */}
      <section id="kambing" className="py-12 px-6 bg-gray-50">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          🐐 Kambing
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
                    alt={item.namaKambing}
                    src={getImageUrl(item.image)}
                    className="h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder.png";
                    }}
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

      {/* 🔹 Tentang Kami Section */}
      <section id="about" className="py-12 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-justify">
          <h2 className="text-3xl font-bold mb-6 text-center text-[#2C595A]">
            Tentang Kami
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Marcopollo Group adalah marketplace terpercaya yang menyediakan kambing berkualitas dan material bangunan pilihan untuk memenuhi kebutuhan peternakan dan konstruksi Anda. Kami hadir sebagai solusi terpadu dengan mengutamakan kualitas produk, transparansi transaksi, dan pelayanan yang profesional.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Dengan sistem pemesanan yang mudah, layanan pelanggan yang responsif, serta dukungan operasional yang andal, Marcopollo Group siap menjadi mitra terpercaya bagi pelanggan individu maupun pelaku usaha. Kepuasan pelanggan adalah prioritas utama kami dalam membangun hubungan jangka panjang yang saling menguntungkan.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Setiap kambing dan material bangunan yang kami sediakan telah melalui proses seleksi dan pengelolaan yang terstandar, sehingga memastikan kualitas terbaik dan harga yang kompetitif. Didukung oleh mitra peternak dan supplier berpengalaman, kami berkomitmen untuk menghadirkan produk yang sesuai dengan kebutuhan pasar.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#2C595A] mb-2">1000+</h3>
              <p className="text-gray-600">Pelanggan Puas</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#2C595A] mb-2">500+</h3>
              <p className="text-gray-600">Produk Tersedia</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#2C595A] mb-2">24/7</h3>
              <p className="text-gray-600">Layanan Pelanggan</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🔹 Kontak Section */}
      <section id="contact" className="py-12 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-[#2C595A]">
            Hubungi Kami
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <h3 className="text-xl font-semibold mb-2 text-[#2C595A]">📍 Lokasi</h3>
              <p className="text-gray-600">
                Desa Palur Kec. Kebonsari<br />
                Madiun Jawa Timur 63173
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <h3 className="text-xl font-semibold mb-2 text-[#2C595A]">📞 Telepon</h3>
              <p className="text-gray-600">
                WhatsApp: <a href="https://wa.me/+6281805793869" className="text-gray-600 hover:text-green-600 font-semibold">+62 818 0579 3869</a>
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <h3 className="text-xl font-semibold mb-2 text-[#2C595A]">✉️ Email</h3>
              <p className="text-gray-600">
                <a href="mailto:csmarcopollogroup@gmail.com" className="text-gray-600 hover:text-blue-600 font-semibold">csmarcopollogroup@gmail.com</a>
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Button
              size="large"
              className="bg-[#25D366] hover:bg-[#20b954] text-white font-semibold border-0"
              onClick={handleWhatsAppClick}
            >
              <WhatsAppOutlined className="text-m mr-2" />
              Hubungi Kami via WhatsApp
            </Button>
          </div>
        </div>
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