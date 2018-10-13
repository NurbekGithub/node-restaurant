const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const { catchErrors } = require("../handlers/errorHandlers");

// Do work here
router.get("/", catchErrors(storeController.getStores));
router.get("/stores", storeController.getStores);
router.get("/add", authController.isLoggedIn, storeController.addStore);

router.get("/store/:slug", catchErrors(storeController.getStoreBySlug));

router.get("/stores/:id/edit", catchErrors(storeController.editStore));
router.post(
  "/add",
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
router.post(
  "/add/:id",
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.get('/tags', catchErrors(storeController.getStoresByTag))
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);
router.get('/logout', authController.logout);

router.post('/login', authController.login);
router.post('/register', 
  userController.validateRegister,
  catchErrors(userController.register),
  authController.login
);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgotPassword', catchErrors(authController.forgotPassword));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);

router.get('/map', storeController.mapPage)

/*
  API
*/

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));

router.post('/api/stores/:storeId/heart', catchErrors(storeController.addHeart))

module.exports = router;
