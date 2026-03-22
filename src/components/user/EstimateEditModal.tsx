'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import MultiStepEstimateForm from '../MultiStepEstimateForm';

interface EstimateEditModalProps {
  estimateId: string;
  customerId: string;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialStep?: number;
}

export default function EstimateEditModal({
  estimateId,
  customerId,
  customerName,
  isOpen,
  onClose,
  onSuccess,
  initialStep = 1
}: EstimateEditModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Content - Scrollable area for the form */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <MultiStepEstimateForm 
            customerId={customerId}
            customerName={customerName}
            initialEstimateId={estimateId}
            initialStep={initialStep}
            isEditMode={true}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </div>
      </div>
      
      {/* CSS for custom scrollbar if needed, otherwise standard is fine */}
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
