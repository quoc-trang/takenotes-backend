import { Router } from "express";
import { bucket } from "../lib/gcs";

const router = Router();

router.post("/image", async (req, res) => {
  const { filename, contentType } = req.body;

  //  this line tell gcs where the file should live
  const file = bucket.file(`notetaking/${Date.now()}-${filename}`);

  // generate a signed url for upload and getting the image from gcs
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  res.json({
    signedUrl: url,
    filenameInGCS: file.name,
  });
});

router.get("/image", async (req, res) => {
  const { filenameInGCS } = req.query;

  if (!filenameInGCS || typeof filenameInGCS !== "string") {
    return res
      .status(400)
      .json({ message: "Missing filenameInGCS in get image api" });
  }

  const file = bucket.file(filenameInGCS as string);

  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 10 * 60 * 1000,
  });

  res.json({ imageUrl: url });
});

export default router;
