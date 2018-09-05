const mongoose = require("mongoose");
// mongoose.Promise = global.Promise;
const slug = require("slugs");

const storeSchema = mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: "This field is required"
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String]
});

storeSchema.pre("save", function(next) {
  if (!this.isModified("name")) {
    return next();
  }
  this.slug = slug(this.name);
  next();
  // TODO make more resiliant so slugs are unique
});

module.exports = mongoose.model("Store", storeSchema);
