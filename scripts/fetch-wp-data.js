import axios from 'axios';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDataDir = path.resolve(__dirname, '../public/data/');
const publicFilesDir = path.resolve(__dirname, '../public/files/');
const API_URL = 'https://backend.ddev.site/wp-json/wp/v2';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

if (!fs.existsSync(publicFilesDir)) fs.mkdirSync(publicFilesDir, { recursive: true });

const saveNestedJson = (relPath, data) => {
    const fullPublicPath = path.join(publicDataDir, relPath)
    const publicDirPath = path.dirname(fullPublicPath)

    if (!fs.existsSync(publicDirPath)) fs.mkdirSync(publicDirPath, { recursive: true })
    fs.writeFileSync(fullPublicPath, JSON.stringify(data))

    const isBuilding = fs.existsSync(path.resolve(__dirname, 'dist'))
    if (isBuilding) {
        const fullDistPath = path.join(distDataDir, relPath)
        const distDirPath = path.dirname(fullDistPath)

        if (!fs.existsSync(distDirPath)) fs.mkdirSync(distDirPath, { recursive: true })
        fs.writeFileSync(fullDistPath, JSON.stringify(data))
    }
}

const downloadImage = async (url) => {
    if (!url) return null;
    const filename = path.basename(new URL(url).pathname);
    const filepath = path.join(publicFilesDir, filename);

    if (fs.existsSync(filepath)) return `/files/${filename}`;

    console.log(`Pobieranie pliku: ${filename}...`);
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', httpsAgent });
        fs.writeFileSync(filepath, Buffer.from(response.data));
        return `/files/${filename}`;
    } catch (error) {
        console.error(`Błąd pobierania pliku: ${url}`);
        return url;
    }
}

const processAllImages = async (obj) => {
    if (typeof obj === 'string' && obj.includes('wp-content/uploads') && /\.(jpe?g|gif|png|webp|svg)/i.test(obj)) {
        return await downloadImage(obj);
    }

    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = await processAllImages(obj[i]);
        }
        return obj;
    }

    if (obj !== null && typeof obj === 'object') {
        for (const key in obj) {
            obj[key] = await processAllImages(obj[key]);
        }
        return obj;
    }

    return obj;
};

const fetchAllPages = async (url) => {
    const perPage = 100
    const separator = url.includes('?') ? '&' : '?'

    const firstUrl = `${url}${separator}per_page=${perPage}&page=1`
    const firstResponse = await axios.get(firstUrl, { httpsAgent })
    const totalPages = parseInt(firstResponse.headers['x-wp-totalpages'] || '1', 10)

    let results = [...firstResponse.data]

    for (let page = 2; page <= totalPages; page++) {
        const { data } = await axios.get(`${url}${separator}per_page=${perPage}&page=${page}`, { httpsAgent })
        results = results.concat(data)
    }

    return results
}

async function run() {
    console.log('Pobieranie danych z WordPressa...');
    const generatedRoutes = [];

    // === 1. PAGES ===
    const pages = await fetchAllPages(`${API_URL}/pages?_embed&acf_format=standard`)

    for (const page of pages) {
        if (page._embedded && page._embedded['wp:featuredmedia']) {
            const media = page._embedded['wp:featuredmedia'][0];
            if (media && media.source_url) {
                media.source_url = await downloadImage(media.source_url);
            }
        }

        if (page.acf) {
            page.acf = await processAllImages(page.acf);
        }

        const lang = page.acf?.lang || page.meta?.lang || 'pl'
        const template = page.acf?.template || page.meta?.template || (page.slug === 'home' ? 'home' : 'default')

        let routePath = ''
        let jsonPath = ''

        if (template === 'home') {
            routePath = lang === 'pl' ? '/' : `/${lang}`
            jsonPath = lang === 'pl' ? 'index.json' : `${lang}/index.json`
        } else {
            const cleanSlug = page.slug.replace(/-\d+$/, '')
            routePath = lang === 'pl' ? `/${cleanSlug}` : `/${lang}/${cleanSlug}`
            jsonPath = lang === 'pl' ? `${cleanSlug}.json` : `${lang}/${cleanSlug}.json`
        }

        saveNestedJson(jsonPath, page)
        if (routePath !== '/') generatedRoutes.push(routePath)
    }

    // === 2. POSTS === (Projects)
    const posts = await fetchAllPages(`${API_URL}/posts?_embed&acf_format=standard`)
    const aggregatedPosts = {}

    for (const post of posts) {
        if (post._embedded && post._embedded['wp:featuredmedia']) {
            const media = post._embedded['wp:featuredmedia'][0];
            if (media && media.source_url) {
                media.source_url = await downloadImage(media.source_url);
            }
        }

        if (post.acf) {
            post.acf = await processAllImages(post.acf);
        }

        const lang = post.acf?.lang || post.meta?.lang || 'pl'

        const compactPost = {
            id: post.id,
            title: post.title?.rendered || '',
            acf: post.acf || '',
            slug: post.slug,
            excerpt: post.excerpt?.rendered || '',
            content: post.content?.rendered || '',
            date: post.date,
            featured_media: post._embedded && post._embedded['wp:featuredmedia'] ? post._embedded['wp:featuredmedia'][0].source_url : post.featured_media,
            order: post.acf?.order ?? post.meta?.order ?? 0
        }

        if (!aggregatedPosts[lang]) aggregatedPosts[lang] = []
        aggregatedPosts[lang].push(compactPost)

        const routePath = lang === 'pl' ? `/post/${post.id}` : `/${lang}/post/${post.id}`
        const jsonPath = lang === 'pl' ? `post/${post.id}.json` : `${lang}/post/${post.id}.json`

        saveNestedJson(jsonPath, post)
        // generatedRoutes.push(routePath)
    }

    for (const [lang, postsArray] of Object.entries(aggregatedPosts)) {
        postsArray.sort((a,b) => a.order - b.order);

        const allJsonPath = lang === 'pl' ? `post/all.json` : `${lang}/post/all.json`
        saveNestedJson(allJsonPath, postsArray)
    }

    // === 3. TECHNOLOGIES (CPT) ===
    const technologies = await fetchAllPages(`${API_URL}/technology?_embed&acf_format=standard`)
    const aggregatedTechs = {}

    for (const tech of technologies) {
        if (tech._embedded && tech._embedded['wp:featuredmedia']) {
            const media = tech._embedded['wp:featuredmedia'][0];
            if (media && media.source_url) {
                media.source_url = await downloadImage(media.source_url);
            }
        }

        if (tech.acf) {
            tech.acf = await processAllImages(tech.acf);
        }

        const lang = tech.acf?.lang || tech.meta?.lang || 'pl'

        const compactTech = {
            id: tech.id,
            title: tech.title?.rendered || '',
            slug: tech.slug,
            excerpt: tech.excerpt?.rendered || '',
            content: tech.content?.rendered || '',
            date: tech.date,
            featured_media: tech._embedded && tech._embedded['wp:featuredmedia'] ? tech._embedded['wp:featuredmedia'][0].source_url : tech.featured_media,
            order: tech.acf?.order ?? tech.meta?.order ?? 0
        }

        if (!aggregatedTechs[lang]) aggregatedTechs[lang] = []
        aggregatedTechs[lang].push(compactTech)

        const jsonPath = lang === 'pl' ? `technology/${tech.id}.json` : `${lang}/technology/${tech.id}.json`

        saveNestedJson(jsonPath, tech)
    }

    for (const [lang, techsArray] of Object.entries(aggregatedTechs)) {
        techsArray.sort((a, b) => a.order - b.order)

        const allJsonPath = lang === 'pl' ? `technology/all.json` : `${lang}/technology/all.json`
        saveNestedJson(allJsonPath, techsArray)
    }

    const routesFilePath = path.join(publicDataDir, 'routes.json');
    fs.writeFileSync(routesFilePath, JSON.stringify(generatedRoutes));
    console.log(`Zakończono pobieranie. Wygenerowano ${generatedRoutes.length} ścieżek.`);
}

run();