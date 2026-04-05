'use server';

import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';
import { revalidatePath } from 'next/cache';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// S3 Client 초기화 (로컬 환경 지원 목적 등 필요시 옵션 추가)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test1234',
  },
  ...(process.env.NODE_ENV === 'development' && {
    endpoint: process.env.AWS_S3_ENDPOINT || 'http://localhost:4566',
    forcePathStyle: true,
  }),
});

export async function getPortfolioCategoriesAction(expertId: number) {
  try {
    const categories = await prisma.portfolioCategory.findMany({
      where: { expertId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { portfolios: true }
        }
      }
    });
    
    const totalCount = await prisma.portfolio.count({
      where: { expertId }
    });

    return { success: true, data: categories, totalCount };
  } catch (error) {
    console.error('Error fetching portfolio categories:', error);
    return { success: false, error: '카테고리를 불러오는데 실패했습니다.' };
  }
}

export async function createPortfolioCategoryAction(expertId: number, name: string) {
  try {
    // get max order
    const maxOrderCat = await prisma.portfolioCategory.findFirst({
      where: { expertId },
      orderBy: { order: 'desc' },
    });
    const order = maxOrderCat ? maxOrderCat.order + 1 : 0;

    const category = await prisma.portfolioCategory.create({
      data: {
        expertId,
        name,
        order,
      },
    });
    revalidatePath('/expert/portfolio');
    return { success: true, data: category };
  } catch (error) {
    console.error('Error creating portfolio category:', error);
    return { success: false, error: '카테고리 생성에 실패했습니다.' };
  }
}

export async function fetchOpenGraphDataAction(url: string) {
  try {
    let currentUrl = url;
    let response = await fetch(currentUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch URL');
    }

    let html = await response.text();
    let $ = cheerio.load(html);

    // Check for iframe/frame wrapper (e.g. Naver Blog)
    const frameSrc = $('frame#mainFrame').attr('src') || $('iframe#mainFrame').attr('src');
    if (frameSrc) {
      currentUrl = new URL(frameSrc, currentUrl).toString();
      response = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        },
        next: { revalidate: 3600 }
      });
      if (response.ok) {
        html = await response.text();
        $ = cheerio.load(html);
      }
    }

    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    let description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    let image = $('meta[property="og:image"]').attr('content') || '';
    
    let contentArray: string[] = [];

    // Deep extraction for Naver Blog PostView
    if ($('.se-main-container').length) {
       const $root = $('.se-main-container').first();
       
       // 1. Strip trackers, scripts, and useless items safely
       $root.find('script, iframe, style, .se-sticker, img[src*="tracker"], img[src*="ico_"], .se-oglink-info').remove();

       // 2. Process all images for native fluid delivery
       $root.find('img').each((_, img) => {
           const $img = $(img);
           let src = $img.attr('data-lazy-src') || $img.attr('src') || '';
           if (!src || src.includes('sticker') || src.includes('tracker')) {
               $img.remove();
               return;
           }

           // Swap lazy loader to real high-res
           src = src.replace('w80_blur', 'w966').replace(/type=[a-zA-Z0-9_]+blur/, 'type=w966');
           $img.attr('src', src);
           $img.removeAttr('data-lazy-src');

           // Percentage ratio scaling logic based on px vs 880 metrics
           const styleStr = $img.attr('style') || '';
           const parentWidthStr = $img.closest('.se-module').attr('style') || '';
           const parentWidthMatch = parentWidthStr.match(/width:\s*([0-9.]+)%/);

           let targetWidth = '100%';
           if (parentWidthMatch) {
               targetWidth = parentWidthMatch[1] + '%';
           } else {
               let pxMatch = styleStr.match(/width:\s*([0-9.]+)px/);
               if (pxMatch && parseFloat(pxMatch[1]) > 0 && parseFloat(pxMatch[1]) < 850) {
                   targetWidth = Math.min(100, (parseFloat(pxMatch[1]) / 880) * 100).toFixed(2) + '%';
               }
           }
           $img.attr('style', `width: ${targetWidth}; max-width: 100%; height: auto; border-radius: 8px;`);
           $img.removeAttr('width').removeAttr('height');
       });

       // 3. Bake structural CSS classes directly into inline styling so the layout holds in SunEditor
       $root.find('.se-text-paragraph').each((_, p) => {
           const $p = $(p);
           let pStyles = ['line-height: 1.8', 'margin-bottom: 15px', 'word-break: break-word'];
           if ($p.hasClass('se-text-paragraph-align-center')) pStyles.push('text-align: center');
           else if ($p.hasClass('se-text-paragraph-align-right')) pStyles.push('text-align: right');
           else if ($p.hasClass('se-text-paragraph-align-justify')) pStyles.push('text-align: justify');
           
           let curStyle = $p.attr('style') || '';
           if (pStyles.length > 0) $p.attr('style', (curStyle + ';' + pStyles.join(';')).replace(/;;/g, ';'));
       });

       $root.find('span').each((_, span) => {
           const $s = $(span);
           const cls = $s.attr('class') || '';
           let sStyles = [];
           const fsMatch = cls.match(/se-fs([0-9]+)/);
           if (fsMatch) sStyles.push(`font-size: ${fsMatch[1]}px`);
           if (cls.includes('se-fw-bold') || cls.includes('se-fw-heavy')) sStyles.push('font-weight: bold');
           
           let curStyle = $s.attr('style') || '';
           if (sStyles.length > 0) $s.attr('style', (curStyle + ';' + sStyles.join(';')).replace(/;;/g, ';'));
       });

       // 4. Translate complex flex wrap structures into immutable HTML tables for bulletproof WYSIWYG compatibility
       // Map strictly by .se-imageGroup-item or .se-imageStrip-container to preserve structured multi-image columns
       $root.find('.se-imageGroup, .se-l-collage, .se-imageStrip').each((_, group) => {
           const $group = $(group);
           
           // Support both legacy .se-imageGroup-item and newer .se-imageStrip formats
           let $items = $group.find('.se-imageGroup-item, .se-imageStrip-container > .se-module-image');
           
           if ($items.length === 0) {
               if ($group.hasClass('se-imageGroup-item')) {
                   $items = $group;
               } else {
                   return; // Skip if no structured columns exist (fallback to normal rendering)
               }
           }
               const tdWidth = (100 / $items.length).toFixed(2);
               let tdsHtml = '';
               
               $items.each((_, item) => {
                   const $item = $(item);
                   let innerImgsHtml = '';
                   $item.find('img').each((_, img) => {
                       const src = $(img).attr('src') || '';
                       if (src) {
                           innerImgsHtml += `<img src="${src}" style="width: 100%; height: auto; border-radius: 8px; display: block; margin-bottom: 8px;" />`;
                       }
                   });
                   
                   if (innerImgsHtml) {
                       tdsHtml += `<td width="${tdWidth}%" style="width: ${tdWidth}%; padding: 4px; vertical-align: top; display: table-cell !important; word-break: break-all;">
                           <div style="margin: 0; padding: 0;">${innerImgsHtml}</div>
                       </td>`;
                   }
               });
               
               if (tdsHtml) {
                   const tableHtml = `<table style="width: 100%; border-collapse: collapse; border: none; margin: 16px auto; table-layout: fixed; display: table !important;"><tbody><tr style="display: table-row !important;">${tdsHtml}</tr></tbody></table>`;
                   $group.replaceWith(tableHtml);
               } else {
                   $group.remove();
               }
       });

       $root.find('.se-component').each((_, comp) => {
           const $c = $(comp);
           const cls = $c.attr('class') || '';
           let compStyle = 'margin-bottom: 30px;'; // Enforce native Naver vertical spacing
           if (cls.includes('se-l-left') || cls.includes('align-left')) {
               compStyle += ' float: left; margin: 0 20px 16px 0;';
           } else if (cls.includes('se-l-right') || cls.includes('align-right')) {
               compStyle += ' float: right; margin: 0 0 16px 20px;';
           }
           $c.attr('style', ($c.attr('style') || '') + ';' + compStyle);
       });

       contentArray.push($root.html() || '');
    } else if ($('.article_view, .tt_article_useless_p_margin, article').length) {
       const $root = $('.article_view, .tt_article_useless_p_margin, article').first();
       
       $root.find('script, iframe, style, figure[data-ke-type="emoticon"]').remove();

       $root.find('img').each((_, img) => {
           const $img = $(img);
           let src = $img.attr('data-lazy-src') || $img.attr('data-original') || $img.attr('src') || '';
           if (src && !src.includes('daumcdn.net/map') && !src.includes('tracker')) {
               $img.attr('src', src);
               
               let targetWidth = '100%';
               let pxMatch = ($img.attr('style')||'').match(/width:\s*([0-9.]+)px/);
               if (pxMatch && parseFloat(pxMatch[1]) > 0 && parseFloat(pxMatch[1]) < 850) {
                   targetWidth = Math.min(100, (parseFloat(pxMatch[1]) / 880) * 100).toFixed(2) + '%';
               }
               
               const cls = $img.attr('class') || '';
               const curStyle = $img.attr('style') || '';
               let alignStyle = '';
               if (cls.includes('alignleft') || curStyle.includes('float: left')) {
                   alignStyle = 'float: left; margin: 0 20px 16px 0;';
               } else if (cls.includes('alignright') || curStyle.includes('float: right')) {
                   alignStyle = 'float: right; margin: 0 0 16px 20px;';
               } else {
                   alignStyle = 'display: block; margin: 16px auto;';
               }
               
               $img.attr('style', `width: ${targetWidth}; max-width: 100%; height: auto; border-radius: 8px; ${alignStyle}`);
               $img.removeAttr('width').removeAttr('height').removeAttr('data-lazy-src').removeAttr('data-original');
           } else {
               $img.remove();
           }
       });

       contentArray.push($root.html() || '');
    }
    
    const scrapedFullContent = contentArray.join('');

    // Fallbacks
    if (!description || description.trim() === '') {
      description = scrapedFullContent.replace(/!\[img\]\([^)]+\)/g, '').replace(/\s+/g, ' ').substring(0, 200).trim();
    }

    if (!image) {
      // Find first image tag inside contentArray
      const firstImgTag = contentArray.find(s => s.startsWith('![img]('));
      if (firstImgTag) {
         image = firstImgTag.slice(7, -1);
      } else {
        const naverImage = $('.se-image-resource').first().attr('src') || $('.se-main-container img').first().attr('src');
        if (naverImage) image = naverImage;
      }
    }

    // Generic Fallback image search if everything else fails
    if (!image) {
      const firstImg = $('img').first().attr('src');
      if (firstImg) {
        image = firstImg.startsWith('http') ? firstImg : new URL(firstImg, currentUrl).toString();
      }
    }

    // Clean up title generic Naver title if possible
    if (title.includes('네이버 공식블로그') || title === '네이버 블로그') {
      const contentTitle = $('.se-title-text').text().trim();
      if (contentTitle) title = contentTitle;
    }

    const { newContent, newThumbnailUrl } = await syncExternalImagesToS3(scrapedFullContent || description, image);

    return { success: true, data: { title, description, content: newContent, image: newThumbnailUrl, url } };
  } catch (error) {
    console.error('Error fetching open graph data:', error);
    return { success: false, error: '블로그 정보를 가져오는데 실패했습니다.' };
  }
}

interface CreatePortfolioParams {
  expertId: number;
  categoryId: number | null;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  blogUrl: string | null;
  isImported: boolean;
}

// 헬퍼: 외부 이미지 S3로 일괄 업로드
async function syncExternalImagesToS3(content: string, thumbnailUrl: string | null) {
  let newContent = content || '';
  let newThumbnailUrl = thumbnailUrl;

  const extractUrls = (text: string) => {
    const urls: string[] = [];
    const regex1 = /<img[^>]+src=["']([^"']+)["']/g;
    const regex2 = /!\[img\]\(([^)]+)\)/g;
    let match;
    while ((match = regex1.exec(text)) !== null) if (match[1].startsWith('http')) urls.push(match[1]);
    while ((match = regex2.exec(text)) !== null) if (match[1].startsWith('http')) urls.push(match[1]);
    return urls;
  };

  const urlsToProcess = extractUrls(newContent);
  if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
     if (!urlsToProcess.includes(thumbnailUrl)) {
        urlsToProcess.push(thumbnailUrl);
     }
  }

  const uniqueUrls = Array.from(new Set(urlsToProcess)).filter(url => 
    !url.includes('onepick-storage') && 
    !url.includes(process.env.AWS_S3_ENDPOINT || 'localhost')
  );

  const urlMap: Record<string, string> = {};

  for (const url of uniqueUrls) {
    try {
       // Sequential execution prevents Naver simultaneous connection bans
       // Also add a cache buster explicitly to bust Next.js overly aggressive internal 403 caching
       const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'onepick_cb=' + Date.now(), {
         headers: { 
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
           'Referer': 'https://blog.naver.com/'
         },
         cache: 'no-store'
       });
       
       if (!res.ok) {
           console.warn(`Failed to fetch image naturally: ${url} (HTTP ${res.status})`);
           continue;
       }
       
       const arrayBuffer = await res.arrayBuffer();
       const buffer = Buffer.from(arrayBuffer);
       
       const bucketName = process.env.AWS_S3_BUCKET || "onepick-storage";
       const contentType = res.headers.get('content-type') || 'image/jpeg';
       let ext = contentType.split('/')[1] || 'jpg';
       if (ext === 'jpeg') ext = 'jpg';
       
       const fileName = `portfolios/imported-${uuidv4()}.${ext}`;

       const command = new PutObjectCommand({
         Bucket: bucketName,
         Key: fileName,
         Body: buffer,
         ContentType: contentType,
         ACL: "public-read",
       });

       await s3Client.send(command);
       const fileUrl = `${process.env.AWS_S3_ENDPOINT || "http://localhost:4566"}/${bucketName}/${fileName}`;
       urlMap[url] = fileUrl;
       
       // Minor delay to avoid Naver's aggressive sequential bot rate limiting (50ms was far too short, leading to invisible next-images)
       await new Promise(resolve => setTimeout(resolve, 600));
    } catch (e) {
       console.error("Failed to upload external image: ", url, e);
    }
  }

  // Debug summary
  console.log(`[Image Sync] Processed ${uniqueUrls.length} urls, successfully mapped ${Object.keys(urlMap).length}`);

  for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
     newContent = newContent.split(oldUrl).join(newUrl);
     if (newThumbnailUrl === oldUrl) {
         newThumbnailUrl = newUrl;
     }
  }

  return { newContent, newThumbnailUrl };
}

export async function createPortfolioAction(data: any) {
  try {
    const { newContent, newThumbnailUrl } = await syncExternalImagesToS3(data.content, data.thumbnailUrl);
    const portfolio = await prisma.portfolio.create({
      data: {
        expertId: data.expertId,
        categoryId: data.categoryId,
        title: data.title,
        content: newContent,
        thumbnailUrl: newThumbnailUrl,
        blogUrl: data.blogUrl,
        isImported: data.isImported,
      },
    });
    revalidatePath('/expert/portfolio');
    return { success: true, data: portfolio };
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return { success: false, error: '포트폴리오 생성에 실패했습니다.' };
  }
}

export async function updatePortfolioAction(id: number, data: any) {
  try {
    const { newContent, newThumbnailUrl } = await syncExternalImagesToS3(data.content, data.thumbnailUrl);

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        title: data.title,
        content: newContent,
        thumbnailUrl: newThumbnailUrl,
        blogUrl: data.blogUrl,
      },
    });
    revalidatePath('/expert/portfolio');
    return { success: true, data: portfolio };
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return { success: false, error: '포트폴리오 수정에 실패했습니다.' };
  }
}

export async function getPortfoliosAction(expertId: number, categoryId?: number | null) {
  try {
    const whereClause: any = { expertId };
    if (categoryId !== undefined && categoryId !== null) {
      whereClause.categoryId = categoryId;
    }
    
    const portfolios = await prisma.portfolio.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      }
    });
    return { success: true, data: portfolios };
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return { success: false, error: '포트폴리오를 불러오는데 실패했습니다.' };
  }
}

export async function getPortfolioDetailAction(id: number) {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: { category: true }
    });
    if (!portfolio) {
      return { success: false, error: '포트폴리오를 찾을 수 없습니다.' };
    }
    return { success: true, data: portfolio };
  } catch (error) {
    console.error('Error fetching portfolio detail:', error);
    return { success: false, error: '포트폴리오 상세를 불러오는데 실패했습니다.' };
  }
}

export async function uploadPortfolioImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      return { success: false, error: '업로드할 파일이 없습니다.' };
    }

    const bucketName = process.env.AWS_S3_BUCKET || "onepick-storage";
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `portfolios/${uuidv4()}-${file.name}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read",
    });

    await s3Client.send(command);
    const fileUrl = `${process.env.AWS_S3_ENDPOINT || "http://localhost:4566"}/${bucketName}/${fileName}`;
    return { success: true, data: fileUrl };
  } catch (error) {
    console.error("uploadPortfolioImageAction error:", error);
    return { success: false, error: '이미지 업로드에 실패했습니다.' };
  }
}

export async function deletePortfolioAction(id: number) {
  try {
    await prisma.portfolio.delete({
      where: { id }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting portfolio:', error);
    return { success: false, error: '포트폴리오 삭제를 실패했습니다.' };
  }
}
