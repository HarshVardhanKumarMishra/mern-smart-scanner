// @desc    Check server health
// @route   GET /api/health
// @access  Public
const getHealth = (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Server is healthy and running',
    timestamp: new Date().toISOString()
  });
};

module.exports = { getHealth };