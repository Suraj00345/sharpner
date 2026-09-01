const testMiddleware = (req, res, next) => {
  if (req) {
    console.log("Req is coming");
  }

  next();
};

module.exports = testMiddleware;