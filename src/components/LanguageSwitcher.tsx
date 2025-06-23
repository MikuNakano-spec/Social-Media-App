"use client";

import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";

const LanguageSwitcher = () => {
  const { lang, setLang } = useI18n();
  const router = useRouter();

  const languages = [
    { code: "en", label: "English" },
    { code: "vi", label: "Tiếng Việt" },
  ];

  return (
    <div className="flex gap-2 items-center">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => {
            setLang(code as "en" | "vi");
            router.refresh();
          }}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            lang === code
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
