const { CognitoJwtVerifier } = require("aws-jwt-verify");

const verifier = CognitoJwtVerifier.create({
  userPoolId: "us-west-1_kUvDNO3K2", // TERA USER POOL ID
  tokenUse: "id",
  clientId: "5fipvmst2f886tips7ft4d6t5l", // TERA CLIENT ID
});

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token");

    const payload = await verifier.verify(token);
    req.user = payload; // Ab req.user.sub mein bande ki unique ID hogi
    next();
  } catch (err) {
    console.error(" Auth failed:", err.message);
    res.status(401).json({ message: err.message });
  }
};

module.exports = authMiddleware;