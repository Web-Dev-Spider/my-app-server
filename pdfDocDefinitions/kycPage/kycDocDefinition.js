const { mainHeading, subHead, personalDetHead, shortText } = require("./headingTexts");
const { boxedChars } = require("../../helperFunctions/helpers");

const styles = require("../styles/pdfDocStyles");
const createPersonalDetailsSection = require("./personalDetail");
const createAddressDetailsSection = require("./addressDetails");
const createNewConnectionDeclarationSection = require("../newConnectionDeclaration/newConnectionDeclation");
const createHotPlateInspectionSection = require("../hotPlateInspection/hotPlateInspection");
const buildKYCDocDef = ({ user, selectedPages, agencyDetails }) => {
  // console.log("user: ", user);
  const personalDetailsSection = createPersonalDetailsSection(user);
  const addressDetailsSection = createAddressDetailsSection(user);
  const newConnectionDeclarationSection = createNewConnectionDeclarationSection(user, agencyDetails);
  const hotPlateInspectionSection = createHotPlateInspectionSection(user, agencyDetails);

  const content = [];
  const showAll = !selectedPages || selectedPages.length === 0;

  if (showAll || selectedPages.includes("kyc")) {
    content.push(
      mainHeading,
      subHead,
      shortText,
      personalDetHead,
      personalDetailsSection,
      addressDetailsSection
    );
  }

  if (showAll || selectedPages.includes("newConnectionDeclaration")) {
    if (content.length > 0 && newConnectionDeclarationSection.length > 0) {
      newConnectionDeclarationSection[0].pageBreak = "before";
    }
    content.push(...newConnectionDeclarationSection);
  }

  if (showAll || selectedPages.includes("hotPlateInspection")) {
    if (content.length > 0 && hotPlateInspectionSection.length > 0) {
      hotPlateInspectionSection[0].pageBreak = "before";
    }
    content.push(...hotPlateInspectionSection);
  }

  return {
    content: content,
    styles: styles,
  };
};

module.exports = { buildKYCDocDef };
