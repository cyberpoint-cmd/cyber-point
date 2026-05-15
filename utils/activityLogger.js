const fs = require("fs");
const path = require("path");

const logFilePath =
    path.join(__dirname, "../data/activity-logs.json");

/* READ LOGS */

function readLogs() {

    try {

        if (!fs.existsSync(logFilePath)) {

            fs.writeFileSync(
                logFilePath,
                JSON.stringify([], null, 2)
            );

        }

        const data =
            fs.readFileSync(logFilePath, "utf8");

        return JSON.parse(data);

    } catch (error) {

        console.log(error);

        return [];

    }

}

/* WRITE LOGS */

function writeLogs(data) {

    fs.writeFileSync(
        logFilePath,
        JSON.stringify(data, null, 2)
    );

}

/* ADD LOG */

function addLog(admin, action) {

    const logs = readLogs();

    logs.unshift({

        admin,
        action,

        time:
            new Date().toLocaleString()

    });

    writeLogs(logs);

}

module.exports = {
    readLogs,
    writeLogs,
    addLog
};