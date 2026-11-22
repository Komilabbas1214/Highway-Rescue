const Contact = require('../models/Contact');

// @desc    Submit contact enquiry
// @route   POST /api/contact
// @access  Public
const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, subject, and message.',
      });
    }

    const contact = await Contact.create({
      name,
      email: email.toLowerCase(),
      phone,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received. Our team will contact you shortly.',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contact messages (Admin)
// @route   GET /api/contact
// @access  Private (Admin)
const getAllContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact status or add admin reply
// @route   PUT /api/contact/:id
// @access  Private (Admin)
const updateContactStatus = async (req, res, next) => {
  try {
    const { status, adminReply } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }

    if (status) contact.status = status;
    if (adminReply !== undefined) contact.adminReply = adminReply;

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully.',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContact,
  getAllContacts,
  updateContactStatus,
};
