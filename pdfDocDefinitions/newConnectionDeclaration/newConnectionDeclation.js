
const {
    capitalizeWords,
    formatAddressComma,
    formatAddressSlash,
    convertToDDMMYYYY,
} = require('../../helperFunctions/helpers');
function ncDeclaration(user, agencyDetails) {

    let {
        fatherOrSpouseName,
        fName,
        lName,

        hName,

        hNo,
        wardNo,
        landMark,
        roadName,
        cityTownVillage,
        districtName,
        stateName,
        pinCode,
        dob,
        age,
        docDate,

        rationCardNo,
    } = { ...user };

    //Capitalize the firsr character of each words
    rationCardNo =
        rationCardNo.trim() == "" ? "_______________________" : rationCardNo;
    fName = capitalizeWords(fName).trim();
    lName = capitalizeWords(lName).trim();
    hNo = capitalizeWords(hNo).trim();
    wardNo = capitalizeWords(wardNo).trim();
    let custName = `${fName}` + ` ` + `${lName}`;
    hName = capitalizeWords(hName).trim();
    roadName = capitalizeWords(roadName).trim();
    landMark = capitalizeWords(landMark).trim();
    cityTownVillage = capitalizeWords(cityTownVillage).trim();
    districtName = capitalizeWords(districtName).trim();
    stateName = capitalizeWords(stateName).trim();
    fatherOrSpouseName = capitalizeWords(fatherOrSpouseName);
    let hDetails = formatAddressSlash(hNo, wardNo);
    hDetails = formatAddressComma(
        hName,
        hDetails,
        roadName,
        landMark,
        cityTownVillage,
        districtName,
        pinCode
    );
    dob = convertToDDMMYYYY(dob);

    const agencyName = agencyDetails?.name ? agencyDetails.name.toUpperCase() : "AGENCY NAME";
    const ncDocDefinition = [
        //main sub heading
        {
            text: "(To be submitted by person desirous of New LPG Connection or connection against Termination Voucher)",
            fontSize: 9,
            bold: true,
            alignment: "center",
        },
        //Declaration
        {
            text: "DECLARATION",
            fontSize: 12,
            bold: true,
            decoration: "underline",
            alignment: "center",
            margin: [0, 5, 0, 5],
        },
        //First para
        {
            text: [
                { text: "   I, ", margin: [10, 8, 0, 0] },
                { text: `${fName.trim()} `, bold: true },
                { text: `${lName.trim()} `, bold: true },
                `son/ daughter/ wife/ widow of Shri `,
                { text: `${fatherOrSpouseName.trim()}`, bold: true },
                ` aged`,
                { text: ` ${age}`, bold: true },
                ` years`,
                { text: ` ${hDetails.trim()} `, bold: true },
                `desire to take domestic LPG connection in my name and affirm as under:-`,
            ],
            alignment: "justify",
            italics: true,
            fontSize: 12,
            lineHeight: 1.2,
        },
        {
            table: {
                widths: [14, "*"],
                body: [
                    [
                        {
                            text: "1",
                            style: { fontSize: 10, alignment: "right" },
                            margin: [0, 4, 0, 4],
                        },
                        {
                            text: [
                                {
                                    text: `That I am an Indian citizen/ Non Resident Indian / Staff of Foreign nationality service in India/ Foreign national residing in India under visa/ person returning to India on transfer of residence basis/ PIO`,
                                },
                                ,
                                {
                                    text: ` *Tick whichever is applicable. Only Indian citizens are eligible for subsidized LPG,`,
                                    bold: true,
                                },
                            ],
                            margin: [0, 4, 0, 4],
                            fontSize: 10,
                            alignment: "justify",
                            lineHeight: 1.1,
                        },
                    ],
                    [
                        {
                            text: "2",
                            style: { fontSize: 10, alignment: "right" },
                            margin: [0, 4, 0, 4],
                        },
                        {
                            text: [
                                {
                                    text: `That my date of birth is `,
                                },
                                {
                                    text: `${dob}. `,
                                    bold: true,
                                },
                                {
                                    text: ` [LPG connection cannot be provided to a person under 18 years of age]`,
                                    bold: true,
                                    italics: true,
                                },
                            ],
                            fontSize: 10,
                            alignment: "justify",
                            lineHeight: 1.1,
                            margin: [0, 3, 0, 3],
                        },
                    ],
                    [
                        {
                            text: "3",
                            style: { fontSize: 10, alignment: "right" },
                            margin: [0, 4, 0, 4],
                        },
                        [
                            {
                                text: `That neither I, nor any other member of the household (household means a family consisting of husband wife, unmarried children and dependent parents living together in a dwelling unit having common kitchen) possess any LPG connection from PSU Oil Companies or Piped Natural Gas connection for domestic use in our dwelling unit. (House holds having Piped Natural Gas connection are not entitled for subsidized LPG).`,
                                fontSize: 10,
                                alignment: "justify",
                                lineHeight: 1.1,
                                margin: [0, 3, 0, 2],
                            },
                            { text: `OR`, fontSize: 10, bold: true, alignment: "center" },
                            {
                                text: `That I want to terminate the agreement with the above mentioned distributor.`,
                                fontSize: 10,
                                alignment: "justify",
                                lineHeight: 1.1,
                                margin: [0, 2, 0, 3],
                            },
                        ],
                    ],
                    [
                        {
                            text: "4",
                            style: { fontSize: 10, alignment: "right" },
                            margin: [0, 4, 0, 4],
                        },
                        [
                            {
                                text: [
                                    {
                                        text: `@ That I am enclosing a copy of Ration card number`,
                                    },
                                    { text: ` ${rationCardNo.trim()} `, bold: true },
                                    { text: ` including my name.,` },
                                ],
                                fontSize: 10,
                                alignment: "justify",
                                lineHeight: 1.1,
                                margin: [0, 3, 0, 2],
                            },
                            { text: `OR`, fontSize: 10, bold: true, alignment: "center" },
                            {
                                text: [
                                    {
                                        text: `@ That I do not have Ration Card in my name or in the name of any member of my ‘household as defined above. As and when a ration card is issued in my name or in the name of any of the members of the ‘household’, the same shall be produced to Oil Company LPG distributor for updating records.\n`,
                                    },
                                    {
                                        text: `@ Delete, whichever is not applicable`,
                                        bold: true,
                                    },
                                ],
                                fontSize: 10,
                                alignment: "justify",
                                lineHeight: 1.1,
                                margin: [0, 2, 0, 3],
                            },
                        ],
                    ],
                    [
                        {
                            text: "5",
                            style: { fontSize: 10, alignment: "right" },
                            margin: [0, 4, 0, 4],
                        },
                        {
                            text: `That I am enclosing the KYC form duly filled in along with the Proof of Address (POA) and Proof of Identity (POI).`,
                            fontSize: 10,
                            alignment: "justify",
                            lineHeight: 1.1,
                            margin: [0, 3, 0, 3],
                        },
                    ],
                    [
                        {
                            text: "6",
                            style: { fontSize: 10, alignment: "right" },
                            margin: [0, 4, 0, 4],
                        },
                        {
                            text: `I confirm that the LPG connection issued to me will be used in my above mentioned address and for domestic cooking purpose only and I shall abide by all terms governing its use.`,
                            fontSize: 10,
                            alignment: "justify",
                            lineHeight: 1.1,
                            margin: [0, 3, 0, 3],
                        },
                    ],
                    [
                        { text: "7", style: { alignment: "right" }, margin: [0, 4, 0, 4] },
                        {
                            text: `I That I shall not position any other LPG gas installations in the same kitchen.`,
                            fontSize: 10,
                            alignment: "justify",
                            lineHeight: 1.1,
                            margin: [0, 3, 0, 3],
                        },
                    ],
                    [
                        { text: "8", style: { alignment: "right" }, margin: [0, 4, 0, 4] },
                        {
                            text: `That as and when second cylinder is issued to me against this connection the same will also be used in the same kitchen and with the original installation.`,
                            fontSize: 10,
                            alignment: "justify",
                            lineHeight: 1.1,
                            margin: [0, 3, 0, 3],
                        },
                    ],
                    [
                        { text: "9", style: { alignment: "right" }, margin: [0, 4, 0, 4] },
                        {
                            text: `That whenever I change my residence from present address to another, I will inform M/s ${agencyName} (Name of the LPG distributor) in writing in advance for change of address in the records.`,
                            fontSize: 10,
                            alignment: "justify",
                            lineHeight: 1.1,
                            margin: [0, 3, 0, 3],
                        },
                    ],
                    [
                        { text: "10", style: { alignment: "right" }, margin: [0, 4, 0, 4] },
                        {
                            text: `That I am aware that the domestic subsidized LPG connection as shall be released by "M/s Indian Oil Corporation Ltd (IOCL) on the basis of this declaration and information submitted by me in the Know Yours Customer (KYC) form, Proof of Address and Proof of Identity, shall later be subjected to de-duplication check for existence of any other domestic subsidized LPG connection with any govt oil company, in my name or in the name of any other member of my ‘household’ as at para ‘3’ above.`,
                            fontSize: 10,
                            alignment: "justify",
                            lineHeight: 1.1,
                            margin: [0, 4, 0, 3],
                        },
                    ],
                    [
                        { text: "11", style: { alignment: "right" }, margin: [0, 4, 0, 4] },
                        {
                            text: `That if any information/declaration given by me in this undertaking, the “KYC” form or any document submitted in support of identity/ residence proof shall be found untrue or incorrect or false the oil company would be within its rights to withdraw the supply of gas/ terminate the connection/ seize the equipments /forfeit the security deposit and that I would have no claim whatsoever against IOCL for such withdrawal/termination/ Seizure/ Forfeiture.`,
                            fontSize: 11,
                            alignment: "justify",
                            lineHeight: 1.1,
                            margin: [0, 3, 0, 3],
                        },
                    ],
                ],
            },
            layout: "noBorders",
            paddingTop: (rowIndex) => 10, // Adjust top padding for rows
            paddingBottom: (rowIndex) => 10,
        },
        {
            text: `I hereby declare that whatever has been stated above is true to the best of my knowledge, correct and nothing material has been concealed there from.`,
            margin: [0, 0, 0, 30],
            alignment: "justify",
        },
        {
            table: {
                widths: [160, "*", 240],
                body: [
                    [
                        `Date: ${docDate}`,
                        ``,
                        {
                            text: `Signature of the person giving the declaration.`,
                            fontSize: 10,
                            alignment: "center",
                        },
                    ],
                    [
                        `Place: ${cityTownVillage}`,
                        ``,
                        { text: `Name: ${custName}`, alignment: "center" },
                    ],
                ],
            },
            layout: "noBorders",
        },
    ];
    return ncDocDefinition;
}

module.exports = ncDeclaration;