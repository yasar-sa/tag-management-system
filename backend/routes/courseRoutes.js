import express from "express";
import Course from "../models/Course.js";

const router = express.Router();

router.get("/courses", async (req, res) => {

  try {

    const courses = await Course.find()
      .populate("group", "name");

    res.json(courses);

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

});

// create course
router.post("/courses", async (req, res) => {

  try {

    const course = new Course({
      name: req.body.name
    });

    await course.save();

    res.status(201).json(course);

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

});

export default router;