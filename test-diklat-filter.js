import { parseISO, format } from 'date-fns';

const filters = {
  searchQuery: '',
  periode: new Date(2026, 5, 1).toISOString(),
  type: 'Bulanan',
  unitFilter: 'Semua Unit'
};

const session = {
  id: '613993a4-40c8-40a4-81c2-e828302aae63',
  waktu: '2026-06-21T05:03:00+00:00',
  unit: 'Gedung baru lantai 2',
  judul: 'Pencegahan dan Pengendalian Infeksi di Lingkungan RSUD Al-Mulk',
  observer: 'Adit'
};

const query = (filters.searchQuery || "").toLowerCase();
const matchSearch = query === "" || 
  (session.judul || "").toLowerCase().includes(query) ||
  (session.observer || "").toLowerCase().includes(query) ||
  (session.unit || "").toLowerCase().includes(query);

const matchUnit = !filters.unitFilter || 
  filters.unitFilter === "Semua Unit" || 
  session.unit === filters.unitFilter;

const sessionDate = new Date(session.waktu);
const filterDate = new Date(filters.periode || new Date().toISOString());

let matchPeriod = true;

if (filters.type === "Bulanan") {
  matchPeriod = sessionDate.getMonth() === filterDate.getMonth() &&
                sessionDate.getFullYear() === filterDate.getFullYear();
}

console.log({
  matchSearch, matchUnit, matchPeriod, sessionDate: sessionDate.getMonth(), filterDate: filterDate.getMonth()
});
