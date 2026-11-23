import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const PaymentModal = ({ show, onClose, booking, onPaymentSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [simulationState, setSimulationState] = useState(null);

  if (!show || !booking) return null;

  const amount = booking.finalCost || booking.estimatedCost || 400;

  // Handle Online Payment (Razorpay Standard Checkout via backend order creation)
  const handleRazorpayPayment = async () => {
    setProcessing(true);
    try {
      // 1. Securely create Razorpay order on the Node.js backend
      // Backend validates ownership and calculates the payable amount from the server booking record
      const res = await api.post('/payments/create-order', { bookingId: booking._id });
      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to initialize payment order');
      }

      const { order, keyId, isSimulation } = res.data;

      // 2. If valid Razorpay merchant credentials are configured, launch Razorpay Standard Checkout
      if (!isSimulation && keyId && window.Razorpay) {
        const options = {
          key: keyId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Highway Rescue',
          description: `Roadside Assistance: ${booking.serviceType || 'Emergency Service'}`,
          order_id: order.id,
          handler: async function (response) {
            setProcessing(true);
            try {
              // 3. Cryptographically verify signature on the Node.js backend
              const verifyRes = await api.post('/payments/verify', {
                bookingId: booking._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data.success) {
                toast.success('🎉 Payment verified and completed successfully!');
                if (onPaymentSuccess) onPaymentSuccess(verifyRes.data.booking);
                onClose();
              }
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment signature verification failed.');
            } finally {
              setProcessing(false);
            }
          },
          prefill: {
            name: booking.customer?.name || '',
            email: booking.customer?.email || '',
            contact: booking.customer?.phone || '',
          },
          notes: {
            bookingId: booking._id,
            bookingNumber: booking.bookingId,
          },
          theme: {
            color: '#0b1e36',
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
              toast.info('Payment checkout window closed. You can retry whenever you are ready.');
            },
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on('payment.failed', async function (response) {
          setProcessing(false);
          const errorMsg = response.error?.description || response.error?.reason || 'Payment declined';
          toast.error(`Payment failed: ${errorMsg}`);
          try {
            await api.post('/payments/failed', {
              bookingId: booking._id,
              orderId: order.id,
              error: response.error,
            });
          } catch (e) {
            // Non-critical logging
          }
        });

        rzp.open();
      } else {
        // 4. Safe Test Simulation Mode (active when placeholder keys are used in development)
        // Prevents checkout.js from making unauthenticated requests that trigger Chrome's HTTP Basic Auth popup
        setSimulationState({
          order,
          amount,
        });
        setProcessing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Payment processing error');
      setProcessing(false);
    }
  };

  // Complete simulated payment in test environment
  const handleCompleteSimulation = async (simulatedSuccess = true) => {
    if (!simulationState) return;
    setProcessing(true);
    try {
      if (simulatedSuccess) {
        const verifyRes = await api.post('/payments/verify', {
          bookingId: booking._id,
          razorpay_order_id: simulationState.order.id,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'simulated_valid_signature',
        });

        if (verifyRes.data.success) {
          toast.success(`🎉 Test Payment of ₹${amount} simulated & verified successfully!`);
          if (onPaymentSuccess) onPaymentSuccess(verifyRes.data.booking);
          onClose();
        }
      } else {
        await api.post('/payments/failed', {
          bookingId: booking._id,
          orderId: simulationState.order.id,
          error: { description: 'User simulated payment decline' },
        });
        toast.warn('Simulated payment declined.');
        setSimulationState(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation error');
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
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header text-white py-3" style={{ backgroundColor: '#0b1e36' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-credit-card-2-front-fill text-warning fs-5"></i>
              <h5 className="modal-title fw-bold text-white mb-0">Service Bill & Payment</h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={processing}
            ></button>
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
                <span className="text-muted small">Assigned Technician:</span>
                <span className="text-dark">{booking.mechanic?.shopName || 'Assigned Mechanic'}</span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold text-dark">Total Amount Due:</span>
                <span className="fs-4 fw-bold text-danger">₹{amount}</span>
              </div>
            </div>

            {/* Test Simulation Notice & Actions */}
            {simulationState ? (
              <div className="card border-warning bg-warning bg-opacity-10 p-3 mb-4 rounded-3">
                <div className="d-flex align-items-start gap-2 mb-2">
                  <i className="bi bi-info-circle-fill text-warning fs-5 mt-1"></i>
                  <div>
                    <strong className="text-dark d-block">Sandbox Simulation Mode Active</strong>
                    <small className="text-muted">
                      Razorpay test credentials are in sandbox simulation mode. You can test the end-to-end verified payment workflow safely without encountering any browser authentication prompts.
                    </small>
                  </div>
                </div>
                <div className="d-flex gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-success btn-sm flex-grow-1 fw-bold"
                    disabled={processing}
                    onClick={() => handleCompleteSimulation(true)}
                  >
                    <i className="bi bi-check2-circle me-1"></i> Simulate Successful Payment (₹{amount})
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    disabled={processing}
                    onClick={() => handleCompleteSimulation(false)}
                  >
                    Simulate Failure
                  </button>
                </div>
              </div>
            ) : (
              /* Payment Method Selector */
              <div className="mb-4">
                <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                  Choose Payment Option:
                </label>
                <div className="d-flex flex-column gap-2">
                  <label
                    className={`card p-3 border rounded-3 cursor-pointer ${
                      paymentMethod === 'online' ? 'border-primary bg-primary bg-opacity-10' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
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
                          <strong className="text-dark">Online Payment (Razorpay Checkout)</strong>
                          <span className="badge bg-success">Instant & Secure</span>
                        </div>
                        <small className="text-muted d-block mt-1">
                          UPI (GPay, PhonePe, Paytm), Credit/Debit Card, Net Banking, or Wallets.
                        </small>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`card p-3 border rounded-3 cursor-pointer ${
                      paymentMethod === 'cash' ? 'border-primary bg-primary bg-opacity-10' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
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
                          Pay exact cash ₹{amount} directly to the mechanic upon service completion.
                        </small>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="alert alert-secondary small mb-0 py-2">
              <i className="bi bi-shield-lock-fill text-success me-1"></i> 256-bit SSL encrypted. 10% platform commission & verified mechanic payouts applied automatically.
            </div>
          </div>

          <div className="modal-footer bg-light">
            <button
              type="button"
              className="btn btn-secondary rounded-pill px-4"
              onClick={onClose}
              disabled={processing}
            >
              Close
            </button>
            {!simulationState && (
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
                    <i className="bi bi-check-circle-fill me-1"></i>{' '}
                    {paymentMethod === 'online' ? `Pay ₹${amount} Online` : `Confirm Cash ₹${amount}`}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
