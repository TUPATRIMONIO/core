import { redirect } from 'next/navigation';

export default async function NewTicketPage() {
  redirect('/admin/communications/tickets/new');
}
