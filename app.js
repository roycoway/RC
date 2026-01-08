const DATA_URL = 'data.json'; // Your daily updated file
let allCustomers = [];

// Fetch data from JSON and save to IndexedDB for offline use
async function loadData() {
    try {
        const response = await fetch(DATA_URL + '?t=' + Date.now()); // avoid old cache
        const data = await response.json();
        allCustomers = data;
        saveToIndexedDB(data);
        displayData(data);
        document.getElementById('status').textContent = 'Data loaded (' + data.length + ' customers)';
    } catch (e) {
        // Offline or error → load from IndexedDB
        const offlineData = await loadFromIndexedDB();
        if (offlineData && offlineData.length > 0) {
            allCustomers = offlineData;
            displayData(offlineData);
            document.getElementById('status').textContent = 'Offline mode – using last saved data';
        } else {
            document.getElementById('status').textContent = 'No data available offline yet';
        }
    }
}

// Simple IndexedDB functions to save/load data offline
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CustomerDB', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('data', {keyPath: 'version'});
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveToIndexedDB(data) {
    const db = await openDB();
    const tx = db.transaction('data', 'readwrite');
    tx.objectStore('data').put({version: Date.now(), customers: data});
}

async function loadFromIndexedDB() {
    const db = await openDB();
    const tx = db.transaction('data');
    const store = tx.objectStore('data');
    const all = await store.getAll();
    return all.length > 0 ? all[0].customers : null;
}

// Display table
function displayData(customers) {
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    
    if (customers.length === 0) {
        tableBody.innerHTML = '<tr><td>No customers found</td></tr>';
        return;
    }

    // Create header from first row keys
    const headers = Object.keys(customers[0]);
    tableHead.innerHTML = '<tr>' + headers.map(h => `<th>${h.replace('_', ' ')}</th>`).join('') + '</tr>';

    // Filter for current user? (we can add login later if needed)
    // For now show all, or you can filter by team member name if column exists

    tableBody.innerHTML = customers.map(customer => 
        '<tr>' + headers.map(h => `<td>${customer[h] || ''}</td>`).join('') + '</tr>'
    ).join('');
}

// Search function
document.getElementById('search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allCustomers.filter(c => 
        Object.values(c).some(v => String(v).toLowerCase().includes(term))
    );
    displayData(filtered);
});

loadData(); // Start loading when page opens