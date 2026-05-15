const fs = require("fs");
const path = require("path");

const staffFilePath =
    path.join(__dirname, "../data/staff.json");

/* READ STAFF */

function readStaff() {

    try {

        if (!fs.existsSync(staffFilePath)) {

            fs.writeFileSync(
                staffFilePath,
                JSON.stringify([], null, 2)
            );

        }

        const data =
            fs.readFileSync(staffFilePath, "utf8");

        return JSON.parse(data);

    } catch (error) {

        console.log(error);

        return [];

    }

}

/* WRITE STAFF */

function writeStaff(data) {

    fs.writeFileSync(
        staffFilePath,
        JSON.stringify(data, null, 2)
    );

}

module.exports = {
    readStaff,
    writeStaff
};