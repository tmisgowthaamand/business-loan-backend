-- Add clientName column to Document table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Document' 
        AND column_name = 'clientName'
    ) THEN
        ALTER TABLE "Document" ADD COLUMN "clientName" VARCHAR(255);
        
        -- Update existing records with client names from enquiry data
        UPDATE "Document" 
        SET "clientName" = COALESCE(e.name, e."businessName", 'Unknown Client')
        FROM "Enquiry" e 
        WHERE "Document"."enquiryId" = e.id 
        AND "Document"."clientName" IS NULL;
        
        RAISE NOTICE 'Added clientName column to Document table and populated existing records';
    ELSE
        RAISE NOTICE 'clientName column already exists in Document table';
    END IF;
END $$;
