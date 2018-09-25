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
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: "Point"
    },
    coordinates: [
      {
        type: Number,
        required: "You must supply coordinates!"
      }
    ],
    address: {
      type: String,
      required: "You must supply an address!"
    }
  },
  photo: String
});

storeSchema.pre("save", async function(next) {
  if (!this.isModified("name")) {
    return next();
  }
  this.slug = slug(this.name);
  const slugRexEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  const slugWithRexEx = await this.constructor.find({ slug: slugRexEx });
  if (slugWithRexEx.length) {
    this.slug = `${this.slug}-${slugWithRexEx.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function getTagsList() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } }},
    { $sort: { count: -1 }}
  ]);
}

module.exports = mongoose.model("Store", storeSchema);
