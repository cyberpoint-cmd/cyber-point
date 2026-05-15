const fs = require("fs");
const path = require("path");

const adminFilePath =
    path.join(__dirname, "../data/admin.json");

/* READ ADMIN */

function readAdmin() {

    try {

        if (!fs.existsSync(adminFilePath)) {

            fs.writeFileSync(
                adminFilePath,
                JSON.stringify({
                    username: "cyberpointadmin",
                    password: "cyber14022006"
                }, null, 2)
            );

        }

        const data =
            fs.readFileSync(adminFilePath, "utf8");

        return JSON.parse(data);

    } catch (error) {

        console.log(error);

        return {
            username: "cyberpointadmin",
            password: "cyber14022006"
        };

    }

}

/* WRITE ADMIN */

function writeAdmin(data) {

    fs.writeFileSync(
        adminFilePath,
        JSON.stringify(data, null, 2)
    );

}

module.exports = {
    readAdmin,
    writeAdmin
};