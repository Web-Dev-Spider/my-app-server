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
  let { user } = req.body;

  //   console.log("Formatted user:", formatUser(user));
  user = formatUser(user);
  const docDefinition = buildKYCDocDef({ user });
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=consumer_details.pdf");

  pdfDoc.pipe(res);
  pdfDoc.end();
};

module.exports = { createKYCPDF };
