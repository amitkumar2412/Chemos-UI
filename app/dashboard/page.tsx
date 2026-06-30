import { redirect } from 'next/navigation';

// /dashboard was a legacy route. The canonical route is now /.
export default function DashboardRedirect() {
  redirect('/');
}
