/**
 * Adds clinicId to request from authenticated user.
 * Must run after protect middleware.
 */
exports.withClinic = (req, res, next) => {
  req.clinicId = req.user?.clinic_id ?? 1;
  next();
};
