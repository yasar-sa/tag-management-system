import express from "express";
import Tag from "../models/Tag.js";
import Group from "../models/Group.js";
import Family from "../models/Family.js";

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const totalTags = await Tag.countDocuments();

    const activeTags = await Tag.countDocuments({ isActive: true });

    const inactiveTags = await Tag.countDocuments({ isActive: false });

    const totalGroups = await Group.countDocuments();

    const totalFamilies = await Family.countDocuments();

    res.json({
      tags: totalTags,
      groups: totalGroups,
      families: totalFamilies,
      activeTags,
      inactiveTags
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

export default router;