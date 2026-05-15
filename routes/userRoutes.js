const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.render("user/index");
});

router.get("/aadhar-update", (req, res) => {
    res.render("user/aadhar-update");
});

router.get("/new-pan", (req, res) => {
    res.render("user/new-pan");
});

router.get("/pan-correction", (req, res) => {
    res.render("user/pan-correction");
});

module.exports = router;