const { boxedString, boxedChars } = require("../../helperFunctions/helpers");

//Do not touch this code

function generateAddressDetailsSection(user) {
  let {
    fName,
    poANo,
    poaCode,
    hName,
    hNo,
    wardNo,
    landMark,
    roadName,
    cityTownVillage,
    districtName,
    stateName,
    pinCode,
    mobNo,
    landLineNo,
    emailId,
    poIcode,
    rationCardState,
    docDate,
    poINo,
    rationCardNo,
  } = { ...user };

  hName = hName.toUpperCase();
  hNo = hNo.toUpperCase();
  wardNo = wardNo.toUpperCase();
  landMark = landMark.toUpperCase();
  roadName = roadName.toUpperCase();
  cityTownVillage = cityTownVillage.toUpperCase();

  const { fonts } = require("pdfmake/build/pdfmake");

  // console.log("Address details for decl page", fName);
  const dimAddressDet = 136;

  const addressDetailsSection = [
    //Address details
    //POA Code
    {
      text: "2) Address for LPG connection / Contact Information",
      style: "subHead",
      margin: [0, 3, 0, 2],
    },
    {
      columns: [
        {
          ...boxedString("Proof of Address (POA) category Code* ", 207),
          width: "auto",
          style: "shortText",
          margin: [0, 0, 0, 0],
        },
        boxedChars(poaCode),
      ],
      margin: [0, 0, 0, 0],
    },
    //House name / House no
    {
      columns: [
        {
          ...boxedString("House Flat #, Name* ", dimAddressDet),
          width: "auto",
        },
        boxedChars(hName),
        {
          ...boxedString("House # ", 50),
          width: "auto",
        },
        boxedChars(hNo),
      ],
    },
    //Ward details
    {
      columns: [
        {
          ...boxedString("Housing Complex/Ward No ", dimAddressDet),
          width: "auto",
          fontSize: 7,
        },
        { ...boxedChars(wardNo), width: "auto" },
        {
          ...boxedString("Land Mark", 64.3),
          width: "auto",
          fontSize: 7,
        },
        boxedChars(landMark),
      ],
    },
    //Street/Road Name:
    {
      columns: [{ ...boxedString("Street / Road Name", dimAddressDet), width: "auto" }, boxedChars(roadName)],
    },
    //City town village
    {
      columns: [
        {
          ...boxedString("City / Town / Village*", dimAddressDet),
          width: "auto",
        },
        boxedChars(cityTownVillage),
        { ...boxedString("Pin Code", 50.2), width: "auto" },
        boxedChars(pinCode),
      ],
    },
    //District State Pincode
    {
      columns: [
        {
          ...boxedString("District *", dimAddressDet),
          width: "auto",
        },
        { ...boxedChars(districtName), width: "auto" },
        {
          ...boxedString("State*", 36),
          width: "auto",
        },
        { ...boxedChars(stateName), width: "auto" },
      ],
    },
    {
      columns: [
        {
          ...boxedString("Phone #* : Mobile No ", dimAddressDet),
          width: "auto",
        },
        { ...boxedChars(mobNo), width: "auto" },
        { ...boxedString("Land line ", 50), width: "auto" },
        boxedChars(landLineNo),
      ],
    },
    //Email id
    {
      columns: [{ ...boxedString("Email Id", dimAddressDet), width: "auto" }, boxedChars(emailId)],
    },

    //Section Other relevent Sections
    {
      text: "3) Other Relevant Details",
      style: "subHead",
    },

    //Heading proof of Identity
    {
      ...boxedString(" a) Proof of Identity (POI)", 505),
      alignment: "center",
    },
    //Proof of Identity code

    {
      columns: [
        {
          ...boxedString("POI Category Code* ", dimAddressDet),
          width: "auto",
        },
        {
          ...boxedChars(poIcode),
          width: "auto",
        },

        { ...boxedString(" ", 291.5) },
      ],
    },
    {
      columns: [
        { ...boxedString("Card Number ", dimAddressDet), width: "auto" },
        { ...boxedChars(poINo), width: "auto" },
      ],
    },

    //Ration card details
    {
      ...boxedString("b) Ration Card Details if Available", 505),
      alignment: "center",
    },
    {
      columns: [
        // State of Issue
        {
          ...boxedString("State of Issue", dimAddressDet),
          width: "auto",
        },
        {
          ...boxedChars(rationCardState),
          width: "auto",
        },
        {
          ...boxedString(" ", 277.5),
        },
      ],
    },
    {
      columns: [
        {
          ...boxedString("Ration Card Number", dimAddressDet),
          width: "auto",
        },
        {
          ...boxedChars(rationCardNo),
          width: "auto",
        },
      ],
    },
    //Declaration
    {
      text: [
        { text: "Declaration ", fontSize: 10, bold: true },
        {
          text: ": I hereby declare that the information provided by me above is true and correct to the best of my knowledge and belief. I also confirm that in the event of any information provided by me is found incorrect / is incomplete and also in the event of any violation of Government Regulation related to the supply and distribution of LPG, IOC/BPC/HPC will be within its right to discontinue supply of LPG discontinue supply of LPG cylinders to me, forfeit of security deposit and levy of penal charges as per the policy and guidelines and may initiate legal action applicable under provisions.",
          fontSize: 9,
          italics: true,
        },
      ],
      alignment: "justify",
      margin: [0, 5, 0, 5],
    },

    {
      columns: [{ text: "Name & Signature", width: 400 }, { text: "Date:", width: 35 }, docDate],
      margin: [0, 30, 250, 5],
    },
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 5,
          x2: 500, // Length of the line (50 points)
          y2: 5,
          lineWidth: 1, // Thickness of the line (1 point)
        },
      ],
    },
    //Declation by distributor
    {
      text: "To be filled by Dealer / Distributor",
      style: "subHead",
      alignment: "center",
      fontSize: 9,
    },
    {
      text: "I confirm having verified the photocopies of documents above against their originals.",
      fontSize: 9,
    },
    {
      text: "Consumer Number (if allotted): ",
      fontSize: 9,
      margin: [0, 5, 0, 5],
    },
    {
      columns: [{ text: "Signature of Distributor", width: 400 }, { text: "Date:", width: 35 }, docDate],
      margin: [0, 20, 250, 5],
      fontSize: 10,
    },
    //Tear off
    {
      fontSize: 9,
      text: ".................................................................................................... Tear off ................................................................................................",
    },
    {
      text: "Acknowledgement",
      decoration: "underline",
      fontSize: 9,
      alignment: "center",
      margin: [0, 4, 0, 4],
    },
    {
      text: "I/We, hereby, confirm receipt of duly filled in KYC form along with copy relevant POI, POA documents from Name",
      fontSize: 9,
      margin: [0, 0, 0, 5],
    },
    {
      text: " _______________________________________ Consumer no (if applicable) ________________________ on ________________",
      fontSize: 8,
    },
    {
      text: "Signature and Seal of Distributor",
      fontSize: 8,
      alignment: "right",
      margin: [0, 5, 0, 0],
      pageBreak: "after",
    },
  ];
  return addressDetailsSection;
}
module.exports = generateAddressDetailsSection;
