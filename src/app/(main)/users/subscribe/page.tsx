"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 632,
    billedYearly: 7581,
    features: [
      "Small reply boost",
      "Encrypted direct messages",
      "Bookmark folders",
      "Highlights tab",
    ],
    discount: "SAVE 10%",
  },
  {
    id: "premium",
    name: "Premium",
    price: 1658,
    billedYearly: 19900,
    features: [
      "Everything in Basic",
      "Half Ads in For You and Following",
      "Larger reply boost",
      "Get paid to post",
    ],
    discount: "SAVE 12%",
  },
  {
    id: "premium-plus",
    name: "Premium+",
    price: 8417,
    billedYearly: 101000,
    features: [
      "Everything in Premium",
      "Fully ad-free",
      "Largest reply boost",
      "Write Articles",
    ],
    discount: "SAVE 17%",
  },
];

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [isPremium, setIsPremium] = useState<boolean | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const res = await fetch("/api/payment/status");
        const data = await res.json();
        if (data.user?.isPremium) {
          setIsPremium(true);
        } else {
          setIsPremium(false);
        }
      } catch (error) {
        console.error("Failed to check premium status", error);
        setIsPremium(false);
      }
    };

    checkPremiumStatus();
  }, []);

  const handleSubscribe = async (planType: "MONTHLY" | "YEARLY") => {
    if (isPremium) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payment/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan: planType }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        alert(data.error || "Payment error");
        setLoading(false);
      }
    } catch (err) {
      alert("Something went wrong!");
      setLoading(false);
    }
  };

  const handleRedirectToCheckout = (planId: string) => {
    if (isPremium) return;
    router.push(`/users/subscribe/checkout?plan=${planId}`);
  };

  const { t, mounted } = useI18n();

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white p-8 text-gray-900 dark:bg-gradient-to-tr dark:from-gray-900 dark:to-black dark:text-white">
      <h1 className="mb-4 text-center text-3xl font-bold">
        {t.premiums}
      </h1>
      <p className="mb-8 text-center text-gray-600 dark:text-gray-300">
        {t.premiumsexplain}
      </p>

      {isPremium === true && (
        <p className="mb-6 text-center font-semibold text-green-600">
          {t.alrsubtip}
        </p>
      )}

      <div className="flex flex-col justify-center gap-6 lg:flex-row">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border ${
              selectedPlan === plan.id
                ? "border-blue-500 shadow-xl"
                : "border-gray-300 dark:border-gray-700"
            } w-full max-w-sm bg-white p-6 dark:bg-[#0f0f0f]`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              {selectedPlan === plan.id && (
                <div className="text-sm text-blue-500">✓ Selected</div>
              )}
            </div>
            <div className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
              ₫{plan.price.toLocaleString("vi-VN")}{" "}
              <span className="text-base font-normal">/ month</span>
            </div>
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              ₫{plan.billedYearly.toLocaleString("vi-VN")} billed annually
              {plan.discount && (
                <span className="ml-2 rounded bg-green-600 px-2 py-1 text-xs text-white">
                  {plan.discount}
                </span>
              )}
            </div>
            <ul className="mb-4 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center text-gray-800 dark:text-gray-200"
                >
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled={loading || isPremium}
              onClick={() => {
                setSelectedPlan(plan.id);
                handleRedirectToCheckout(plan.id);
              }}
              className={`w-full rounded py-2 font-medium transition ${
                selectedPlan === plan.id
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              } ${isPremium ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {isPremium
                ? t.alrsub
                : loading && selectedPlan === plan.id
                  ? "Processing..."
                  : t.subcribe}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
