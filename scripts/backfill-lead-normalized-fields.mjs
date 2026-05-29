import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI before running this script.");
}

const normalizeEmail = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

const normalizePhone = (value) => {
  if (!value) return "";
  return String(value).replace(/\D/g, "");
};

const leadSchema = new mongoose.Schema({}, { strict: false, collection: "leads" });
const Lead = mongoose.models.LeadBackfill || mongoose.model("LeadBackfill", leadSchema);

async function run() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  const cursor = Lead.find({}, { _id: 1, email: 1, phone: 1 }).cursor();
  const ops = [];
  let scanned = 0;
  let updated = 0;

  for await (const lead of cursor) {
    scanned += 1;
    const emailNormalized = normalizeEmail(lead.email);
    const phoneNormalized = normalizePhone(lead.phone);

    ops.push({
      updateOne: {
        filter: { _id: lead._id },
        update: {
          $set: {
            emailNormalized: emailNormalized || null,
            phoneNormalized: phoneNormalized || null,
          },
        },
      },
    });

    if (ops.length >= 500) {
      const result = await Lead.bulkWrite(ops, { ordered: false });
      updated += result.modifiedCount || 0;
      ops.length = 0;
    }
  }

  if (ops.length > 0) {
    const result = await Lead.bulkWrite(ops, { ordered: false });
    updated += result.modifiedCount || 0;
  }

  await Lead.collection.createIndex(
    { organizationId: 1, emailNormalized: 1 },
    {
      unique: true,
      partialFilterExpression: { emailNormalized: { $exists: true, $ne: "" } },
      name: "org_emailNormalized_unique",
    }
  );

  await Lead.collection.createIndex(
    { organizationId: 1, phoneNormalized: 1 },
    {
      unique: true,
      partialFilterExpression: { phoneNormalized: { $exists: true, $ne: "" } },
      name: "org_phoneNormalized_unique",
    }
  );

  console.log(`Scanned: ${scanned}, Updated: ${updated}`);
  console.log("Backfill complete and indexes created.");
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Backfill failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
