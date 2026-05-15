const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const {
    readApplications,
    writeApplications
} = require("../utils/jsonDatabase");

const {
    readSettings,
    writeSettings
} = require("../utils/settingsDatabase");

const {
    readStaff,
    writeStaff
} = require("../utils/staffDatabase");

const {
    readLogs,
    addLog
} = require("../utils/activityLogger");

const {
    readAdmin,
    writeAdmin
} = require("../utils/adminDatabase");

const {
    readAdminProfile,
    writeAdminProfile
} = require("../utils/adminProfileDatabase");

/* SECURITY */

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 1000 * 60 * 10;

/* AUTH CHECK */

function checkAdminAuth(req, res, next) {
    if (req.session && req.session.adminLoggedIn === true) {
        return next();
    }

    return res.redirect("/admin/login");
}

/* SUPER ADMIN CHECK */

function checkSuperAdmin(req, res, next) {
    if (
        req.session &&
        req.session.adminLoggedIn === true &&
        req.session.adminRole === "superadmin"
    ) {
        return next();
    }

    return res.send("Access Denied");
}

/* LOGIN LOCK */

function isLoginLocked(req) {
    if (!req.session.loginLockUntil) {
        return false;
    }

    if (Date.now() > req.session.loginLockUntil) {
        req.session.loginAttempts = 0;
        req.session.loginLockUntil = null;
        return false;
    }

    return true;
}

/* FILE UPLOAD */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads");
    },

    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage
});

/* LOGIN PAGE */

router.get("/login", (req, res) => {
    if (req.session && req.session.adminLoggedIn === true) {
        return res.redirect("/admin/dashboard");
    }

    res.render("admin/login", {
        error: null
    });
});

/* LOGIN POST */

router.post("/login", (req, res) => {
    if (isLoginLocked(req)) {
        return res.render("admin/login", {
            error: "Too many wrong attempts. Please try again after 10 minutes."
        });
    }

    const username = req.body.username;
    const password = req.body.password;

    const admin = readAdmin();

    if (
        username === admin.username &&
        password === admin.password
    ) {
        req.session.adminLoggedIn = true;
        req.session.adminRole = "superadmin";
        req.session.adminUsername = username;
        req.session.loginAttempts = 0;
        req.session.loginLockUntil = null;

        addLog(username, "Super Admin Logged In");

        return req.session.save((err) => {
            if (err) {
                console.log(err);
                return res.send("Session save failed");
            }

            return res.redirect("/admin/dashboard");
        });
    }

    const staffUsers = readStaff();

    const matchedStaff = staffUsers.find((staff) => {
        return (
            staff.username === username &&
            staff.password === password
        );
    });

    if (matchedStaff) {
        req.session.adminLoggedIn = true;
        req.session.adminRole = matchedStaff.role || "staff";
        req.session.adminUsername = matchedStaff.username;
        req.session.loginAttempts = 0;
        req.session.loginLockUntil = null;

        addLog(matchedStaff.username, "Staff Logged In");

        return req.session.save((err) => {
            if (err) {
                console.log(err);
                return res.send("Session save failed");
            }

            return res.redirect("/admin/dashboard");
        });
    }

    req.session.loginAttempts = (req.session.loginAttempts || 0) + 1;

    if (req.session.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        req.session.loginLockUntil = Date.now() + LOCK_TIME;

        return res.render("admin/login", {
            error: "Too many wrong attempts. Login locked for 10 minutes."
        });
    }

    const attemptsLeft = MAX_LOGIN_ATTEMPTS - req.session.loginAttempts;

    return res.render("admin/login", {
        error: `Invalid username or password. Attempts left: ${attemptsLeft}`
    });
});

/* LOGOUT */

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("cyberpoint.sid");
        return res.redirect("/admin/login");
    });
});

/* DASHBOARD */

router.get("/dashboard", checkAdminAuth, (req, res) => {
    const applications = readApplications();

    const totalApplications = applications.length;

    const pendingApplications = applications.filter((app) => {
        return app.status === "Pending";
    }).length;

    const processingApplications = applications.filter((app) => {
        return app.status === "Processing";
    }).length;

    const completedApplications = applications.filter((app) => {
        return app.status === "Completed";
    }).length;

    const rejectedApplications = applications.filter((app) => {
        return app.status === "Rejected";
    }).length;

    const totalRevenue = applications.reduce((total, app) => {
        return total + Number(app.amount || 0);
    }, 0);

    const todayDate = new Date().toDateString();

    const todayApplications = applications.filter((app) => {
        if (!app.createdAt) {
            return false;
        }

        return new Date(app.createdAt).toDateString() === todayDate;
    }).length;

    const recentApplications = applications.slice(-5).reverse();

    const adminProfile = readAdminProfile();

    res.render("admin/dashboard", {
        totalApplications,
        pendingApplications,
        processingApplications,
        completedApplications,
        rejectedApplications,
        totalRevenue,
        todayApplications,
        recentApplications,
        adminProfile
    });
});

/* ADMIN PROFILE */

router.get("/profile", checkAdminAuth, (req, res) => {
    const profile = readAdminProfile();

    res.render("admin/admin-profile", {
        profile,
        success: null
    });
});

router.post(
    "/profile",
    checkAdminAuth,
    upload.single("profileImage"),
    (req, res) => {
        const profile = readAdminProfile();

        profile.name = req.body.name;
        profile.email = req.body.email;
        profile.bio = req.body.bio;

        if (req.file) {
            profile.profileImage = "/uploads/" + req.file.filename;
        }

        writeAdminProfile(profile);

        addLog(
            req.session.adminUsername,
            "Updated admin profile"
        );

        res.render("admin/admin-profile", {
            profile,
            success: "Admin profile updated successfully"
        });
    }
);

/* CHANGE PASSWORD */

router.get("/change-password", checkAdminAuth, (req, res) => {
    res.render("admin/change-password", {
        success: null,
        error: null
    });
});

router.post("/change-password", checkAdminAuth, (req, res) => {
    try {
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        const admin = readAdmin();

        if (currentPassword !== admin.password) {
            return res.render("admin/change-password", {
                success: null,
                error: "Current password incorrect"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render("admin/change-password", {
                success: null,
                error: "New passwords do not match"
            });
        }

        admin.password = newPassword;

        writeAdmin(admin);

        addLog(
            req.session.adminUsername,
            "Changed admin password"
        );

        res.render("admin/change-password", {
            success: "Password changed successfully",
            error: null
        });

    } catch (error) {
        console.log(error);

        res.render("admin/change-password", {
            success: null,
            error: "Password update failed"
        });
    }
});

/* ADVANCED SEARCH */

router.get("/advanced-search", checkAdminAuth, (req, res) => {
    const applications = readApplications();

    res.render("admin/advanced-search", {
        applications
    });
});

/* ACTIVITY LOGS */

router.get("/activity-logs", checkAdminAuth, (req, res) => {
    const logs = readLogs();

    res.render("admin/activity-logs", {
        logs
    });
});

/* STAFF MANAGEMENT */

router.get("/staff-management", checkAdminAuth, checkSuperAdmin, (req, res) => {
    const staffUsers = readStaff();

    res.render("admin/staff-management", {
        staffUsers
    });
});

router.post("/add-staff", checkAdminAuth, checkSuperAdmin, (req, res) => {
    const staffUsers = readStaff();

    const newStaff = {
        username: req.body.username,
        password: req.body.password,
        role: req.body.role || "staff"
    };

    staffUsers.push(newStaff);

    writeStaff(staffUsers);

    addLog(
        req.session.adminUsername,
        `Added new staff ${req.body.username}`
    );

    res.redirect("/admin/staff-management");
});

router.post("/delete-staff/:username", checkAdminAuth, checkSuperAdmin, (req, res) => {
    let staffUsers = readStaff();

    staffUsers = staffUsers.filter((staff) => {
        return staff.username !== req.params.username;
    });

    writeStaff(staffUsers);

    addLog(
        req.session.adminUsername,
        `Deleted staff ${req.params.username}`
    );

    res.redirect("/admin/staff-management");
});

/* OTP REQUESTS */

router.get("/otp-requests", checkAdminAuth, (req, res) => {
    const applications = readApplications();

    const otpRequests = applications.filter((app) => {
        return app.serviceType === "Aadhar Update";
    });

    res.render("admin/otp-requests", {
        applications: otpRequests
    });
});

/* AADHAR APPLICATIONS */

router.get("/aadhar-applications", checkAdminAuth, (req, res) => {
    const applications = readApplications();

    const aadharApplications = applications.filter((app) => {
        return app.serviceType === "Aadhar Update";
    });

    res.render("admin/aadhar-applications", {
        applications: aadharApplications
    });
});

/* PAN APPLICATIONS */

router.get("/pan-applications", checkAdminAuth, (req, res) => {
    const applications = readApplications();

    const panApplications = applications.filter((app) => {
        return (
            app.serviceType === "New PAN" ||
            app.serviceType === "PAN Correction"
        );
    });

    res.render("admin/pan-applications", {
        applications: panApplications
    });
});

/* APPLICATION VIEW */

router.get("/application/:token", checkAdminAuth, (req, res) => {
    const applications = readApplications();

    const token = req.params.token;

    const application = applications.find((app) => {
        return app.tokenNumber === token;
    });

    if (!application) {
        return res.send("Application Not Found");
    }

    res.render("admin/application-view", {
        application
    });
});

/* STATUS UPDATE */

router.post("/update-status/:token", checkAdminAuth, (req, res) => {
    try {
        const applications = readApplications();

        const token = req.params.token;

        const applicationIndex = applications.findIndex((app) => {
            return app.tokenNumber === token;
        });

        if (applicationIndex === -1) {
            return res.send("Application Not Found");
        }

        applications[applicationIndex].status = req.body.status;

        writeApplications(applications);

        addLog(
            req.session.adminUsername,
            `Updated status of ${token} to ${req.body.status}`
        );

        res.redirect("/admin/application/" + token);

    } catch (error) {
        console.log(error);
        res.send("Status Update Failed");
    }
});

/* UPLOAD RECEIVING */

router.get("/upload-receiving", checkAdminAuth, (req, res) => {
    res.render("admin/upload-receiving");
});

router.post(
    "/upload-receiving",
    checkAdminAuth,
    upload.single("receivingPdf"),
    (req, res) => {
        try {
            const applications = readApplications();

            const token = req.body.tokenNumber;

            const applicationIndex = applications.findIndex((app) => {
                return app.tokenNumber === token;
            });

            if (applicationIndex === -1) {
                return res.send("Invalid Token");
            }

            applications[applicationIndex].status = req.body.status;

            if (req.file) {
                applications[applicationIndex].receivingPdf =
                    "/uploads/" + req.file.filename;
            }

            writeApplications(applications);

            addLog(
                req.session.adminUsername,
                `Uploaded receiving PDF for ${token}`
            );

            res.redirect("/admin/application/" + token);

        } catch (error) {
            console.log(error);
            res.send("Receiving Upload Failed");
        }
    }
);

/* BACKUP */

router.get("/backup", checkAdminAuth, (req, res) => {
    const applications = readApplications();

    const totalApplications = applications.length;

    const totalRevenue = applications.reduce((total, app) => {
        return total + Number(app.amount || 0);
    }, 0);

    res.render("admin/backup", {
        totalApplications,
        totalRevenue
    });
});

router.get("/backup/download-json", checkAdminAuth, (req, res) => {
    const filePath = path.join(__dirname, "../data/applications.json");

    res.download(
        filePath,
        "cyberpoint-applications-backup.json"
    );
});

router.get("/backup/export-csv", checkAdminAuth, (req, res) => {
    const applications = readApplications();

    let csv =
        "Token,Receipt,Service,Applicant,Phone,Amount,UTR,Status,Created At\n";

    applications.forEach((app) => {
        csv += `"${app.tokenNumber || ""}",`;
        csv += `"${app.receiptNumber || ""}",`;
        csv += `"${app.serviceType || ""}",`;
        csv += `"${app.applicantName || ""}",`;
        csv += `"${app.phoneNumber || ""}",`;
        csv += `"${app.amount || ""}",`;
        csv += `"${app.utrNumber || ""}",`;
        csv += `"${app.status || ""}",`;
        csv += `"${app.createdAt || ""}"\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("cyberpoint-applications-export.csv");
    res.send(csv);
});

/* SETTINGS */

router.get("/settings", checkAdminAuth, (req, res) => {
    const settings = readSettings();

    res.render("admin/settings", {
        settings,
        success: null
    });
});

router.post(
    "/settings/basic",
    checkAdminAuth,
    upload.single("qrImage"),
    (req, res) => {
        const settings = readSettings();

        settings.shopName = req.body.shopName;
        settings.shopAddress = req.body.shopAddress;
        settings.whatsappNumber = req.body.whatsappNumber;
        settings.paymentNumber = req.body.paymentNumber;
        settings.upiId = req.body.upiId;
        settings.noticeText = req.body.noticeText;

        settings.prices = {
            aadharUpdate: Number(req.body.aadharUpdate || 300),
            newPan: Number(req.body.newPan || 200),
            panCorrection: Number(req.body.panCorrection || 200)
        };

        if (req.file) {
            settings.qrImage = "/uploads/" + req.file.filename;
        }

        writeSettings(settings);

        addLog(
            req.session.adminUsername,
            "Updated website settings"
        );

        res.render("admin/settings", {
            settings,
            success: "Settings Updated Successfully"
        });
    }
);

router.post("/settings/add-link", checkAdminAuth, (req, res) => {
    const settings = readSettings();

    const newLink = {
        title: req.body.title,
        url: req.body.url,
        category: req.body.category || "General"
    };

    if (!settings.importantLinks) {
        settings.importantLinks = [];
    }

    settings.importantLinks.push(newLink);

    writeSettings(settings);

    addLog(
        req.session.adminUsername,
        `Added important link ${req.body.title}`
    );

    res.redirect("/admin/settings");
});

router.post("/settings/delete-link/:index", checkAdminAuth, (req, res) => {
    const settings = readSettings();

    const index = Number(req.params.index);

    if (!settings.importantLinks) {
        settings.importantLinks = [];
    }

    const deletedLink = settings.importantLinks[index];

    if (!isNaN(index)) {
        settings.importantLinks.splice(index, 1);
    }

    writeSettings(settings);

    addLog(
        req.session.adminUsername,
        `Deleted important link ${deletedLink ? deletedLink.title : index}`
    );

    res.redirect("/admin/settings");
});

/* LIVE NOTIFICATION API */

router.get("/notifications/count", checkAdminAuth, (req, res) => {
    const applications = readApplications();

    const pendingOtpRequests = applications.filter((app) => {
        return (
            app.serviceType === "Aadhar Update" &&
            app.status === "OTP Pending"
        );
    });

    const pendingApplications = applications.filter((app) => {
        return app.status === "Pending";
    });

    const processingApplications = applications.filter((app) => {
        return app.status === "Processing";
    });

    const todayDate = new Date().toDateString();

    const todayApplications = applications.filter((app) => {
        if (!app.createdAt) {
            return false;
        }

        return new Date(app.createdAt).toDateString() === todayDate;
    });

    const latestApplication =
        applications.length > 0
            ? applications[applications.length - 1]
            : null;

    const count =
        pendingOtpRequests.length +
        pendingApplications.length;

    let latestMessage = "No new request.";

    if (latestApplication) {
        latestMessage =
            `${latestApplication.serviceType || "Application"} request received from ${latestApplication.applicantName || "Customer"}`;
    }

    res.json({
        success: true,
        count,
        pendingOtp: pendingOtpRequests.length,
        pending: pendingApplications.length,
        processing: processingApplications.length,
        today: todayApplications.length,
        total: applications.length,
        latestMessage,
        latestApplication: latestApplication
            ? {
                tokenNumber: latestApplication.tokenNumber,
                receiptNumber: latestApplication.receiptNumber,
                applicantName: latestApplication.applicantName,
                phoneNumber: latestApplication.phoneNumber,
                serviceType: latestApplication.serviceType,
                status: latestApplication.status,
                createdAt: latestApplication.createdAt
            }
            : null
    });
});

module.exports = router;