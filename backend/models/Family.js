import mongoose from "mongoose";

const familySchema = new mongoose.Schema({
  name: String,
  description: String,

  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true
  }],

  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model("Family", familySchema);