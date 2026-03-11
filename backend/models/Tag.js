import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
  name: String,
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  }]

//   groups: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Group"
//   }]

  
});
export default mongoose.model("Tag", tagSchema);