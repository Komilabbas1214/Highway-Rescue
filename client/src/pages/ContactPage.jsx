import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/contact', formData);
      if (res.data.success) {
        toast.success(res.data.message || 'Thank you! Your enquiry has been received.');
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-5" style={{ backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1 rounded-pill mb-2">
            Get in Touch
          </span>
          <h1 className="fw-bold text-navy">Contact Highway Rescue</h1>
          <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Have a question, feedback, partnership proposal, or roadside support enquiry? We are here to help.
          </p>
        </div>

        <div className="row g-5">
          {/* Contact Details & Info */}
          <div className="col-lg-5">
            <div className="p-4 rounded-4 shadow-sm bg-white h-100 border">
              <h4 className="fw-bold mb-4 text-navy">Highway Control Office</h4>

              <div className="d-flex align-items-start gap-3 mb-4">
                <div className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary">
                  <i className="bi bi-geo-alt-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Ahmedabad Operations Center</h6>
                  <p className="text-muted small mb-0">
                    402, Highway Heights, Opposite Iscon Mega Mall, Sarkhej - Gandhinagar Highway, Bodakdev, Ahmedabad, Gujarat 380054
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3 mb-4">
                <div className="p-2 rounded-circle bg-success bg-opacity-10 text-success">
                  <i className="bi bi-telephone-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Support & Dispatches</h6>
                  <p className="text-muted small mb-0">
                    Phone: <a href="tel:+917926850011" className="text-dark fw-bold text-decoration-none">+91 79 2685 0011</a> <br />
                    Toll-Free Helpline: <span className="text-dark fw-bold">1800 233 4455</span>
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3 mb-4">
                <div className="p-2 rounded-circle bg-warning bg-opacity-10 text-warning">
                  <i className="bi bi-envelope-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Email Enquiries</h6>
                  <p className="text-muted small mb-0">
                    support@highwayrescue.in <br />
                    partnerships@highwayrescue.in
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-3 bg-danger bg-opacity-10 border border-danger">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                  <strong className="text-danger small">Urgent Highway Life Threat?</strong>
                </div>
                <p className="small text-muted mb-2">
                  Do not submit the contact form for live accidents or police assistance. Immediately dial India’s national emergency response:
                </p>
                <div className="d-flex gap-2">
                  <a href="tel:112" className="btn btn-danger btn-sm fw-bold flex-fill">
                    <i className="bi bi-telephone-fill me-1"></i> Call 112 (ERSS)
                  </a>
                  <a href="tel:100" className="btn btn-dark btn-sm fw-bold flex-fill">
                    <i className="bi bi-shield-fill me-1"></i> Call 100
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="col-lg-7">
            <div className="p-4 p-md-5 rounded-4 shadow-sm bg-white border">
              <h4 className="fw-bold mb-1 text-navy">Send Us a Message</h4>
              <p className="text-muted small mb-4">
                Fill in the details below. All submissions are recorded in our secure support management system.
              </p>

              {submitted && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
                  <i className="bi bi-check-circle-fill fs-4"></i>
                  <div>
                    <strong>Message Submitted Successfully!</strong>
                    <div className="small">Our highway support team will get back to you within 2-4 hours.</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Patel"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Mobile Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. +91 98250 00000"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. rahul@example.com"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Subject *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Garage Partnership Enquiry"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold small">Message Details *</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Type your message, query, or feedback here..."
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-rescue btn-lg w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill"></i> Submit Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
