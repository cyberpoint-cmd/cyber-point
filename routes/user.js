const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const {
    generateToken,
    generateReceiptNumber
} = require("../utils/generateToken");

const {
    readApplications,
    writeApplications
} = require("../utils/jsonDatabase");

const {
    readSettings
} = require("../utils/settingsDatabase");

/* FILE UPLOAD SETUP */

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "public/uploads/documents");
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + file.originalname;

        cb(null, uniqueName);
    }

});

const fileFilter = (req, file, cb) => {

    const allowedTypes = /jpg|jpeg|png|pdf/;

    const extName =
        allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

    if (extName) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG PNG PDF allowed"));
    }

};

const upload = multer({
    storage,
    fileFilter
});

/* HOME */

router.get("/", (req, res) => {

    const settings =
        readSettings();

    res.render("index", {
        settings
    });

});

/* SERVICES PAGE */

router.get("/services", (req, res) => {

    const settings =
        readSettings();

    res.render("services", {
        settings
    });

});

/* STATUS CHECK PAGE */

router.get("/status-check", (req, res) => {

    const settings =
        readSettings();

    res.render("user/status-check", {
        application: null,
        settings
    });

});

/* STATUS CHECK POST */

router.post("/status-check", (req, res) => {

    const applications =
        readApplications();

    const settings =
        readSettings();

    const token =
        req.body.tokenNumber;

    const application =
        applications.find((app) => {
            return app.tokenNumber === token;
        });

    res.render("user/status-check", {
        application,
        settings
    });

});

/* RECEIPT */

router.get("/receipt/:token", (req, res) => {

    const applications =
        readApplications();

    const settings =
        readSettings();

    const token =
        req.params.token;

    const application =
        applications.find((app) => {
            return app.tokenNumber === token;
        });

    if (!application) {
        return res.send("Receipt Not Found");
    }

    res.render("user/receipt", {
        application,
        settings
    });

});

/* AADHAR PAGE */

router.get("/aadhar-update", (req, res) => {

    const settings =
        readSettings();

    res.render("user/aadhar-update", {
        settings
    });

});

/* NEW PAN PAGE */

router.get("/new-pan", (req, res) => {

    const settings =
        readSettings();

    res.render("user/new-pan", {
        settings
    });

});

/* PAN CORRECTION PAGE */

router.get("/pan-correction", (req, res) => {

    const settings =
        readSettings();

    res.render("user/pan-correction", {
        settings
    });

});

/* SAVE AADHAR BASIC */

router.post("/save-aadhar-basic", (req, res) => {

    try {

        const settings =
            readSettings();

        const applications =
            readApplications();

        const token =
            generateToken(applications);

        const receiptNumber =
            generateReceiptNumber(token);

        const newApplication = {

            tokenNumber:
                token,

            receiptNumber:
                receiptNumber,

            serviceType:
                "Aadhar Update",

            applicantName:
                req.body.applicantName,

            phoneNumber:
                req.body.phoneNumber,

            applicantAadhar:
                req.body.applicantAadhar,

            relationAadhar:
                req.body.relationAadhar,

            applicantOtp:
                "",

            relationOtp:
                "",

            amount:
                settings.prices &&
                settings.prices.aadharUpdate
                    ? settings.prices.aadharUpdate
                    : 300,

            utrNumber:
                "",

            status:
                "OTP Pending",

            otpStage:
                "Applicant OTP Pending",

            receivingPdf:
                "",

            documents:
                {},

            createdAt:
                new Date()

        };

        applications.push(newApplication);

        writeApplications(applications);

        res.json({
            success: true,
            token,
            receiptNumber
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false
        });

    }

});

/* COMPLETE AADHAR */

router.post("/complete-aadhar", (req, res) => {

    try {

        const applications =
            readApplications();

        const token =
            req.body.tokenNumber;

        const applicationIndex =
            applications.findIndex((app) => {
                return app.tokenNumber === token;
            });

        if (applicationIndex === -1) {
            return res.send("Invalid Token");
        }

        applications[applicationIndex].applicantOtp =
            req.body.applicantOtp;

        applications[applicationIndex].relationOtp =
            req.body.relationOtp;

        applications[applicationIndex].utrNumber =
            req.body.utrNumber;

        applications[applicationIndex].status =
            "Pending";

        applications[applicationIndex].otpStage =
            "OTP Submitted";

        writeApplications(applications);

        res.redirect("/receipt/" + token);

    } catch (error) {

        console.log(error);

        res.send("Aadhar Complete Failed");

    }

});

/* SAVE NEW PAN */

router.post(
    "/save-new-pan",

    upload.fields([
        { name: "aadharFront", maxCount: 1 },
        { name: "aadharBack", maxCount: 1 },
        { name: "otherDocumentFile", maxCount: 1 },
        { name: "photo", maxCount: 1 }
    ]),

    (req, res) => {

        try {

            const settings =
                readSettings();

            const applications =
                readApplications();

            const token =
                generateToken(applications);

            const receiptNumber =
                generateReceiptNumber(token);

            const newApplication = {

                tokenNumber:
                    token,

                receiptNumber:
                    receiptNumber,

                serviceType:
                    "New PAN",

                applicantName:
                    req.body.applicantName,

                fatherName:
                    req.body.fatherName,

                motherName:
                    req.body.motherName,

                phoneNumber:
                    req.body.phoneNumber,

                address: {

                    ghar:
                        req.body.ghar,

                    wardNo:
                        req.body.wardNo,

                    thana:
                        req.body.thana,

                    district:
                        req.body.district,

                    state:
                        req.body.state

                },

                otherDocumentType:
                    req.body.otherDocumentType,

                amount:
                    settings.prices &&
                    settings.prices.newPan
                        ? settings.prices.newPan
                        : 200,

                utrNumber:
                    req.body.utrNumber,

                status:
                    "Pending",

                receivingPdf:
                    "",

                documents: {

                    aadharFront:
                        req.files &&
                        req.files.aadharFront
                            ? "/uploads/documents/" +
                              req.files.aadharFront[0].filename
                            : "",

                    aadharBack:
                        req.files &&
                        req.files.aadharBack
                            ? "/uploads/documents/" +
                              req.files.aadharBack[0].filename
                            : "",

                    otherDocumentFile:
                        req.files &&
                        req.files.otherDocumentFile
                            ? "/uploads/documents/" +
                              req.files.otherDocumentFile[0].filename
                            : "",

                    photo:
                        req.files &&
                        req.files.photo
                            ? "/uploads/documents/" +
                              req.files.photo[0].filename
                            : ""

                },

                createdAt:
                    new Date()

            };

            applications.push(newApplication);

            writeApplications(applications);

            res.redirect("/receipt/" + token);

        } catch (error) {

            console.log(error);

            res.send("New PAN Save Failed");

        }

    }
);

/* SAVE PAN CORRECTION */

router.post(
    "/save-pan-correction",

    upload.fields([
        { name: "panCardFile", maxCount: 1 },
        { name: "aadharFront", maxCount: 1 },
        { name: "aadharBack", maxCount: 1 },
        { name: "otherDocumentFile", maxCount: 1 },
        { name: "photo", maxCount: 1 }
    ]),

    (req, res) => {

        try {

            const settings =
                readSettings();

            const applications =
                readApplications();

            const token =
                generateToken(applications);

            const receiptNumber =
                generateReceiptNumber(token);

            const newApplication = {

                tokenNumber:
                    token,

                receiptNumber:
                    receiptNumber,

                serviceType:
                    "PAN Correction",

                applicantName:
                    req.body.applicantName,

                fatherName:
                    req.body.fatherName,

                motherName:
                    req.body.motherName,

                phoneNumber:
                    req.body.phoneNumber,

                panNumber:
                    req.body.panNumber,

                address: {

                    ghar:
                        req.body.ghar,

                    wardNo:
                        req.body.wardNo,

                    thana:
                        req.body.thana,

                    district:
                        req.body.district,

                    state:
                        req.body.state

                },

                otherDocumentType:
                    req.body.otherDocumentType,

                amount:
                    settings.prices &&
                    settings.prices.panCorrection
                        ? settings.prices.panCorrection
                        : 200,

                utrNumber:
                    req.body.utrNumber,

                status:
                    "Pending",

                receivingPdf:
                    "",

                documents: {

                    panCardFile:
                        req.files &&
                        req.files.panCardFile
                            ? "/uploads/documents/" +
                              req.files.panCardFile[0].filename
                            : "",

                    aadharFront:
                        req.files &&
                        req.files.aadharFront
                            ? "/uploads/documents/" +
                              req.files.aadharFront[0].filename
                            : "",

                    aadharBack:
                        req.files &&
                        req.files.aadharBack
                            ? "/uploads/documents/" +
                              req.files.aadharBack[0].filename
                            : "",

                    otherDocumentFile:
                        req.files &&
                        req.files.otherDocumentFile
                            ? "/uploads/documents/" +
                              req.files.otherDocumentFile[0].filename
                            : "",

                    photo:
                        req.files &&
                        req.files.photo
                            ? "/uploads/documents/" +
                              req.files.photo[0].filename
                            : ""

                },

                createdAt:
                    new Date()

            };

            applications.push(newApplication);

            writeApplications(applications);

            res.redirect("/receipt/" + token);

        } catch (error) {

            console.log(error);

            res.send("PAN Correction Save Failed");

        }

    }
);

module.exports = router;