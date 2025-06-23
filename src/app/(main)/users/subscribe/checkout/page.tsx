"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

  const [paymentMethod, setPaymentMethod] = useState<"momo" | "stripe" | "cod">(
    "momo",
  );
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (paymentMethod !== "momo")
      return alert("Only MoMo is supported at the moment.");
    setLoading(true);
    try {
      const res = await fetch("/api/payment/subscribe", {
        method: "POST",
        body: JSON.stringify({
          plan: planId === "monthly" ? "MONTHLY" : "YEARLY",
        }),
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
    <div className="flex min-h-screen flex-col gap-4 bg-white p-4 text-gray-900 dark:bg-gray-900 dark:text-white md:flex-row">
      <div className="space-y-4 rounded-lg bg-black p-6 text-white">
        <h2 className="text-xl font-semibold">Đăng ký WeebVerse Premium</h2>
        <div className="text-4xl font-bold">
          990.000 <span className="text-base font-normal">₫ mỗi tháng</span>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between">
            <span>WeebVerse Premium</span>
            <span>990.000₫</span>
          </div>
          <p className="text-sm text-gray-400">Được thanh toán hàng tháng</p>
        </div>

        <div className="space-y-2 border-t border-gray-700 pt-4">
          <div className="flex justify-between">
            <span>Tổng phụ</span>
            <span>990.000₫</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Thuế</span>
            <span>0₫</span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-2 font-semibold">
            <span>Tổng tiền phải trả hôm nay</span>
            <span>990.000₫</span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 md:w-1/2">
        <h2 className="text-lg font-semibold uppercase">Thành tiền</h2>
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span>{planId === "monthly" ? "990.000 VND" : "990.000 VND"}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Phí vận chuyển</span>
          <span>Miễn phí</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-gray-400 pt-2 font-bold">
          <span>Tổng cộng</span>
          <span>{planId === "monthly" ? "990.000 VND" : "990.000 VND"}</span>
        </div>

        <h3 className="mt-6 text-sm font-medium uppercase">
          Phương thức thanh toán
        </h3>
        <div className="flex gap-3">
          <button
            className={cn(
              "rounded-full border px-4 py-2",
              paymentMethod === "stripe"
                ? "bg-purple-600 text-white"
                : "bg-white dark:bg-gray-700",
            )}
            onClick={() => setPaymentMethod("stripe")}
          >
            Stripe
          </button>
          <button
            className={cn(
              "rounded-full border px-4 py-2",
              paymentMethod === "momo"
                ? "bg-pink-600 text-white"
                : "bg-white dark:bg-gray-700",
            )}
            onClick={() => setPaymentMethod("momo")}
          >
            MoMo
          </button>
          <button
            className={cn(
              "rounded-full border px-4 py-2",
              paymentMethod === "cod"
                ? "bg-gray-800 text-white"
                : "bg-white dark:bg-gray-700",
            )}
            onClick={() => setPaymentMethod("cod")}
          >
            COD
          </button>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-6 w-full rounded bg-black py-3 text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Thanh Toán"}
        </button>
      </div>
    </div>
  );
}
