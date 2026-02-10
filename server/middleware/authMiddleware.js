const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // 1. Check if the "Authorization" header exists and starts with "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // 2. Get the token from the header (remove "Bearer " string)
      token = req.headers.authorization.split(" ")[1];

      // 3. Decode the token to get the User ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find the user in DB (exclude the password) and attach to request
      req.user = await User.findById(decoded.id).select("-password");

      // 5. Move to the next step
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };
