-- Add clientName column to Document table
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "clientName" VARCHAR(255);

-- Update existing documents with client names from enquiry data
UPDATE "Document" 
SET "clientName" = COALESCE(
  (SELECT COALESCE("name", "businessName", 'Enquiry ' || "Document"."enquiryId") 
   FROM "Enquiry" 
   WHERE "Enquiry".id = "Document"."enquiryId"),
  'Unknown Client'
)
WHERE "clientName" IS NULL OR "clientName" = '';

-- Verify the update
SELECT 
  id,
  "enquiryId",
  "clientName",
  type,
  verified,
  "uploadedAt"
FROM "Document"
ORDER BY "uploadedAt" DESC;
