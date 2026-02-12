const { mainHeading, subHead, personalDetHead, shortText } = require("./headingTexts");
const { boxedChars } = require("../../helperFunctions/helpers");

const styles = require("../styles/pdfDocStyles");
const createPersonalDetailsSection = require("./personalDetail");
const createAddressDetailsSection = require("./addressDetails");
const buildKYCDocDef = ({ user }) => {
  console.log("user: ", user);
  const personalDetailsSection = createPersonalDetailsSection(user);
  const addressDetailsSection = createAddressDetailsSection(user);
  return {
    content: [mainHeading, subHead, shortText, personalDetHead, personalDetailsSection, addressDetailsSection],
    styles: styles,
  };
};

module.exports = { buildKYCDocDef };
