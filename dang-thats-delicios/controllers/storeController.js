const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const User = mongoose.model('User');
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That file type is not allowed!" }, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render("index", { title: "That is sweet" });
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  if (!req.file) {
    next();
    return;
  } else {
    const extension = req.file.mimetype.split("/")[1];
    req.body.photo = `${uuid.v4()}.${extension}`;

    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    next();
  }
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  req.flash("success", `Store ${store.name} successfully created`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render("stores", { title: "Stores", stores });
};



const confirmOwner = (store, user) => {
  if(!store.author.equals(user._id)) {
    throw new Error('You must own a store in order to edit it');
  }
}

exports.editStore = async (req, res) => {
  // find the store
  console.log(req.params.id);
  const store = await Store.findOne({ _id: req.params.id });
  // Check if user have a permission to edit it
  confirmOwner(store, req.user);
  // render editting form
  res.render("editStore", { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  req.body.location.type = "Point";
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return new store instead of old one, which is default
    runValidators: true
  }).exec();
  req.flash(
    "success",
    `Store ${store.name} successfully updated <a href="/store/${
      store.slug
    }">View store -<</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author');
  if (!store) return next();
  res.render("store", { store, title: store.name });
};

exports.getStoresByTag = async (req, res, next) => {
  const tag = req.params.tag
  const tagsQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagsQuery })
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tags', { tags, title: 'Tags', tag, stores })
}

exports.heartedStores = async (req, res) => {
  // find stores which are hearted by the user;
  const hearts = req.user.hearts.map(obj => obj.toString());
  const stores = await Store.find({ _id: hearts })
  res.render('stores', { title: 'stores', stores });
}

exports.searchStores = async (req, res) => {
  const stores = await Store
  // first find matched stores
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // now sort them
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit them to only 5
  .limit(5);
  res.json(stores)
}

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 //10 km
      }
    }
  };

  const stores = await Store
    .find(q)
    .select('slug name description photo location')
    .limit(10);
  res.json(stores);
}

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' })
}

exports.addHeart = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.storeId) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(
      req.user._id,
      { [operator]: {hearts: req.params.storeId} },
      { new: true }
    )
  res.json(user)
}
