const fs = require("fs");
const path = require("path");

const settingsPath = path.join(__dirname, "../data/settings.json");

const defaultSettings = {
    shopName: "CyberPoint",
    shopAddress: "CyberPoint Digital Seva",
    whatsappNumber: "910000000000",
    paymentNumber: "0000000000",
    upiId: "cyberpoint@upi",
    qrImage: "",
    noticeText: "Fast & Secure Digital Services",
    prices: {
        aadharUpdate: 300,
        newPan: 200,
        panCorrection: 200
    },
    importantLinks: []
};

const readSettings = () => {

    try {

        if (!fs.existsSync(settingsPath)) {
            fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 4));
        }

        const data = fs.readFileSync(settingsPath, "utf-8");

        if (!data) {
            return defaultSettings;
        }

        return JSON.parse(data);

    } catch (error) {

        console.log("Settings Read Error:", error.message);

        return defaultSettings;

    }

};

const writeSettings = (settings) => {

    try {

        fs.writeFileSync(
            settingsPath,
            JSON.stringify(settings, null, 4)
        );

    } catch (error) {

        console.log("Settings Write Error:", error.message);

    }

};

module.exports = {
    readSettings,
    writeSettings
};