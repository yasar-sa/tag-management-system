import express from "express";
const router = express.Router();
import Tag from "../models/Tag.js";
import Group from "../models/Group.js";
import { tagSchema } from "../validations/tagValidation.js";
import { validate } from "../middleware/validate.js";
import { idSchema } from "../validations/commonValidation.js";
import { validateParams } from "../middleware/validateParams.js";
import Course from "../models/Course.js";

router.post("/tags", validate(tagSchema), async (req, res) => {
  try {
        const { courses } = req.body;

    const existingCourses = await Course.countDocuments({
      _id: { $in: courses }
    });

    if (existingCourses !== courses.length) {
      return res.status(400).json({
        message: "One or more course IDs are invalid"
      });
    }
    const tag = new Tag(req.body);

    await tag.save();

    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

//create a new tag
// router.post('/tags', async (req, res) => {
//       const { error } = tagSchema.validate(req.body);

//   if (error) {
//     return res.status(400).json({
//       message: error.details[0].message
//     });
//   }
//   try {
//     const { name, description, groups } = req.body;

//     const newTag = new Tag({
//       name,
//       description,
//       groups
//     });

//     await newTag.save();

//     res.status(201).json(newTag);

//   } catch (error) {
//     res.status(500).json({ message: 'Server error',
//         error: error.message
//      });
//   }
// });

//get all tags
router.get("/tags", async (req, res) => {
  try {
    const tags = await Tag.find().populate("courses", "name");

    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//Instead of editing the tag directly, create a relationship API.

//update a tag
// router.put('/tags/:id', async (req, res) => {
//     try {
//         const { name, description } = req.body;
//         const updatedTag = await Tag.findByIdAndUpdate(
//             req.params.id,
//             { name, description },
//             { new: true }
//         );
//         if (!updatedTag) {
//             return res.status(404).json({ message: 'Tag not found' });
//         }
//         res.json(updatedTag);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

//update a tag
router.put(
  "/tags/:id",
  validateParams(idSchema),
  validate(tagSchema),
  async (req, res) => {
    try {
          const { courses } = req.body;

    const existingCourses = await Course.countDocuments({
      _id: { $in: courses }
    });

    if (existingCourses !== courses.length) {
      return res.status(400).json({
        message: "One or more course IDs are invalid"
      });
    }

    
      const updatedTag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updatedTag) {
        return res.status(404).json({
          message: "Tag not found",
        });
      }

      res.json(updatedTag);
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },
);

//delete a tag
router.delete("/tags/:id", validateParams(idSchema), async (req, res) => {
  try {
    const group = await Group.findOne({ tags: req.params.id });

    if (group) {
      return res.status(400).json({
        message: "Tag cannot be deleted because it belongs to a group",
      });
    }

    const tag = await Tag.findByIdAndDelete(req.params.id);

    if (!tag) {
      return res.status(404).json({
        message: "Tag not found",
      });
    }

    res.json({
      message: "Tag deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
