const fs = require("fs");
const path = require("path");

const profileFilePath = path.join(__dirname, "../data/admin-profile.json");

const defaultProfile = {
    name: "Kaish Sir",
    email: "admin@cyberpoint.com",
    bio: "CyberPoint Admin",
    profileImage: ""
};

function readAdminProfile() {
    try {
        if (!fs.existsSync(profileFilePath)) {
            fs.writeFileSync(profileFilePath, JSON.stringify(defaultProfile, null, 2));
        }

        const data = fs.readFileSync(profileFilePath, "utf8");

        if (!data) {
            return defaultProfile;
        }

        return JSON.parse(data);

    } catch (error) {
        console.log("Admin Profile Read Error:", error.message);
        return defaultProfile;
    }
}

function writeAdminProfile(profile) {
    fs.writeFileSync(
        profileFilePath,
        JSON.stringify(profile, null, 2)
    );
}

module.exports = {
    readAdminProfile,
    writeAdminProfile
};