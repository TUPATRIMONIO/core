import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket } from "lucide-react";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";

export default function NewSupportTicketPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo ticket"
        description="Cuéntanos tu situación y te responderemos por este mismo canal."
        icon={Ticket}
      />

      <Card>
        <CardContent className="pt-6">
          <SupportTicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
