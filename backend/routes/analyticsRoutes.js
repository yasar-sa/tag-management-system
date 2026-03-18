import express from 'express'
import Item from '../models/Item.js'
import Group from '../models/Group.js'
import Family from '../models/Family.js'

const router = express.Router();

// router.get("/analytics", async (req, res) => {

// const tagScores = await Item.aggregate([
//   { $unwind: "$tags" },

//   {
//     $group: {
//       _id: "$tags",
//       score: { $avg: "$score" }
//     }
//   },

//   {
//     $lookup: {
//       from: "tags",
//       localField: "_id",
//       foreignField: "_id",
//       as: "tag"
//     }
//   },

//   { $unwind: "$tag" },

//   {
//     $project: {
//       _id: "$tag._id",
//       name: "$tag.name",
//       score: { $round: ["$score", 0] }
//     }
//   }
// ]);
// const groupScores = await Group.aggregate([

//   {
//     $lookup: {
//       from: "items",
//       localField: "tags",
//       foreignField: "tags",
//       as: "items"
//     }
//   },

//   { $unwind: "$items" },

//   {
//     $group: {
//       _id: "$_id",
//       name: { $first: "$name" },
//       score: { $avg: "$items.score" }
//     }
//   },

//   {
//     $project: {
//       name: 1,
//       score: { $round: ["$score", 0] }
//     }
//   }

// ]);
// const familyScores = await Family.aggregate([

//   {
//     $lookup: {
//       from: "groups",
//       localField: "groups",
//       foreignField: "_id",
//       as: "groupDetails"
//     }
//   },

//   { $unwind: "$groupDetails" },

//   {
//     $lookup: {
//       from: "items",
//       localField: "groupDetails.tags",
//       foreignField: "tags",
//       as: "items"
//     }
//   },

//   { $unwind: "$items" },

//   {
//     $group: {
//       _id: "$_id",
//       name: { $first: "$name" },
//       score: { $avg: "$items.score" }
//     }
//   },

//   {
//     $project: {
//       name: 1,
//       score: { $round: ["$score", 0] }
//     }
//   }

// ]);
//  res.json({
//    tags: tagScores,
//    groups: groupScores,
//    families: familyScores
//  });

// });

router.get("/analytics", async (req, res) => {
  try {

    const analytics = await Item.aggregate([

      {
        $facet: {

          /* ---------------- TAG SCORES ---------------- */
          tags: [

            { $unwind: "$tags" },

            {
              $group: {
                _id: "$tags",
                score: { $avg: "$score" }
              }
            },

            {
              $lookup: {
                from: "tags",
                localField: "_id",
                foreignField: "_id",
                as: "tag"
              }
            },

            { $unwind: "$tag" },

            {
              $project: {
                _id: "$tag._id",
                name: "$tag.name",
                score: { $round: ["$score", 0] }
              }
            }

          ],

          /* ---------------- GROUP SCORES ---------------- */
          groups: [

            {
              $lookup: {
                from: "groups",
                localField: "tags",
                foreignField: "tags",
                as: "group"
              }
            },

            { $unwind: "$group" },

            {
              $group: {
                _id: "$group._id",
                name: { $first: "$group.name" },
                score: { $avg: "$score" }
              }
            },

            {
              $project: {
                name: 1,
                score: { $round: ["$score", 0] }
              }
            }

          ],

          /* ---------------- FAMILY SCORES ---------------- */
          families: [

            {
              $lookup: {
                from: "groups",
                localField: "tags",
                foreignField: "tags",
                as: "group"
              }
            },

            { $unwind: "$group" },

            {
              $lookup: {
                from: "families",
                localField: "group._id",
                foreignField: "groups",
                as: "family"
              }
            },

            { $unwind: "$family" },

            {
              $group: {
                _id: "$family._id",
                name: { $first: "$family.name" },
                score: { $avg: "$score" }
              }
            },

            {
              $project: {
                name: 1,
                score: { $round: ["$score", 0] }
              }
            }

          ]

        }
      }

    ]);

    res.json(analytics[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;