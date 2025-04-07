'use client';

import React, { useState, useEffect } from 'react';
import { Transfer } from '@/types/transfer';
import { getTransfers } from '@/app/api/transferService';
import { withAuth } from '@/app/components/withAuth';
import TransferTable from './components/TransferTable';
import CreateTransferModal from './components/CreateTransferModal';

const TransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const { content, totalElements, totalPages, number } = await getTransfers();
      setTransfers(content);
      setTotalTransfers(totalElements);
      setTotalPages(totalPages);
      setCurrentPage(number);
      setError(null);
    } catch (err) {
      setError('Failed to fetch transfers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleCreateTransferSuccess = () => {
    fetchTransfers();
    setIsCreateModalOpen(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Transfers</h1>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
        >
          Create Transfer
        </button>
      </div>

      {loading && <div>Loading transfers...</div>}
      {error && <div className="text-red-500">{error}</div>}
      
      {!loading && !error && (
        <TransferTable 
          transfers={transfers} 
          totalTransfers={totalTransfers}
          totalPages={totalPages}
          currentPage={currentPage}
          onRefresh={fetchTransfers}
        />
      )}

      {isCreateModalOpen && (
        <CreateTransferModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateTransferSuccess}
        />
      )}
    </div>
  );
};

export default withAuth(TransfersPage);
