import { redirect } from 'next/navigation';

export default async function TicketsPage() {
  redirect('/admin/communications/tickets');
}
