const { tableLayouts } = require("pdfmake/build/pdfmake");

const {
    capitalize,
    capitalizeWords,
} = require("../../helperFunctions/helpers");
const styles = require("../styles/pdfDocStyles");
let mechanicName = "";

function createHotPlateInspectionDefintion(user, agencyDetails) {
    let {
        docDate,
        fName,
        lName,
        hName,
        roadName,
        cityTownVillage,
        districtName,
        pinCode,
        poaText,
        poANo,
        mobNo,
    } = { ...user };
    fName = capitalizeWords(fName || "");
    lName = capitalizeWords(lName || "");
    let custName = `${fName}`.trim() + ` ` + `${lName}`;

    hName = capitalizeWords(hName || "").trim();
    roadName = capitalizeWords(roadName || "").trim();
    cityTownVillage = capitalizeWords(cityTownVillage || "").trim();
    districtName = capitalizeWords(districtName || "").trim();
    let address = [hName, roadName, cityTownVillage, districtName, pinCode]
        .filter((item) => item)
        .join(",\n");

    const agencyName = agencyDetails?.name ? agencyDetails.name.toUpperCase() : "AGENCY NAME";
    // Format agency address. Assuming agencyDetails.address is a string or array of strings.
    // Ideally the controller should pass pre-formatted address lines, but let's handle simple string or object.
    // If it's the raw object from DB, we format it here.
    let agencyAddressLines = [];
    // console.log("agencyDetails: ", agencyDetails);
    if (agencyDetails?.formattedAddress) {
        agencyAddressLines = agencyDetails.formattedAddress.split('\n');
    } else {
        agencyAddressLines = ["Address Line 1", "Address Line 2", "City - Pincode"];
    }

    const hotPlateInspectionDocDef = [
        {
            text: agencyName,
            fontSize: 15,
            bold: true,
            alignment: "center",
        },
        ...agencyAddressLines.map((line, index) => ({
            text: line,
            bold: true,
            alignment: "center",
            fontSize: 10,
            margin: index === agencyAddressLines.length - 1 ? [0, 0, 0, 30] : [0, 0, 0, 0]
        })),
        {
            text: "HOT PLATE INSPECTION REPORT",
            decoration: "underline",
            fontSize: 12,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 20],
        },
        {
            text: [
                "Since you have instructed us to check up your hot-plate for availing new Domestic",
                " LPG connection, we are deputing our mechanic to inspect your hot-plate at your premises",
                " and do the needful.",
            ],
            margin: [0, 0, 0, 20],
            alignment: "justify",
            fontSize: 11,
        },

        // Name and address

        {
            layout: "noBorders",
            table: {
                widths: [60, "*"],
                body: [
                    [{ text: "Name", fontSize: 11 }, { text: `${custName}`, fontSize: 11 }],
                    [
                        { text: "Address", fontSize: 11 },
                        {
                            text: `${address}`,
                            fontSize: 11,
                        },
                    ],
                    [{ text: "Mobile NO:", fontSize: 11 }, { text: `${mobNo}`, fontSize: 11 }],
                ],
            },
        },
        "\n\n\n",

        // Hot plate details
        {
            table: {
                headerRows: 1,
                widths: [150, "*"],
                heights: 20,
                valign: "middle",
                alignment: "center",
                body: [
                    [
                        {
                            text: "HOT PLATE DETAILS",
                            bold: true,
                            alignment: "center",
                            colSpan: 2,
                            margin: [0, 5],
                            fontSize: 11,
                        },
                        {},
                    ],
                    [{ text: "MAKE", alignment: "center", margin: [0, 5], fontSize: 11 }, " "],
                    [{ text: "BATCH NO", alignment: "center", margin: [0, 5], fontSize: 11 }, ""],
                ],
            },
        },
        "\n\n\n",
        //Cylinders and PRs found
        {
            table: {
                widths: [120, 120, 120, 120],
                headerRows: 2,
                margin: [0, 5],
                body: [
                    [
                        {
                            text: "At the time of Inspection, any OMC Cylinders found in Customer Premises, Please Note",
                            alignment: "center",
                            colSpan: 4,
                            margin: [0, 5],
                            fontSize: 11,
                        },
                        {},
                        {},
                        {},
                    ],
                    [
                        { text: "IOC", alignment: "center", fontSize: 11 },
                        { text: "BPC", alignment: "center", fontSize: 11 },
                        { text: "HPC", alignment: "center", fontSize: 11 },
                        { text: "Others", alignment: "center", fontSize: 11 },
                    ],
                    [
                        { text: "Cylinders SR Nos: ", colSpan: 2, margin: [0, 5], fontSize: 11 },
                        {},
                        { text: "PR Serial No: ", colSpan: 2, margin: [0, 5], fontSize: 11 },
                        {},
                    ],
                ],
            },
        },

        //Declaration
        {
            margin: [0, 10],
            text: "I hereby declare that whatever has been stated above is true to the best of my knowledge, correct and nothing is concealed there from.",
            fontSize: 11,
        },
        //Mechanic Name
        {
            margin: [0, 10],
            text: `Mechanic Name: ${mechanicName}`,
            fontSize: 11,
        },
        `\n`,
        { text: "Signature of Mechanic: ", fontSize: 11 },
        "\n\n",
        // Signature

        {
            layout: "noBorders",
            table: {
                widths: [40, "*", "*", 200],
                margin: [0, 5],
                heights: 20,
                body: [
                    [
                        { text: "Place: ", fontSize: 11 },
                        { text: `${cityTownVillage}`, fontSize: 11 },
                        {},
                        {
                            text: "Signature of the Customer",
                            alignment: "center",
                            fontSize: 11,
                        },
                    ],
                    [
                        { text: "Date: ", fontSize: 11 },
                        { text: `${docDate}`, fontSize: 11 },
                        {},
                        {
                            text: `${custName}`,
                            alignment: "center",
                            fontSize: 11,
                        },
                    ],
                ],
            },
        },
    ];
    return hotPlateInspectionDocDef;
}

module.exports = createHotPlateInspectionDefintion;
