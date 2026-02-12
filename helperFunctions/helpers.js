// Function to create a table with boxed characters
//boxedChars function
function boxedChars(inputString, cellWidth = 6) {
  const characters = inputString.split(""); // Split the string into characters
  const tableBody = [
    characters.map((char) => ({
      text: char,
      alignment: "center",
      margin: [1, 1, 1, 1], // Padding inside the cell
      border: [true, true, true, true], // Borders on all sides
      fontSize: 11, // Font size
      lineHeight: 1, // Line height
    })),
  ];

  const widths = Array(characters.length).fill(cellWidth); // Set uniform width for all cells

  return {
    table: {
      body: tableBody,
      widths: widths, // Set the custom width for each cell
    },
    layout: {
      hLineWidth: function () {
        return 0.2; // Border width for horizontal lines
      },
      vLineWidth: function () {
        return 0.2; // Border width for vertical lines
      },
      hLineColor: function () {
        return "black"; // Color of horizontal lines
      },
      vLineColor: function () {
        return "black"; // Color of vertical lines
      },
      paddingLeft: function () {
        return 4; // Remove left padding
      },
      paddingRight: function () {
        return 4; // Remove right padding
      },
      paddingTop: function () {
        return 1; // Remove top padding
      },
      paddingBottom: function () {
        return 1; // Remove bottom padding
      },
    },
  };
}
function ujjwalaBoxedChars({ text, cellWidth = 6, fSize = 10, lH = 0.8 }) {
  const characters = text.split(""); // Split the string into characters
  const tableBody = [
    characters.map((char) => ({
      text: char,
      alignment: "center",
      margin: [0.75, 0.75, 0.75, 0.75], // Padding inside the cell
      border: [true, true, true, true], // Borders on all sides
      fontSize: fSize, // Font size
      lineHeight: lH, // Line height
    })),
  ];

  const widths = Array(characters.length).fill(cellWidth); // Set uniform width for all cells

  return {
    table: {
      body: tableBody,
      widths: widths, // Set the custom width for each cell
    },
    layout: {
      hLineWidth: function () {
        return 0.2; // Border width for horizontal lines
      },
      vLineWidth: function () {
        return 0.2; // Border width for vertical lines
      },
      hLineColor: function () {
        return "black"; // Color of horizontal lines
      },
      vLineColor: function () {
        return "black"; // Color of vertical lines
      },
      paddingLeft: function () {
        return 2.5; // Remove left padding
      },
      paddingRight: function () {
        return 2.5; // Remove right padding
      },
      paddingTop: function () {
        return 1; // Remove top padding
      },
      paddingBottom: function () {
        return 1; // Remove bottom padding
      },
    },
  };
}
function ujjwalaRegularBoxedChars({ text, cellWidth = 8, fSize = 11, lH = 1, paddingLR = 2.5 }) {
  const characters = text.split(""); // Split the string into characters
  const tableBody = [
    characters.map((char) => ({
      text: char,
      alignment: "center",
      margin: [1, 1, 1, 1], // Padding inside the cell
      border: [true, true, true, true], // Borders on all sides
      fontSize: fSize, // Font size
      lineHeight: lH, // Line height
    })),
  ];

  const widths = Array(characters.length).fill(cellWidth); // Set uniform width for all cells

  return {
    table: {
      body: tableBody,
      widths: widths, // Set the custom width for each cell
    },
    layout: {
      hLineWidth: function () {
        return 0.2; // Border width for horizontal lines
      },
      vLineWidth: function () {
        return 0.2; // Border width for vertical lines
      },
      hLineColor: function () {
        return "black"; // Color of horizontal lines
      },
      vLineColor: function () {
        return "black"; // Color of vertical lines
      },
      paddingLeft: function () {
        return paddingLR; // Remove left padding
      },
      paddingRight: function () {
        return paddingLR; // Remove right padding
      },
      paddingTop: function () {
        return 1; // Remove top padding
      },
      paddingBottom: function () {
        return 1; // Remove bottom padding
      },
    },
  };
}

function boxedString(text, width = "auto") {
  return {
    table: {
      widths: [width],
      body: [
        [
          {
            text: text,
            margin: [1, 1, 1, 1],
            fontSize: 11,
            lineHeight: 1,
          },
        ],
      ],
    },
    layout: {
      hLineWidth: function () {
        return 0.2;
      },
      vLineWidth: function () {
        return 0.2;
      },
      hLineColor: function () {
        return "black";
      },
      vLineColor: function () {
        return "black";
      },
      paddingLeft: function () {
        return 3; // Remove left padding
      },
      paddingRight: function () {
        return 3; // Remove right padding
      },
      paddingTop: function () {
        return 1; // Remove top padding
      },
      paddingBottom: function () {
        return 1; // Remove bottom padding
      },
    },
  };
}
function ujjwalaBoxedString({
  text,
  width = "auto",
  fSize = 10,
  lH = 0.8,
  mTop = 0.75,
  mBottom = 0.75,
  mLeft = 0.75,
  mRight = 0.75,
  pBottom = 2,
  bold = false,
  boxHeight = null,
  italics = false,
}) {
  return {
    table: {
      widths: [width],
      body: [
        [
          {
            text: text,
            margin: [mLeft, mTop, mRight, mBottom], // 1 unit = 1/72 of an inch, 1, 1, 1],
            fontSize: fSize,
            lineHeight: lH,
            bold: bold,
            italics: italics,
            ...(boxHeight && { minHeight: boxHeight }),
          },
        ],
      ],
    },
    layout: {
      hLineWidth: function () {
        return 0.2;
      },
      vLineWidth: function () {
        return 0.2;
      },
      hLineColor: function () {
        return "black";
      },
      vLineColor: function () {
        return "black";
      },
      paddingLeft: function () {
        return 3; // Remove left padding
      },
      paddingRight: function () {
        return 3; // Remove right padding
      },
      paddingTop: function () {
        return 0; // Remove top padding
      },
      paddingBottom: function () {
        return pBottom; // Remove bottom padding
      },
    },
  };
}
function ujjwalaRegularBoxedString({
  text,
  width = "auto",
  fSize = 11,
  lH = 1,
  mTop = 1,
  mBottom = 1,
  mLeft = 1,
  mRight = 1,
  pBottom = 2,
  bold = false,
  boxHeight = null,
  italics = false,
}) {
  return {
    table: {
      widths: [width],
      body: [
        [
          {
            text: text,
            margin: [mLeft, mTop, mRight, mBottom], // 1 unit = 1/72 of an inch, 1, 1, 1],
            fontSize: fSize,
            lineHeight: lH,
            bold: bold,
            italics: italics,
            ...(boxHeight && { minHeight: boxHeight }),
          },
        ],
      ],
    },
    layout: {
      hLineWidth: function () {
        return 0.2;
      },
      vLineWidth: function () {
        return 0.2;
      },
      hLineColor: function () {
        return "black";
      },
      vLineColor: function () {
        return "black";
      },
      paddingLeft: function () {
        return 3; // Remove left padding
      },
      paddingRight: function () {
        return 3; // Remove right padding
      },
      paddingTop: function () {
        return 0; // Remove top padding
      },
      paddingBottom: function () {
        return pBottom; // Remove bottom padding
      },
    },
  };
}
function mmToPt(mm) {
  return mm * 2.83465;
}
//Capitalise the string
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

//Capitalize the each words of a string
function capitalizeWords(str) {
  return str
    .split(" ")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

//Remove Extra spaces from string
function removeExtraSpaces(str) {
  return str
    .split(" ")
    .filter((word) => word !== "")
    .join(" ");
}
function convertToDDMMYYYY(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function formatAddressSlash(...strings) {
  return strings.filter((str) => str != null && str != "").join("/");
}
function formatAddressComma(...strings) {
  return strings.filter((str) => str != null && str != "").join(", ");
}

function capitalizeAddress(str) {
  return str
    .toLowerCase() // Convert everything to lowercase first
    .split("\n") // Split by newlines
    .map((line) =>
      line
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1), // Capitalize first letter
        )
        .join(" "),
    ) // Join words in each line
    .join("\n"); // Join lines back with newlines
}

const formatUser = (user) => {
  try {
    return {
      mrMrsMs: user.mrMrsMs.padEnd(3, " ") || "MR",
      fName: (user.fName || "").padEnd(18, " "),
      mName: (user.mName || "").padEnd(18, " "),
      lName: (user.lName || "").padEnd(18, " "),

      consumerNo: (user.consumerNo || "").padEnd(10, " "),
      dob: (user.dob || "").padEnd(6, " "),
      fatherOrSpouseName: (user.fatherOrSpouseName || "").padEnd(20, " "),
      motherName: (user.motherName || "").padEnd(20, " "),
      poIcode: (user.poIcode || "").padEnd(5, " "),
      poINo: (user.poINo || "").padEnd(26, " "),
      rationCardNo: (user.rationCardNo || " ").padEnd(26, " "),
      poANo: (user.poANo || "").padEnd(5, " "),
      hName: (user.hName || "").padEnd(18, " "),
      hNo: (user.hNo || "").padEnd(4, " "),
      wardNo: (user.wardNo || "").padEnd(3, " "),
      poaCode: (user.poaCode || "").padEnd(5, " "),
      landMark: (user.landMark || "").padEnd(18, " "),
      roadName: (user.roadName || "").padEnd(26, " "),
      cityTownVillage: (user.cityTownVillage || "").padEnd(16, " "),
      districtName: (user.districtName || "").padEnd(13, " ") || user.districtName.padEnd(13, " "),
      // poaText: addressProof,
      stateName: "KERALA".padEnd(10, " "),
      pinCode: (user.pinCode || "").padEnd(6, " "),
      mobNo: (user.mobNo || "").padEnd(10, " "),
      landLineNo: (user.landLineNo || "").padEnd(10, " "),
      emailId: (user.emailId || "").padEnd(26, " "),
      docDate: (user.docDate || ""),
      rationCardState: "KERALA",
    };
  } catch (error) {
    console.log(error);
  }
};

const cleanedNumber = (aadhar) => aadhar.replace(/[^\d]/g, "").trim();
module.exports = {
  boxedChars,
  ujjwalaBoxedChars,
  ujjwalaBoxedString,
  boxedString,
  capitalize,
  capitalizeWords,
  removeExtraSpaces,
  convertToDDMMYYYY,
  formatAddressSlash,
  formatAddressComma,
  capitalizeAddress,
  mmToPt,
  cleanedNumber,
  ujjwalaRegularBoxedString,
  ujjwalaRegularBoxedChars,
  formatUser,
};
