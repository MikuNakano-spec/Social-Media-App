"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils"; // optional utility for classnames if you're using it

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

  const [paymentMethod, setPaymentMethod] = useState<"momo" | "stripe" | "cod">("momo");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (paymentMethod !== "momo") return alert("Only MoMo is supported at the moment.");
    setLoading(true);
    try {
      const res = await fetch("/api/payment/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan: planId === "monthly" ? "MONTHLY" : "YEARLY" }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        alert(data.error || "Payment error");
      }
    } catch (err) {
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col md:flex-row p-4 gap-4">
      {/* Left: Shipping Info (fake form for now) */}
      <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-lg font-semibold uppercase">Thông tin giao hàng</h2>
        <input className="w-full p-2 border rounded dark:bg-gray-700" placeholder="Họ tên" />
        <input className="w-full p-2 border rounded dark:bg-gray-700" placeholder="Số điện thoại" />
        <input className="w-full p-2 border rounded dark:bg-gray-700" placeholder="Email" />
        <input className="w-full p-2 border rounded dark:bg-gray-700" placeholder="Địa chỉ" />
        <div className="flex gap-2">
          <input className="w-1/3 p-2 border rounded dark:bg-gray-700" placeholder="Tỉnh" />
          <input className="w-1/3 p-2 border rounded dark:bg-gray-700" placeholder="Quận" />
          <input className="w-1/3 p-2 border rounded dark:bg-gray-700" placeholder="Phường" />
        </div>
      </div>

      {/* Right: Payment Summary */}
      <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-lg font-semibold uppercase">Thành tiền</h2>
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span>{planId === "monthly" ? "990.000 VND" : "1.990.000 VND"}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Phí vận chuyển</span>
          <span>Miễn phí</span>
        </div>
        <div className="mt-4 flex justify-between font-bold border-t pt-2 border-gray-400">
          <span>Tổng cộng</span>
          <span>{planId === "monthly" ? "990.000 VND" : "1.990.000 VND"}</span>
        </div>

        <h3 className="mt-6 text-sm uppercase font-medium">Phương thức thanh toán</h3>
        <div className="flex gap-3">
          <button
            className={cn(
              "border rounded-full px-4 py-2",
              paymentMethod === "stripe" ? "bg-purple-600 text-white" : "bg-white dark:bg-gray-700"
            )}
            onClick={() => setPaymentMethod("stripe")}
          >
            Stripe
          </button>
          <button
            className={cn(
              "border rounded-full px-4 py-2",
              paymentMethod === "momo" ? "bg-pink-600 text-white" : "bg-white dark:bg-gray-700"
            )}
            onClick={() => setPaymentMethod("momo")}
          >
            MoMo
          </button>
          <button
            className={cn(
              "border rounded-full px-4 py-2",
              paymentMethod === "cod" ? "bg-gray-800 text-white" : "bg-white dark:bg-gray-700"
            )}
            onClick={() => setPaymentMethod("cod")}
          >
            COD
          </button>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full mt-6 py-3 bg-black text-white rounded hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Thanh Toán"}
        </button>
      </div>
    </div>
  );
}
