const router = require('express').Router();
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, patientSchema } = require('../middleware/validate');

router.use(authenticateToken);

router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', validate(patientSchema), createPatient);
router.put('/:id', validate(patientSchema), updatePatient);
router.delete('/:id', requireAdmin, deletePatient); // Admin-only requirement

module.exports = router;