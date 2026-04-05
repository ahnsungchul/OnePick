const { fetchOpenGraphDataAction } = require('./src/actions/portfolio.action');
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function fixOldPortfolios() {
  const portfolios = await prisma.portfolio.findMany({
    where: { isImported: true }
  });

  console.log(`Found ${portfolios.length} imported portfolios to fix...`);

  for (const p of portfolios) {
    if (!p.blogUrl) continue;
    console.log(`Fetching ${p.blogUrl} for portfolio ${p.id}...`);
    try {
        const res = await fetchOpenGraphDataAction(p.blogUrl);
        if (res.success && res.data && res.data.content) {
            // Note: res.data.content is already uploaded to S3 if sync is inside fetchOpenGraphDataAction!
            // Wait, fetchOpenGraphDataAction now does syncExternalImagesToS3!
            
            await prisma.portfolio.update({
                where: { id: p.id },
                data: {
                    content: res.data.content,
                    thumbnailUrl: res.data.image || p.thumbnailUrl,
                    title: res.data.title || p.title
                }
            });
            console.log(`Success: Updated portfolio ${p.id} with new HTML!`);
        } else {
            console.log(`Failed to fetch for portfolio ${p.id}`, res.error);
        }
    } catch(e) {
        console.error(e);
    }
  }
}
fixOldPortfolios();
