import { cookies } from "next/headers";
import en from "./en";
import vi from "./vi";

type Translations = typeof en;
type Lang = "en" | "vi";

export const getServerTranslation = (): Translations => {
  const lang = cookies().get("lang")?.value as Lang;
  return lang === "vi" ? vi : en;
};
