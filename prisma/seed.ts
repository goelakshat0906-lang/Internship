import { PrismaClient } from "@prisma/client";
import { SEED_OPPORTUNITIES, SUMMER_2027_OPPORTUNITIES } from "../src/lib/opportunity-data";

const prisma = new PrismaClient();

async function main() {
  const allSeeds = [...SEED_OPPORTUNITIES, ...SUMMER_2027_OPPORTUNITIES];
  const existingUrls = new Set((await prisma.opportunity.findMany({ select: { sourceUrl: true } })).map((o) => o.sourceUrl));
  const toInsert = allSeeds.filter((opp) => !existingUrls.has(opp.sourceUrl));

  if (toInsert.length === 0) {
    console.log(`Skipping seed — all ${allSeeds.length} opportunities already present.`);
    return;
  }

  for (const opp of toInsert) {
    await prisma.opportunity.create({
      data: {
        title: opp.title,
        organization: opp.organization,
        orgType: opp.orgType,
        domain: opp.domain,
        location: opp.location,
        region: opp.region,
        season: opp.season,
        level: opp.level,
        deadline: opp.deadline ? new Date(opp.deadline) : null,
        stipendEstimate: opp.stipendEstimate,
        housingSupport: opp.housingSupport,
        visaSupport: opp.visaSupport,
        description: opp.description,
        responsibilities: opp.responsibilities.join("\n"),
        qualifications: opp.qualifications.join("\n"),
        techStack: opp.techStack.join(", "),
        sourceUrl: opp.sourceUrl,
        userStatus: "discovered",
      },
    });
  }

  console.log(`Seeded ${toInsert.length} new opportunities (${allSeeds.length - toInsert.length} already present).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
