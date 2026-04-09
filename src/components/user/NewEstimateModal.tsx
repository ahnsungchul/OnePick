'use client';

import React, { useEffect, useState } from 'react';
import MultiStepEstimateForm from '../MultiStepEstimateForm';
import { useSession } from 'next-auth/react';
import { getCategoriesAction } from '@/actions/category.action';

interface NewEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewEstimateModal({
  isOpen,
  onClose,
  onSuccess,
}: NewEstimateModalProps) {
  const { data: session } = useSession();
  const [categoriesData, setCategoriesData] = useState<any[] | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Load categories data when modal is opened
      const loadCategories = async () => {
        try {
          const res = await getCategoriesAction();
          if (res.success) setCategoriesData(res.data);
        } catch (err) {
          console.error('Failed to load categories', err);
        }
      };
      if (!categoriesData) loadCategories();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, categoriesData]);

  if (!isOpen) return null;

  const customerId = session?.user?.id || "1";
  const customerName = session?.user?.name || "고객";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm !m-0">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <MultiStepEstimateForm 
            customerId={customerId}
            customerName={customerName}
            categoriesData={categoriesData}
            onClose={onClose}
            onSuccess={() => {
              if (onSuccess) onSuccess();
              onClose();
            }}
          />
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
