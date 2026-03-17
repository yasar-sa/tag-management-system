import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, default: "" },
    label:    { type: String, default: "New question" },
    score:    { type: Number, default: 0, min: 0, max: 100 },
    tags:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  },
  { timestamps: true }
);


// for itemcode auto increment right from the mongodb
ItemSchema.pre("save", async function () {
  if (!this.itemCode) {
    const count = await mongoose.model("Item").countDocuments();
    this.itemCode = `Q${count + 1}`;
  }
});

export default mongoose.model("Item", ItemSchema);