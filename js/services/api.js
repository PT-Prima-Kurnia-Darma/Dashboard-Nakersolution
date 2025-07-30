// js/services/api.js
import { getAuthHeader, removeToken } from '../utils/session.js';

let BASE_URL = '';

async function initializeApi() {
    if (BASE_URL) return;
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        BASE_URL = config.baseUrl;
        if (!BASE_URL) throw new Error('BASE_URL is not defined in server config.');
    } catch (error) {
        console.error('Could not fetch API configuration from server.', error);
        document.body.innerHTML = '<h1 style="text-align:center; margin-top: 50px;">Error: Could not load server configuration.</h1>';
        throw new Error('Failed to initialize API.');
    }
}

async function apiFetch(endpoint, options = {}) {
    await initializeApi();
    
    const defaultOptions = { headers: getAuthHeader() };
    const mergedOptions = { ...defaultOptions, ...options };
    mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };

    const response = await fetch(`${BASE_URL}${endpoint}`, mergedOptions);

    if (response.status === 401) {
        removeToken();
        window.location.href = '/index.html';
        throw new Error('Session expired. Please log in again.');
    }
    return response;
}

export const login = async (username, password) => {
    await initializeApi();
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Invalid username or password.' }));
        throw new Error(errorData.message);
    }
    return response.json();
};

export const logout = () => apiFetch('/auth/logout', { method: 'POST' });

export const getAllAudits = async (page = 1, size = 10) => {
    const response = await apiFetch(`/audits/all?page=${page}&size=${size}`);
    if (!response.ok) throw new Error('Failed to fetch audit data.');
    return response.json();
};

async function downloadHelper(path, id, fileName) {
    const response = await apiFetch(`${path}/${id}`);
    if (!response.ok) throw new Error(`Download failed. Status: ${response.status}`);
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

const createDownloadFunction = (path) => (id, fileName) => downloadHelper(path, id, fileName);

export const downloadLaporanElevator = createDownloadFunction('/elevatorEskalator/elevator/laporan/download');
export const downloadBapElevator = createDownloadFunction('/elevatorEskalator/elevator/bap/download');
export const downloadLaporanEskalator = createDownloadFunction('/elevatorEskalator/eskalator/laporan/download');
export const downloadBapEskalator = createDownloadFunction('/elevatorEskalator/eskalator/bap/download');
export const downloadLaporanForklift = createDownloadFunction('/paa/forklift/laporan/download');
export const downloadBapForklift = createDownloadFunction('/paa/forklift/bap/download');
export const downloadLaporanMobileCrane = createDownloadFunction('/paa/mobileCrane/laporan/download');
export const downloadBapMobileCrane = createDownloadFunction('/paa/mobileCrane/bap/download');
export const downloadLaporanGantryCrane = createDownloadFunction('/paa/gantryCrane/laporan/download');
export const downloadBapGantryCrane = createDownloadFunction('/paa/gantryCrane/bap/download');
export const downloadLaporanGondola = createDownloadFunction('/paa/gondola/laporan/download');
export const downloadBapGondola = createDownloadFunction('/paa/gondola/bap/download');
export const downloadLaporanOverheadCrane = createDownloadFunction('/paa/overHeadCrane/laporan/download');
export const downloadBapOverheadCrane = createDownloadFunction('/paa/overHeadCrane/bap/download');
export const downloadLaporanInstalasiPetir = createDownloadFunction('/petirListrik/instalasiPetir/laporan/download');
export const downloadBapInstalasiPetir = createDownloadFunction('/petirListrik/instalasiPetir/bap/download');
export const downloadLaporanInstalasiListrik = createDownloadFunction('/petirListrik/instalasiListrik/laporan/download');
export const downloadBapInstalasiListrik = createDownloadFunction('/petirListrik/instalasiListrik/bap/download');
export const downloadLaporanProteksiKebakaran = createDownloadFunction('/proteksiKebakaran/laporan/download');
export const downloadBapProteksiKebakaran = createDownloadFunction('/proteksiKebakaran/bap/download');
export const downloadLaporanPubt = createDownloadFunction('/pubt/laporan/download');
export const downloadBapPubt = createDownloadFunction('/pubt/bap/download');
export const downloadLaporanMotorDiesel = createDownloadFunction('/ptp/motorDiesel/laporan/download');
export const downloadBapMotorDiesel = createDownloadFunction('/ptp/motorDiesel/bap/download');
export const downloadLaporanPtpMesin = createDownloadFunction('/ptp/mesin/laporan/download');
export const downloadBapPtpMesin = createDownloadFunction('/ptp/mesin/bap/download');