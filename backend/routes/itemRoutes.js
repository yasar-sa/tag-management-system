import express from "express";
import Item from "../models/Item.js"; 

const router = express.Router();

// ── GET  
router.get("/items", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── POST  
router.post("/items", async (req, res) => {
  try {
    const item = new Item({
      itemCode: req.body.itemCode ?? "",
      label:    req.body.label    ?? "New question",
      score:    req.body.score    ?? 0,
      tags:     req.body.tags     ?? [],
    });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── PUT  
router.put("/items/:id", async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        itemCode: req.body.itemCode,
        label:    req.body.label,
        score:    req.body.score,
        tags:     req.body.tags,
      },
      { new: true } // return the updated document
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── DELETE 
router.delete("/items/:id", async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;