import CDSPanel from "@/components/admin/CDSPanel";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CDSAdminPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Optional: Check for specific admin role permissions here
  // const isAdmin = ...

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Panel CDS (Certificadora del Sur)
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Administración y pruebas de integración con firma electrónica avanzada.
          </p>
        </div>
      </div>

      <CDSPanel />
    </div>
  );
}
