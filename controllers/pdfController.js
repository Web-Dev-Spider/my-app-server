console.log("Inside pdfController.js");
const PdfPrinter = require("pdfmake/src/printer");
console.log("after importing pdf printer");
const path = require("path");
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../fonts/Roboto-Medium.ttf"),
    italics: path.join(__dirname, "../fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "../fonts/Roboto-MediumItalic.ttf"),
  },
};

const { buildKYCDocDef } = require("../pdfDocDefinitions/kycPage/kycDocDefinition");
const { formatUser, capitalizeWords } = require("../helperFunctions/helpers");
const Agency = require("../models/Agency");
const printer = new PdfPrinter(fonts);

const createKYCPDF = async (req, res) => {
  try {
    let user = req.body;
    // console.log(user)

    const agencyId = req.user.agencyId;
    const agency = await Agency.findById(agencyId);

    let agencyDetails = {};
    if (agency) {
      const { buildingNo, place, street, city, district, pincode } = agency.address || {};

      let formattedAddress = "";
      if (buildingNo || place) formattedAddress += [buildingNo, place].filter(Boolean).join(", ");
      if (street) formattedAddress += (formattedAddress ? ", " : "") + street; // Add to existing line or start new?
      // Let's create lines for the PDF
      const lines = [];
      const line1 = [buildingNo, place, street].filter(Boolean).join(", ");
      if (line1) lines.push(line1);
      const line2 = [city, district].filter(Boolean).join(", ");
      if (line2) lines.push(line2);
      if (pincode) lines.push(`PIN - ${pincode}`);

      agencyDetails = {
        name: agency.name,
        formattedAddress: lines.join("\n")
      };
    } else {
      agencyDetails = {
        name: "Agency Name",
        formattedAddress: "Agency Address"
      };
    }

    const { selectedPages } = user;
    console.log("Selected Pages:", selectedPages);
    //   console.log("Formatted user:", formatUser(user));
    user = formatUser(user);
    const docDefinition = buildKYCDocDef({ user, selectedPages, agencyDetails });
    // Create dynamic filename
    const { fName, mName, lName } = req.body;
    const fileNameParts = [fName, mName, lName].filter(part => part && part.trim() !== "");
    const fileName = fileNameParts.length > 0 ? `${fileNameParts.join(" ")}.pdf` : "consumer_details.pdf";

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);


    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error("Error creating PDF:", error);
    res.status(500).json({ success: false, message: "Error generating PDF" });
  }
};

module.exports = { createKYCPDF };
