import express from "express";
import Family from "../models/Family.js";
import Group from "../models/Group.js";
import { familySchema } from "../validations/familyValidation.js";
import { idSchema } from "../validations/commonValidation.js";
import { validateParams } from "../middleware/validateParams.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();


// CREATE FAMILY
router.post("/families", validate(familySchema), async (req, res) => {
  try {

    const { groups } = req.body;

    const existingGroups = await Group.countDocuments({
      _id: { $in: groups }
    });

    if (existingGroups !== groups.length) {
      return res.status(400).json({
        message: "One or more group IDs are invalid"
      });
    }

    const family = new Family(req.body);

    await family.save();

    res.status(201).json(family);

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

});

// GET ALL FAMILIES
router.get("/families", async (req, res) => {

  try {

    const families = await Family.find()
      .populate({
        path: "groups",
        select: "name"
      });

    res.json(families);

  } catch (error) {

    res.status(500).json({
      message: "Server error",
        error: error.message
    });

  }

});


// // GET FAMILY BY ID
// router.get("/families/:id", validateParams(idSchema),async (req, res) => {

//   try {

//     const family = await Family.findById(req.params.id)
//       .populate({
//         path: "groups",
//         populate: {
//           path: "tags",
//           select: "name"
//         }
//       });

//     if (!family) {
//       return res.status(404).json({
//         message: "Family not found"
//       });
//     }

//     res.json(family);

//   } catch (error) {

//     res.status(500).json({
//       message: "Server error",
//         error: error.message
//     });

//   }

// });


// DELETE FAMILY
router.delete("/families/:id", validateParams(idSchema), async (req, res) => {

  try {

    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(404).json({
        message: "Family not found"
      });
    }

    await Family.findByIdAndDelete(req.params.id);

    res.json({
      message: "Family deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

});

router.put(
  "/families/:id",
  validateParams(idSchema),
  validate(familySchema),
  async (req, res) => {

    try {
          const { groups } = req.body;

    const existingGroups = await Group.countDocuments({
      _id: { $in: groups }
    });

    if (existingGroups !== groups.length) {
      return res.status(400).json({
        message: "One or more group IDs are invalid"
      });
    }
//

      const updatedFamily = await Family.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedFamily) {
        return res.status(404).json({
          message: "Family not found"
        });
      }

      res.json(updatedFamily);

    } catch (error) {

      res.status(500).json({
        message: "Server error",
        error: error.message
      });

    }

});

export default router;