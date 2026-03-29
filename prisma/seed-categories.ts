import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

const categories = {
  '도배/장판': ['도배 시공', '장판 시공', '마루 시공', '타일 시공', '페인트 시공', '부분 보수'],
  '욕실/주방': ['욕실 리모델링', '싱크대 교체', '수전/배관 수리', '환풍기/후드 설치', '줄눈 시공'],
  '전기/조명': ['조명 설치/수리', '스위치/콘센트 교체', '누전 수리', '차단기 교체'],
  '청소/이사': ['이사청소', '입주청소', '거주청소', '원룸이사', '가정이사', '용달/화물'],
  '가전/에어컨': ['에어컨 수리/설치', '에어컨 분해청소', '냉장고 수리', '세탁기 수리/청소', 'TV 설치'],
  '자동차 수리': ['외형 복원/도색', '경정비', '세차/광택', '블랙박스/내비게이션 장착'],
  '베이비/펫시터': ['베이비시터', '등하원 도우미', '펫시터', '반려견 산책', '가사 도우미'],
  '과외/레슨': ['영어/외국어', '수학/과학', '보컬/악기', '피트니스/요가', '프로그래밍/IT'],
  '디자인/IT': ['로고 디자인', '웹/앱 개발', '영상 편집', '번역/통역', '마케팅/기획'],
  '기타 서비스': ['심부름/대행', '결혼식 하객 대행', '반려동물 장례', '법률/세무 상담', '기타'],
};

async function main() {
  console.log('Seeding categories and services...');
  
  let orderIndex = 0;
  for (const [catName, subCats] of Object.entries(categories)) {
    // 1. 카테고리 생성 (또는 업데이트)
    const category = await prisma.category.upsert({
      where: { name: catName },
      update: { order: orderIndex },
      create: {
        name: catName,
        order: orderIndex,
      },
    });
    console.log(`Created category: ${category.name}`);

    // 2. 하위 서비스 생성
    let subOrderIndex = 0;
    for (const subCat of subCats) {
      await prisma.service.upsert({
        where: { name_categoryId: { name: subCat, categoryId: category.id } },
        update: { order: subOrderIndex },
        create: {
          name: subCat,
          categoryId: category.id,
          order: subOrderIndex,
        },
      });
      subOrderIndex++;
    }
    
    orderIndex++;
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
