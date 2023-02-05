const router = require('express').Router();
const { create, login, logout, currentUser, updateSubscription } = require('../../controller/auth');
const { auth } = require('../../middleware/authMiddleware');
const ctrlWrapper = require('../../middleware/ctrlWrapper');
const { userAuthSchema } = require('../../validation/validationShema');
const { validateRequest } = require('../../middleware/joiValidation');

router.post('/register', validateRequest(userAuthSchema), ctrlWrapper(create));
router.post('/login', validateRequest(userAuthSchema), ctrlWrapper(login));
router.post('/logout',auth, ctrlWrapper(logout));
router.get('/current',auth, ctrlWrapper(currentUser));
router.patch('/current',auth, ctrlWrapper(updateSubscription));

module.exports = router;