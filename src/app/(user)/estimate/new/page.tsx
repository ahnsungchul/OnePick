import MultiStepEstimateForm from '@/components/MultiStepEstimateForm';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getCategoriesAction } from '@/actions/category.action';

export default async function NewEstimatePage({
  searchParams,
}: {
  searchParams: { id?: string; step?: string };
}) {
  const session = await auth();
  const { id: initialEstimateId, step: initialStep } = await searchParams;
  
  // 세션이 있는 경우 해당 정보 사용, 없으면 임시 예외처리용 데이터
  const customerId = session?.user?.id || "1";
  const customerName = session?.user?.name || "고객";
  const categoriesRes = await getCategoriesAction();
  const categoriesData = categoriesRes.success ? categoriesRes.data : undefined;
  
  return (
    <div className="py-10 px-4 max-w-3xl mx-auto">
      <MultiStepEstimateForm 
        customerId={customerId} 
        customerName={customerName} 
        initialEstimateId={initialEstimateId}
        initialStep={initialStep ? parseInt(initialStep, 10) : undefined}
        categoriesData={categoriesData}
      />
    </div>
  );
}
