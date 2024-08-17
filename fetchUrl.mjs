import fetch from 'node-fetch'; // ESモジュールとしてインポート

export async function fetchUrl(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Error fetching URL:', error);
        throw error;
    }
}
