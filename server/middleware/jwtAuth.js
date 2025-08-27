import jwt from 'jsonwebtoken';

export const  authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer TOKEN"

  // console.log("Token : " , token)  
  if (!token) return res.status(401).json({ message: "Access denied, token missing!" });

  jwt.verify(token, process.env.JWT_SECRET || "your_default_secret", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token!" });
    req.user = user;
    next();
  });
};
