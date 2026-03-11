import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: String,
  description: String,

//   families: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Family"
//   }],

  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tag",
    required: true
  }],

  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model("Group", groupSchema);