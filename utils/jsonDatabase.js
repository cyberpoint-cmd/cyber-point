const fs = require("fs");
const path = require("path");

const databasePath = path.join(__dirname, "../data/applications.json");

const readApplications = () => {

    try {

        if (!fs.existsSync(databasePath)) {
            fs.writeFileSync(databasePath, JSON.stringify([], null, 4));
        }

        const data = fs.readFileSync(databasePath, "utf-8");

        if (!data) {
            return [];
        }

        return JSON.parse(data);

    } catch (error) {

        console.log("JSON Read Error:", error.message);

        return [];

    }

};

const writeApplications = (applications) => {

    try {

        fs.writeFileSync(
            databasePath,
            JSON.stringify(applications, null, 4)
        );

    } catch (error) {

        console.log("JSON Write Error:", error.message);

    }

};

module.exports = {
    readApplications,
    writeApplications
};