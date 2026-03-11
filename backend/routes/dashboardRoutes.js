import express from "express";
import Tag from "../models/Tag.js";
import Group from "../models/Group.js";
import Family from "../models/Family.js";

const router = express.Router();

router.get("/dashboard", async (req, res) => {

  try {

    const tagCount = await Tag.countDocuments();
    const groupCount = await Group.countDocuments();
    const familyCount = await Family.countDocuments();

    res.json({
      tags: tagCount,
      groups: groupCount,
      families: familyCount
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

});

export default router;