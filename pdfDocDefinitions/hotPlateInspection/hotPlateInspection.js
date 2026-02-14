const { tableLayouts } = require("pdfmake/build/pdfmake");

const {
    capitalize,
    capitalizeWords,
} = require("../../helperFunctions/helpers");
const styles = require("../styles/pdfDocStyles");

function createHotPlateInspectionDefintion(user) {
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

    const hotPlateInspectionDocDef = [
        {
            text: "KUMILY INDANE SERVICES",
            fontSize: 15,
            bold: true,
            alignment: "center",
        },
        {
            text: "KPII, 1137A, Kollampattada",
            bold: true,
            alignment: "center",
            fontSize: 10,
        },
        {
            text: "Kumily",
            bold: true,
            alignment: "center",
            fontSize: 10,
        },
        {
            text: "Idukki - 685509",
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 30],
            fontSize: 10,
        },
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
            fontSize: 10,
        },

        // Name and address

        {
            layout: "noBorders",
            table: {
                widths: [60, "*"],
                body: [
                    [{ text: "Name", fontSize: 10 }, { text: `${custName}`, fontSize: 10 }],
                    [
                        { text: "Address", fontSize: 10 },
                        {
                            text: `${address}`,
                            fontSize: 10,
                        },
                    ],
                    [{ text: "Mobile NO:", fontSize: 10 }, { text: `${mobNo}`, fontSize: 10 }],
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
                            fontSize: 10,
                        },
                        {},
                    ],
                    [{ text: "MAKE", alignment: "center", margin: [0, 5], fontSize: 10 }, " "],
                    [{ text: "BATCH NO", alignment: "center", margin: [0, 5], fontSize: 10 }, ""],
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
                            fontSize: 10,
                        },
                        {},
                        {},
                        {},
                    ],
                    [
                        { text: "IOC", alignment: "center", fontSize: 10 },
                        { text: "BPC", alignment: "center", fontSize: 10 },
                        { text: "HPC", alignment: "center", fontSize: 10 },
                        { text: "Others", alignment: "center", fontSize: 10 },
                    ],
                    [
                        { text: "Cylinders SR Nos: ", colSpan: 2, margin: [0, 5], fontSize: 10 },
                        {},
                        { text: "PR Serial No: ", colSpan: 2, margin: [0, 5], fontSize: 10 },
                        {},
                    ],
                ],
            },
        },

        //Declaration
        {
            margin: [0, 10],
            text: "I hereby declare that whatever has been stated above is true to the best of my knowledge, correct and nothing is concealed there from.",
            fontSize: 10,
        },
        //Mechanic Name
        {
            margin: [0, 10],
            text: "Mechanic Name:    Vishak",
            fontSize: 10,
        },
        `\n`,
        { text: "Signature of Mechanic: ", fontSize: 10 },
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
                        { text: "Place: ", fontSize: 10 },
                        { text: `${cityTownVillage}`, fontSize: 10 },
                        {},
                        {
                            text: "Signature of the Customer",
                            alignment: "center",
                            fontSize: 10,
                        },
                    ],
                    [
                        { text: "Date: ", fontSize: 10 },
                        { text: `${docDate}`, fontSize: 10 },
                        {},
                        {
                            text: `${custName}`,
                            alignment: "center",
                            fontSize: 10,
                        },
                    ],
                ],
            },
        },
    ];
    return hotPlateInspectionDocDef;
}

module.exports = createHotPlateInspectionDefintion;
