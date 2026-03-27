import { redirect } from "next/navigation";

export default function OrphanFilesRedirectPage() {
  redirect("/orphan-data?tab=files");
}
