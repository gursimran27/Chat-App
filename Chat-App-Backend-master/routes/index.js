const router = require("express").Router();

const authRoute = require("./auth");
const userRoute = require("./user");

router.use("/api/v1/auth", authRoute);
router.use("/api/v1/user", userRoute);

module.exports = router;