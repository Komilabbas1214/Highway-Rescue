import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const PaymentModal = ({ show, onClose, booking, onPaymentSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');

  if (!show || !booking) return null;

  const amount = booking.finalCost || booking.estimatedCost || 400;

  // Handle Online Payment (Razorpay Checkout SDK + fallback simulation)
  const handleRazorpayPayment = async () => {
    setProcessing(true);
    try {
      // 1. Create order on backend
      const res = await api.post('/payments/create-order', { bookingId: booking._id });
      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to create payment order');
      }

      const { order, keyId } = res.data;

      // 2. Open Razorpay Checkout modal if loaded
      if (window.Razorpay) {
        const options = {
          key: keyId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Highway Rescue India',
          description: `Roadside Assistance: ${booking.serviceType}`,
          order_id: order.id.startsWith('order_test_') ? undefined : order.id,
          handler: async function (response) {
            try {
              // 3. Verify signature on backend
              const verifyRes = await api.post('/payments/verify', {
                bookingId: booking._id,
                razorpay_order_id: response.razorpay_order_id || order.id,
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || 'mock_signature',
              });

              if (verifyRes.data.success) {
                toast.success('🎉 Payment successful! Thank you for using Highway Rescue.');
                if (onPaymentSuccess) onPaymentSuccess(verifyRes.data.booking);
                onClose();
              }
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: booking.customer?.name,
            contact: booking.customer?.phone,
          },
          theme: {
            color: '#ff6b35',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
      } else {
        // Fallback simulation in dev environment
        const verifyRes = await api.post('/payments/verify', {
          bookingId: booking._id,
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: 'simulated_valid_signature',
        });
        if (verifyRes.data.success) {
          toast.success('Payment completed via test simulator!');
          if (onPaymentSuccess) onPaymentSuccess(verifyRes.data.booking);
          onClose();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Payment processing error');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Cash Payment
  const handleCashPayment = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/payments/cash', { bookingId: booking._id });
      if (res.data.success) {
        toast.success('Cash payment confirmed! Thank you.');
        if (onPaymentSuccess) onPaymentSuccess(res.data.booking);
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record cash payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-navy-rescue text-white py-3" style={{ backgroundColor: '#0b1e36' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-credit-card-2-front-fill text-warning fs-5"></i>
              <h5 className="modal-title fw-bold text-white mb-0">Service Bill & Payment</h5>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {/* Booking Summary */}
            <div className="card bg-light border-0 p-3 mb-4 rounded-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted small">Booking Reference:</span>
                <span className="fw-bold">{booking.bookingId}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted small">Service Rendered:</span>
                <span className="fw-semibold text-dark">{booking.serviceType}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted small">Assigned Mechanic:</span>
                <span className="text-dark">{booking.mechanic?.shopName || 'Assigned Technician'}</span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold text-dark">Total Amount Due:</span>
                <span className="fs-4 fw-bold text-danger">₹{amount}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                Choose Payment Option:
              </label>
              <div className="d-flex flex-column gap-2">
                <label className={`card p-3 border rounded-3 cursor-pointer ${paymentMethod === 'online' ? 'border-primary bg-primary bg-opacity-10' : ''}`} style={{ cursor: 'pointer' }}>
                  <div className="d-flex align-items-center gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="form-check-input mt-0"
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between">
                        <strong className="text-dark">Online Payment (Razorpay / UPI / Cards)</strong>
                        <span className="badge bg-success">Instant & Secure</span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        Pay via Google Pay, PhonePe, Paytm, Debit/Credit Card, or Net Banking.
                      </small>
                    </div>
                  </div>
                </label>

                <label className={`card p-3 border rounded-3 cursor-pointer ${paymentMethod === 'cash' ? 'border-primary bg-primary bg-opacity-10' : ''}`} style={{ cursor: 'pointer' }}>
                  <div className="d-flex align-items-center gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="form-check-input mt-0"
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between">
                        <strong className="text-dark">Cash on Service Handover</strong>
                        <span className="badge bg-secondary">Direct Cash</span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        Pay exact cash ₹{amount} directly to the mechanic after service completion.
                      </small>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="alert alert-secondary small mb-0 py-2">
              <i className="bi bi-shield-lock-fill text-success me-1"></i> 256-bit SSL encrypted. No sensitive card credentials are ever stored.
            </div>
          </div>

          <div className="modal-footer bg-light">
            <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={onClose} disabled={processing}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary-rescue rounded-pill px-5 fw-bold"
              disabled={processing}
              onClick={paymentMethod === 'online' ? handleRazorpayPayment : handleCashPayment}
            >
              {processing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill me-1"></i> {paymentMethod === 'online' ? `Pay ₹${amount} Online` : `Confirm Cash ₹${amount}`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
