const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pdfs = [
    {
      filename: 'English_Tenses_Beginners_Notes.pdf',
      title: 'Tenses Formulas',
      description: 'Formulas For Beginners',
      category: 'Grammar',
      pages: 8,
      url: '/pdfs/English_Tenses_Beginners_Notes.pdf',
      blobUrl: null,
    },
    {
      filename: 'English_Tenses_Usage.pdf',
      title: 'English Tenses — Usage Guide',
      description: 'When to Use Each Tense — Beginner Friendly with Formulas, Examples & Usage',
      category: 'Grammar',
      pages: 11,
      url: '/pdfs/English_Tenses_Usage.pdf',
      blobUrl: null,
    },
  ];

  for (const pdf of pdfs) {
    await prisma.pdfDocument.upsert({
      where: { filename: pdf.filename },
      update: {},
      create: pdf,
    });
  }

  console.log('Seeded', pdfs.length, 'PDF documents.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
