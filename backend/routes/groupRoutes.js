import express from "express";
import Group from "../models/Group.js";
import Tag from "../models/Tag.js";
import { groupSchema } from "../validations/groupValidation.js";
import { validate } from "../middleware/validate.js";
import { idSchema } from "../validations/commonValidation.js";
import { validateParams } from "../middleware/validateParams.js";
import Family from "../models/Family.js";

const router = express.Router();



// CREATE GROUP
router.post("/groups", validate(groupSchema), async (req, res) => {
  try {

    const { tags } = req.body;

    const existingTags = await Tag.countDocuments({
      _id: { $in: tags }
    });

    if (existingTags !== tags.length) {
      return res.status(400).json({
        message: "One or more tag IDs are invalid"
      });
    }

    const group = new Group(req.body);

    await group.save();

    res.status(201).json(group);

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

});

//update group
router.put(
  "/groups/:id",
  validateParams(idSchema),
  validate(groupSchema),
  async (req, res) => {

    try {

          const { tags } = req.body;

    const existingTags = await Tag.countDocuments({
      _id: { $in: tags }
    });

    if (existingTags !== tags.length) {
      return res.status(400).json({
        message: "One or more tag IDs are invalid"
      });
    }
    //

      const updatedGroup = await Group.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedGroup) {
        return res.status(404).json({
          message: "Group not found"
        });
      }

      res.json(updatedGroup);

    } catch (error) {

      res.status(500).json({
        message: "Server error",
        error: error.message
      });

    }

});


// // GET GROUPS
// router.get("/groups", async (req, res) => {

//   const groups = await Group.find()
//     .populate("tags", "name");

//   res.json(groups);

// });

// const router = express.Router();

// create group
// router.post("/groups", async (req, res) => {
//       const { error } = groupSchema.validate(req.body);

//   if (error) {
//     return res.status(400).json({
//       message: error.details[0].message
//     });
//   }

//   try {

//     const { name, description, tags } = req.body;

//     if (!tags || tags.length === 0) {
//       return res.status(400).json({
//         message: "Group must have at least one tag"
//       });
//     }

//     const group = new Group({
//       name,
//       description,
//       tags
//     });

//     await group.save();
//     await Tag.updateMany(
//       { _id: { $in: tags } },
//       { $addToSet: { groups: group._id } }
//     );


//     res.status(201).json(group);

//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }

// });



// get groups
router.get("/groups", async (req, res) => {
  try {

    const groups = await Group.find()
      .populate("tags", "name");

    res.json(groups);

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//delete group
router.delete("/groups/:id", validateParams(idSchema), async (req, res) => {

  try {

    const family = await Family.findOne({ groups: req.params.id });

    if (family) {
      return res.status(400).json({
        message: "Group cannot be deleted because it belongs to a family"
      });
    }

    const group = await Group.findByIdAndDelete(req.params.id);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    res.json({
      message: "Group deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

});
// //relationship API to add tag to group
// router.post("/groups/:groupId/tags/:tagId", async (req, res) => {

//   const { groupId, tagId } = req.params;

//   await Group.findByIdAndUpdate(
//     groupId,
//     { $addToSet: { tags: tagId } }
//   );

//   await Tag.findByIdAndUpdate(
//     tagId,
//     { $addToSet: { groups: groupId } }
//   );

//   res.json({ message: "Tag added to group" });

// });

export default router;