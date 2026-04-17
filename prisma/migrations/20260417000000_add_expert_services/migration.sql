-- CreateTable
CREATE TABLE "_ExpertServices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ExpertServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ExpertServices_B_index" ON "_ExpertServices"("B");

-- AddForeignKey
ALTER TABLE "_ExpertServices" ADD CONSTRAINT "_ExpertServices_A_fkey" FOREIGN KEY ("A") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExpertServices" ADD CONSTRAINT "_ExpertServices_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
