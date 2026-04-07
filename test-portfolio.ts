import { createPortfolioAction } from './src/actions/portfolio.action';

async function test() {
  const result = await createPortfolioAction({
    expertId: 1, // Need an existing expert ID
    categoryId: null,
    title: "Test Import",
    content: "Test Content",
    thumbnailUrl: "https://blog.kakaocdn.net/dn/bHkK2l/btqA2JqP0bB/gKz1b7R0H47r8Q/img.jpg",
    blogUrl: "https://blog.naver.com/test",
    isImported: true,
    seoTags: "test",
  });
  console.log(result);
}

test();
