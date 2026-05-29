import CreateLeadClient from '@/components/createLeadClient';
import DashboardLayout from '@/components/DashboardLayout';

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <CreateLeadClient mode="edit" leadId={id} />
    </DashboardLayout>
  );
}
