function generateToken(applications = []) {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");

    const dateCode = `${year}${month}${day}`;

    const todayApplications = applications.filter((app) => {
        return app.tokenNumber &&
               app.tokenNumber.includes(dateCode);
    });

    const serial = String(todayApplications.length + 1).padStart(4, "0");

    let token = `CP-${dateCode}-${serial}`;

    const tokenExists = applications.find((app) => {
        return app.tokenNumber === token;
    });

    if (tokenExists) {
        token = `CP-${dateCode}-${Date.now()}`;
    }

    return token;

}

function generateReceiptNumber(token) {

    const now = new Date();

    const year = now.getFullYear();

    return `RCPT-${year}-${token}`;

}

module.exports = {
    generateToken,
    generateReceiptNumber
};