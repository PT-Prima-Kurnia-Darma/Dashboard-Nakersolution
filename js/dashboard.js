// js/dashboard.js
import * as api from './services/api.js';
import { getToken, removeToken } from './utils/session.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) {
        window.location.href = '/index.html';
        return;
    }

    const reportsTbody = document.getElementById('reports-tbody');
    const statusContainer = document.getElementById('status-container');
    const logoutButton = document.getElementById('logoutButton');
    const searchInput = document.getElementById('search-input');
    const paginationControls = document.getElementById('pagination-controls');
    const paginationInfo = document.getElementById('pagination-info');
    const pageSizeSelect = document.getElementById('page-size-select');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');

    let masterAuditList = [];
    let currentDisplayList = [];
    let currentPage = 1;
    let isLoading = false;
    let debounceTimer;

    const downloadFunctionMap = {
        'forklift-laporan': api.downloadLaporanForklift,
        'forklift-berita acara dan pemeriksaan pengujian': api.downloadBapForklift,
        'mobile crane-laporan': api.downloadLaporanMobileCrane,
        'mobile crane-berita acara dan pemeriksaan pengujian': api.downloadBapMobileCrane,
        'gantry crane-laporan': api.downloadLaporanGantryCrane,
        'gantry crane-berita acara dan pemeriksaan pengujian': api.downloadBapGantryCrane,
        'overhead crane-laporan': api.downloadLaporanOverheadCrane,
        'overhead crane-berita acara dan pemeriksaan pengujian': api.downloadBapOverheadCrane,
        'gondola-laporan': api.downloadLaporanGondola,
        'gondola-berita acara dan pemeriksaan pengujian': api.downloadBapGondola,
        'elevator-laporan': api.downloadLaporanElevator,
        'elevator-berita acara dan pemeriksaan pengujian': api.downloadBapElevator,
        'eskalator-laporan': api.downloadLaporanEskalator,
        'eskalator-berita acara dan pemeriksaan pengujian': api.downloadBapEskalator,
        'instalasi penyalur petir-laporan': api.downloadLaporanInstalasiPetir,
        'instalasi penyalur petir-berita acara dan pemeriksaan pengujian': api.downloadBapInstalasiPetir,
        'instalasi petir-laporan': api.downloadLaporanInstalasiPetir,
        'instalasi petir-berita acara dan pemeriksaan pengujian': api.downloadBapInstalasiPetir,
        'instalasi listrik-laporan': api.downloadLaporanInstalasiListrik,
        'instalasi listrik-berita acara dan pemeriksaan pengujian': api.downloadBapInstalasiListrik,
        'instalasi proteksi kebakaran-laporan': api.downloadLaporanProteksiKebakaran,
        'instalasi proteksi kebakaran-berita acara dan pemeriksaan pengujian': api.downloadBapProteksiKebakaran,
        'pubt-laporan': api.downloadLaporanPubt,
        'pubt-berita acara dan pemeriksaan pengujian': api.downloadBapPubt,
        'pesawat uap dan bejana tekan-laporan': api.downloadLaporanPubt,
        'pesawat uap dan bejana tekan-berita acara dan pemeriksaan pengujian': api.downloadBapPubt,
        'motor diesel-laporan': api.downloadLaporanMotorDiesel,
        'motor diesel-berita acara dan pemeriksaan pengujian': api.downloadBapMotorDiesel,
        'mesin-laporan': api.downloadLaporanPtpMesin,
        'mesin-berita acara dan pemeriksaan pengujian': api.downloadBapPtpMesin,
    };

    function showStatus(message, isError = false) {
        statusContainer.innerHTML = message;
        statusContainer.className = `text-center p-5 ${isError ? 'text-danger' : 'text-muted'}`;
        reportsTbody.innerHTML = '';
        if (paginationControls) paginationControls.style.display = 'none';
    }

    function updatePagination() {
        const pageSize = parseInt(pageSizeSelect.value, 10);
        const totalItems = currentDisplayList.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;

        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage >= totalPages;

        const startItem = (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(startItem + pageSize - 1, totalItems);

        if (totalItems > 0) {
            paginationInfo.textContent = `Menampilkan ${startItem}-${endItem} dari ${totalItems} data.`;
            paginationControls.style.display = 'flex';
        } else {
            paginationControls.style.display = 'none';
        }
    }

    function highlightText(text, searchTerm) {
        if (!searchTerm || !text) return text;
        const regex = new RegExp(searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        return text.replace(regex, `<mark>$&</mark>`);
    }

    function renderCurrentPage() {
        const pageSize = parseInt(pageSizeSelect.value, 10);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageItems = currentDisplayList.slice(startIndex, endIndex);
        populateTable(pageItems, startIndex);
        updatePagination();
    }

    function populateTable(audits, startIndex) {
        const searchTerm = searchInput.value.trim();
        if (!audits || audits.length === 0) {
            if (searchTerm) {
                showStatus(`No results found for "${searchTerm}".`);
            } else {
                showStatus('No audit data available.');
            }
            return;
        }

        statusContainer.className = 'd-none';
        reportsTbody.innerHTML = '';

        audits.forEach((audit, index) => {
            const tr = document.createElement('tr');
            const itemNumber = startIndex + index + 1;
            const docType = audit.documentType || 'N/A';
            const inspectionType = audit.subInspectionType || 'N/A';
            
            const companyName = 
                (audit.generalData && audit.generalData.ownerName) || 
                (audit.generalData && audit.generalData.companyName) || 
                (audit.ownerData && audit.ownerData.companyName) || 
                'N/A';

            const createdAtDate = new Date(audit.createdAt).toLocaleDateString('id-ID', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            tr.innerHTML = `
                <td class="ps-4">${itemNumber}</td>
                <td class="text-uppercase fw-bold">${highlightText(docType, searchTerm)}</td>
                <td>${highlightText(inspectionType, searchTerm)}</td>
                <td>${highlightText(companyName, searchTerm)}</td>
                <td>${createdAtDate}</td>
                <td class="text-center pe-4">
                    <button class="btn btn-sm btn-primary download-btn" title="Unduh Dokumen">
                        <i class="fas fa-download"></i>
                    </button>
                </td>
            `;

            const downloadBtn = tr.querySelector('.download-btn');
            downloadBtn.addEventListener('click', async () => {
                const key = `${inspectionType.toLowerCase()}-${docType.toLowerCase()}`;
                const downloadFunction = downloadFunctionMap[key];
                if (!downloadFunction) {
                    alert(`Download handler not found for: ${inspectionType} (${docType})`);
                    return;
                }

                let finalDocType = docType.toLowerCase().includes('berita acara') ? 'BAP' : 'LAPORAN';
                let finalInspectionType = inspectionType.toUpperCase().replace(/\s+/g, '_');
                let finalCompanyName = companyName.toUpperCase().replace(/\s+/g, '_');
                const fileName = `${finalDocType}-${finalInspectionType}-${finalCompanyName}-${audit.id}`;

                downloadBtn.disabled = true;
                downloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
                try {
                    await downloadFunction(audit.id, fileName);
                } catch (error) {
                    alert(`Download failed: ${error.message}`);
                } finally {
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
                }
            });
            reportsTbody.appendChild(tr);
        });
    }

    async function fetchAllData() {
        if (isLoading) return;
        isLoading = true;
        showStatus('Loading all audit data, please wait...');
        let allData = [];
        let page = 1;
        let hasMore = true;

        try {
            while(hasMore) {
                const response = await api.getAllAudits(page, 30);
                if (response && response.status === 'success' && Array.isArray(response.data)) {
                    allData.push(...response.data);
                    if (response.data.length < 30 || page >= response.paging.totalPages) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                    throw new Error(response.message || 'Failed to fetch all data.');
                }
            }
            masterAuditList = allData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            currentDisplayList = masterAuditList;
            renderCurrentPage();
        } catch (error) {
            showStatus(`Error loading data: ${error.message}`, true);
        } finally {
            isLoading = false;
        }
    }

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            currentPage = 1;
            if (searchTerm) {
                currentDisplayList = masterAuditList.filter(audit => {
                    const companyName = 
                        ((audit.generalData && audit.generalData.ownerName) || 
                        (audit.generalData && audit.generalData.companyName) || 
                        (audit.ownerData && audit.ownerData.companyName) || 
                        '').toLowerCase();
                    
                    const docType = (audit.documentType || '').toLowerCase();
                    const inspectionType = (audit.subInspectionType || '').toLowerCase();

                    return companyName.includes(searchTerm) || docType.includes(searchTerm) || inspectionType.includes(searchTerm);
                });
            } else {
                currentDisplayList = masterAuditList;
            }
            renderCurrentPage();
        }, 300);
    });

    pageSizeSelect.addEventListener('change', () => {
        currentPage = 1;
        renderCurrentPage();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderCurrentPage();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const pageSize = parseInt(pageSizeSelect.value, 10);
        const totalPages = Math.ceil(currentDisplayList.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            renderCurrentPage();
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            await api.logout();
        } finally {
            removeToken();
            window.location.href = '/index.html';
        }
    });

    fetchAllData();
});