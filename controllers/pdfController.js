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
const { formatUser } = require("../helperFunctions/helpers");
const printer = new PdfPrinter(fonts);

const createKYCPDF = (req, res) => {
  let user = req.body;
  // console.log(user)

  const { selectedPages } = user;
  console.log("Selected Pages:", selectedPages);
  //   console.log("Formatted user:", formatUser(user));
  user = formatUser(user);
  const docDefinition = buildKYCDocDef({ user, selectedPages });
  // Create dynamic filename
  const { fName, mName, lName } = req.body;
  const fileNameParts = [fName, mName, lName].filter(part => part && part.trim() !== "");
  const fileName = fileNameParts.length > 0 ? `${fileNameParts.join(" ")}.pdf` : "consumer_details.pdf";

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);


  pdfDoc.pipe(res);
  pdfDoc.end();
};

module.exports = { createKYCPDF };
