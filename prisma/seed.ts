import { PrismaClient } from "@prisma/client";
import { SEED_OPPORTUNITIES } from "../src/lib/opportunity-data";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.opportunity.count();
  if (existing > 0) {
    console.log(`Skipping seed — ${existing} opportunities already present.`);
    return;
  }

  for (const opp of SEED_OPPORTUNITIES) {
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

  console.log(`Seeded ${SEED_OPPORTUNITIES.length} opportunities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
