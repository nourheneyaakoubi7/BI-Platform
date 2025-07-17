const jwt = require('jsonwebtoken');

// Générer un token JWT
const generateToken = (userId) => {
  const payload = { userId };
  const secretKey = process.env.JWT_SECRET;
  
  return jwt.sign(payload, secretKey);  
};


// Vérifier un token JWT
const verifyToken = (token) => {
  const secretKey = process.env.JWT_SECRET;
  
  try {
    const decoded = jwt.verify(token, secretKey);
    return decoded;
  } catch (err) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
