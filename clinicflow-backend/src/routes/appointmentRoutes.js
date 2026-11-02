const router = require('express').Router();
const {
    getAppointments,
    createAppointment,
    updateAppointmentStatus,
    getDashboardStats,
} = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');
const { validate, appointmentSchema } = require('../middleware/validate');

router.use(authenticateToken);

router.get('/dashboard', getDashboardStats);
router.get('/', getAppointments);
router.post('/', validate(appointmentSchema), createAppointment);
router.patch('/:id', updateAppointmentStatus);

module.exports = router;