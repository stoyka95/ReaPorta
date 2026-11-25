import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "cs";
  const messages = (await import("../../messages/cs.json")).default;
  return {
    locale,
    messages,
  };
});
