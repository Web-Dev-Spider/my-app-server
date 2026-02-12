const mainHeading = {
  text: "Know Your Customer (KYC) Form",
  style: "mainHeading",
  margin: [0, 5, 0, 0],
};

const subHead = {
  text: "(To be filled in black ink with BLOCK LETTERS. Fields marked with * are mandatory)",
  style: "shortText",
  alignment: "center",
  margin: [0, 0, 15, 0],
};
// Subhead 2
const shortText = {
  text: "(For Instructions to fill form see Overleaf)",
  style: "shortText",
  alignment: "center",
  margin: [0, 0, 0, 0],
};

//***********DO NOT TOUCH THIS CODE */

// Section: Personal Details
const personalDetHead = {
  text: "1) Personal Details",
  style: "subHead",
  margin: [0, 0, 0, -25],
};
//Passport size photo space

// Image on the far right side of the subheading
//working perfectly
module.exports = { mainHeading, subHead, shortText, personalDetHead };
