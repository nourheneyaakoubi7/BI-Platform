const User = require('../auth/auth.model'); 

// GET: Get logged-in user's profile
async function getProfile(req, res) {
  try {
    const user = req.user; 
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// PUT: Update user's profile (username, birthday, phone, address, sex, and photo)
async function updateProfile(req, res) {
  try {
    const userId = req.user._id;
    const { username, birthday, phone, address, sex, photo } = req.body;

    console.log(req.body);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, birthday, phone, address, sex, photo },
      { new: true } 
    );

    res.status(200).json(updatedUser); 
  } catch (error) {
    res.status(400).json({ error: error.message }); 
  }
}

module.exports = { getProfile, updateProfile };
