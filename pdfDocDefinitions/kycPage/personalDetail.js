const { boxedString, boxedChars } = require("../../helperFunctions/helpers");

function createPersonalDetailsSection(user) {
  let { mrMrsMs, fName, mName, lName, consumerNo, dob, fatherOrSpouseName, motherName } = { ...user };
  console.log("personal details.js fName: ", fName);

  fName = fName.toUpperCase();
  mName = mName.toUpperCase();
  lName = lName.toUpperCase();
  fatherOrSpouseName = fatherOrSpouseName.toUpperCase();
  motherName = motherName.toUpperCase();
  console.log(fName);
  let dimPersonalDet = 85;

  const personalDetailsSection = [
    {
      canvas: [
        {
          type: "rect",
          x: 420,
          y: -30,
          w: 110, // Width of the rectangle
          h: 130, // Height of the rectangle
          r: 0, // Radius (for rounded corners)
          lineColor: "black", // Border color
          fillOpacity: 0, // Opacity of the fill
          lineWidth: 1, // Width of the border line
          // color: "red", // Fill color
        },
      ],
    },
    // Personal details section header

    // Mr/Mrs/Ms
    {
      columns: [{ ...boxedString("(Mr. / Mrs / Ms*", dimPersonalDet), width: "auto" }, boxedChars(mrMrsMs)],
      margin: [0, -70, 0, 0],
    },
    // First Name
    {
      columns: [{ ...boxedString("First Name*", dimPersonalDet), width: "auto" }, boxedChars(fName)],
    },
    // Middle Name
    {
      columns: [{ ...boxedString("Middle Name*", dimPersonalDet), width: "auto" }, boxedChars(mName)],
    },
    // Last Name
    {
      columns: [{ ...boxedString("Last Name*", dimPersonalDet), width: "auto" }, boxedChars(lName)],
      margin: [0, 0, 0, 5],
    },
    {
      columns: [
        { text: "b) Gas Consumer Number*   ", width: 135, fontSize: 10 },
        { ...boxedChars(consumerNo), width: "auto" },
        {
          text: "c) Date of Birth *",
          width: 95,
          // width: "auto",
          margin: [5, 0, 0, 0],
          fontSize: 10,
        },
        {
          ...boxedChars(dob),
        },
      ],
      margin: [0, 10, 0, 0],
    },

    //Close Relatives
    {
      columns: [
        {
          text: "d) Close Relative   ",
          width: 90,
          fontSize: 10,
          margin: [0, 8, 0, 0],
        },

        {
          columns: [
            {
              stack: [
                {
                  columns: [
                    {
                      ...boxedString("Father’s / Spouse Name*", 125),
                      width: "auto",
                    },
                    { ...boxedChars(fatherOrSpouseName), alignment: "left" },
                  ],
                },
                {
                  columns: [
                    {
                      ...boxedString("Mother's Name", 125),
                      width: "auto",
                    },
                    { ...boxedChars(motherName), alignment: "left" },
                  ],
                },
              ],
            },
          ],
        },
      ],
      margin: [0, 10, 0, 0],
    },
  ];
  return personalDetailsSection;
}
module.exports = createPersonalDetailsSection;
