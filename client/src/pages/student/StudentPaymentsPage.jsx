import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services';
import { Receipt, CheckCircle2, AlertCircle, Clock, ShieldCheck, Download } from 'lucide-react';

export const StudentPaymentsPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await paymentService.getMyPaymentHistory();
        if (res.success && res.data) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
          Payment History & Invoices
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review your verified Razorpay transactions, receipts, and order summaries.
        </p>
      </div>

      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading payment history...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                  <th className="p-4 font-bold">Receipt / Order Ref</th>
                  <th className="p-4 font-bold">Item Description</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Amount</th>
                  <th className="p-4 font-bold">Payment Status</th>
                  <th className="p-4 font-bold">Gateway Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-[#12356B]">
                      {order.receiptNumber || order.razorpayOrderId}
                    </td>
                    <td className="p-4 font-bold text-[#12356B]">
                      {order.itemId?.title || `${order.itemType} Enrolment`}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-black text-[#12356B]">
                      ₹{order.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                        order.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-500">
                      {order.paymentId?.razorpayPaymentId || (order.status === 'PAID' ? 'Verified' : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-[#12356B]">No Transactions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not made any purchases yet. Your verified receipts will appear here.
          </p>
        </div>
      )}
      </div>
    </div>
  );
};
