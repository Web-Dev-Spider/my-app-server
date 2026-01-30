const errorHandler = (err, req, res, next) => {
  console.log("\nIn the error handler\n");
  console.log("Error received at Error handler", err);
  //handling error wich have no status code and messages...//all unhandled errors
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server error caught at Error middleware";

  //Handling mongoose errors

  //Handling mongoose bad objectID
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resourse ID";
  }

  //Handling mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.join("\n"));
  }

  //Handling mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    statusCode = 400;
    message = `The ${field} ${value} is already taken. Please choose another.`;
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
