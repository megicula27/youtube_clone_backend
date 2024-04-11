const AsyncHandler = (referredFunction) => {
  return (req, res, next) => {
    Promise.resolve(referredFunction(req, res, next)).catch((err) => next(err));
  };
};

export { AsyncHandler };

//METHOD 2

/*

export const asyncHandler2 = (fn) => {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        res.status(error.code || 500);
        res.json({
          success: false,
          error: error.message,
        });
      }
    };
  };

*/
