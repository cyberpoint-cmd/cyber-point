const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        tokenNumber: {
            type: String,
            required: true,
            unique: true
        },

        serviceType: {
            type: String,
            required: true
        },

        applicantName: {
            type: String,
            required: true
        },

        phoneNumber: {
            type: String,
            required: true
        },

        fatherName: {
            type: String,
            default: ""
        },

        motherName: {
            type: String,
            default: ""
        },

        panNumber: {
            type: String,
            default: ""
        },

        applicantAadhar: {
            type: String,
            default: ""
        },

        relationAadhar: {
            type: String,
            default: ""
        },

        applicantOtp: {
            type: String,
            default: ""
        },

        relationOtp: {
            type: String,
            default: ""
        },

        address: {
            ghar: {
                type: String,
                default: ""
            },
            wardNo: {
                type: String,
                default: ""
            },
            thana: {
                type: String,
                default: ""
            },
            district: {
                type: String,
                default: ""
            },
            state: {
                type: String,
                default: ""
            }
        },

        otherDocumentType: {
            type: String,
            default: ""
        },

        amount: {
            type: Number,
            required: true
        },

        utrNumber: {
            type: String,
            required: true
        },

        status: {
            type: String,
            default: "Pending"
        },

        receivingPdf: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Application", applicationSchema);